"""Assess additional profiles or the full pool; publish only validated complete runs."""

import copy
import json
import math
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from uuid import uuid4

from .evidence import model_person
from .jobs import BUSY, JobFlow, digest, now
from .model import ask_claude
from .prompts import prompt_text
from .schemas import STRING, check_schema, obj, score_schema
from .scoring import make_movement
from .storage import read_json, require, write_json

MAX_BATCH_SIZE = 1
PARALLEL_BATCHES = 32
ASSESSMENT_EFFORT = "medium"
ASSESSMENT_MODEL = "claude-opus-5"


def selection_order(person):
    """Sampling metadata is not ability evidence. Preserve explicit legacy priorities."""
    priority = person.get("selection_priority", person["source"].get("selection_priority", 0))
    try:
        priority = float(priority)
    except (TypeError, ValueError):
        priority = 0
    return (-priority, -person.get("richness", 0), person["person_key"])


def assessment_schema(dimensions, include_mission=True, *, source_fields=None, person_keys=None):
    schema = score_schema(dimensions)
    properties = schema["properties"]["candidates"]["items"]["properties"]
    if source_fields is not None:
        for dimension in properties["dimensions"]["properties"].values():
            dimension["properties"]["source_fields"] = (
                {"type": "array", "items": {"type": "string", "enum": sorted(source_fields)}}
                if source_fields
                else {"type": "array", "items": STRING, "maxItems": 0}
            )
    if person_keys is not None:
        properties["person_key"] = {"type": "string", "enum": list(person_keys)}
        schema["properties"]["candidates"].update(
            minItems=len(person_keys), maxItems=len(person_keys)
        )
    properties["questions"] = {"type": "array", "items": STRING, "minItems": 2, "maxItems": 4}
    properties.update(
        {
            "internal": {"type": "boolean"},
            "internal_note": STRING,
            "quality_concern": {"type": "boolean"},
            "quality_note": STRING,
            "lean": STRING,
        }
    )
    if include_mission and "mission" not in dimensions:
        properties["mission"] = obj(
            {
                "basis": {
                    "type": "string",
                    "enum": ["evidence", "no_data", "negative"],
                },
                "note": STRING,
            }
        )
    schema["properties"]["candidates"]["items"]["required"] = list(properties)
    return schema


def assessment_person(person, review=None):
    payload = model_person(person, review)
    previous = person.get("assessment") or {}
    # The final pass is fresh: preserve evidence, not earlier scores or ranking.
    payload["assessment"] = None
    payload["web_findings"] = previous.get("web_findings", [])
    payload["prior_quality_feedback"] = {
        "internal": bool(person.get("internal") or previous.get("internal")),
        "internal_note": previous.get("internal_note", ""),
        "quality_concern": previous.get("quality_concern", False),
        "quality_note": previous.get("quality_note", "") if previous.get("quality_concern") else "",
        "adverse_evidence": [
            v["evidence"]
            for v in previous.get("dimensions", {}).values()
            if v["basis"] == "negative"
        ],
    }
    return payload


def allowed_source_fields(person, review=None):
    fields = set(model_person(person)["source"])
    if (review or {}).get("notes", "").strip():
        fields.add("manager_feedback")
    previous = person.get("assessment") or {}
    if previous.get("web_findings"):
        fields.add("web_findings")
    if previous:
        fields.add("prior_quality_feedback")
    return fields


def validate_batch(answer, batch, dimensions, reviews, include_mission=True):
    check_schema(answer, assessment_schema(dimensions, include_mission))
    scored = answer["candidates"]
    require(
        len(scored) == len(batch)
        and {p["person_key"] for p in scored} == {p["person_key"] for p in batch},
        "AI batch person keys did not round-trip. Retry this run.",
    )
    people = {p["person_key"]: p for p in batch}
    for score in scored:
        person = people[score["person_key"]]
        previous = person.get("assessment") or {}
        fields = allowed_source_fields(person, reviews.get(score["person_key"]))
        for dimension in score["dimensions"].values():
            require(
                dimension["basis"] != "no_data" or dimension["score"] == 0,
                "Unknown evidence must score zero",
            )
            require(dimension["evidence"].strip(), "AI omitted dimension evidence")
            require(
                set(dimension["source_fields"]) <= fields,
                "AI cited an unavailable source field",
            )
            require(
                dimension["basis"] == "no_data" or dimension["source_fields"],
                "AI supplied a score without evidence",
            )
        internal = (
            person.get("internal")
            or (person["source"].get("internal") is True)
            or previous.get("internal")
            or score["internal"]
        )
        adverse = (
            previous.get("quality_concern")
            or score["quality_concern"]
            or any(v["basis"] == "negative" for v in score["dimensions"].values())
        )
        adverse = adverse or score.get("mission", {}).get("basis") == "negative"
        require(
            not score["flags"]["immediate_fit"]["value"] or not (internal or adverse),
            "Internal or adverse evidence blocks immediate fit",
        )
        require(
            score["summary"].strip()
            and 2 <= len(score["questions"]) <= 4
            and all(q.strip() for q in score["questions"]),
            "AI must supply a summary and 2–4 investigation questions",
        )
        require(
            all(v["note"].strip() for v in score["flags"].values()),
            "AI must explain every flag",
        )
    return scored


def assessed_person(person, score, weights, criteria_version, reviews):
    """Apply one validated result identically in the live view and final snapshot."""
    person = copy.deepcopy(person)
    old = person.get("assessment") or {}
    internal = bool(
        person.get("internal")
        or (person["source"].get("internal") is True)
        or old.get("internal")
        or score["internal"]
    )
    adverse = (
        old.get("quality_concern", False)
        or score["quality_concern"]
        or any(d["basis"] == "negative" for d in score["dimensions"].values())
        or score.get("mission", {}).get("basis") == "negative"
    )
    person["assessment"] = {
        **score,
        "internal": internal,
        "quality_concern": adverse,
        "web_findings": old.get("web_findings", []),
        "manager_feedback": reviews.get(person["person_key"], {}).get("notes", ""),
    }
    if old.get("quality_concern") and not score["quality_concern"]:
        person["assessment"]["quality_note"] = old.get(
            "quality_note", "See prior quality feedback."
        )
    person["internal"] = internal
    person["enriched"] = bool(old.get("web_findings"))
    person["assessed_with"] = criteria_version
    person["overall"] = round(
        sum(weights[d] * v["score"] for d, v in score["dimensions"].items()) / 5,
        3,
    )
    person["coverage"] = sum(
        weights[d] for d, v in score["dimensions"].items() if v["basis"] != "no_data"
    )
    return person


class AssessmentFlow(JobFlow):
    def __init__(self, store, runner=ask_claude):
        super().__init__(store, runner, folder="assessments")

    def _require_idle_feedback(self):
        job = self.store.feedback._latest()
        require(
            not job or job["status"] not in BUSY,
            "Feedback is still being reviewed. Wait for it to finish before assessing more people.",
        )

    def start(self, count, revision):
        require(
            type(count) is int and count > 0,
            "Choose a whole number of additional people, at least 1.",
        )
        return self._start(count, revision, "more")

    def start_full(self, revision):
        return self._start(None, revision, "full")

    def start_feedback(self, proposal, dataset, reviews):
        return self._start(
            None, dataset["revision"], "feedback", approved=(proposal, dataset, reviews)
        )

    def _start(self, count, revision, mode, *, approved=None):
        with self.store.lock:
            last = self._latest()
            if last and last["status"] in BUSY:
                return self._public(last)  # A double click cannot buy another run.
            if not approved:
                self._require_idle_feedback()
            dataset = approved[1] if approved else self.store.dataset()
            require(
                revision == read_json(self.store.local / "current.json")["revision"],
                "The ranking changed. Refresh data before starting another batch.",
            )
            remaining = sorted(
                [p for p in dataset["people"] if not p["assessment"]],
                key=selection_order,
            )
            candidates = (
                sorted(dataset["people"], key=selection_order) if mode == "full" else remaining
            )
            if mode == "feedback":
                candidates = [p for p in dataset["people"] if p["assessment"]]
            if mode in {"full", "feedback"}:
                count = len(candidates)
            require(count > 0 or mode == "feedback", "There are no people in this dataset.")
            require(
                count <= len(candidates),
                f"Only {len(remaining):,} people remain unassessed. Choose that number or fewer.",
            )
            job = {
                "id": uuid4().hex,
                "status": "applying",
                "created_at": now(),
                "started_at": now(),
                "base_revision": revision,
                "mode": mode,
                "count": count,
                "completed": 0,
                # Keep this layout on retries, including when future defaults change.
                "batch_size": min(MAX_BATCH_SIZE, max(1, math.ceil(count / PARALLEL_BATCHES))),
                "parallel_batches": PARALLEL_BATCHES,
                "effort": ASSESSMENT_EFFORT,
                "model": ASSESSMENT_MODEL,
                "fast_mode": True,
                "ready_count": 0,
                "message": f"Evaluating all {count:,} people afresh…"
                if mode == "full"
                else f"Assessing {count:,} additional profiles…",
                "before_count": len(dataset["people"]) - len(remaining),
                "criteria_version": digest(dataset["rubric"]),
            }
            if approved:
                job.update(
                    feedback_job=approved[0]["id"],
                    corrections=approved[0]["proposal"]["corrections"],
                    message=f"Updating all {count:,} assessed people with your approved feedback. Your previous ranking stays in place until everyone is ready.",
                )
            path = self._path(job["id"])
            write_json(
                path / "input.json",
                {
                    "dataset": dataset,
                    "reviews": approved[2] if approved else self.store.flags(),
                    "person_keys": [p["person_key"] for p in candidates[:count]],
                },
                exclusive=True,
            )
            (path / "rubric.md").write_text(dataset["rubric"])
            self._write(job)
            write_json(self.root / "current.json", {"job_id": job["id"]})
            if approved:
                proposal = approved[0]
                proposal.update(status="applying", next_job_id=job["id"], message=job["message"])
                self.store.feedback._write(proposal)
            self._launch(self._assess, job["id"])
            return self._public(job)

    def retry(self, job_id):
        with self.store.lock:
            job = self._latest()
            require(
                job and job["id"] == job_id,
                "This is no longer the latest assessment run.",
            )
            if job["status"] in BUSY:
                return self._public(job)
            require(
                job["status"] == "error",
                "Only an interrupted or failed run can be retried.",
            )
            self._require_idle_feedback()
            require(
                read_json(self.store.local / "current.json")["revision"] == job["base_revision"],
                "The rubric or ranking changed. Start a new batch using the current criteria.",
            )
            job.update(
                status="applying",
                started_at=now(),
                elapsed_seconds=0,
                message="Continuing from validated, saved batches…",
            )
            self._write(job)
            self._launch(self._assess, job_id)
            return self._public(job)

    def cancel(self, job_id):
        with self.store.lock:
            job = self._latest()
            require(
                job and job["id"] == job_id,
                "This assessment is no longer current. Refresh to see the latest run.",
            )
            if job["status"] not in BUSY:
                return self._public(job)
            self.cancel_event.set()
            job.update(
                status="cancelling",
                message="Stopping the assessment… Your previous ranking and saved reviews will stay unchanged.",
            )
            self._write(job)
            return self._public(job)

    def results(self, job_id, after=0):
        """Read bounded, append-only result pages without activating a partial ranking."""
        require(type(after) is int and after >= 0, "Invalid results position. Refresh the page.")
        with self.store.lock:
            job = self._latest()
            require(
                job and job["id"] == job_id,
                "This assessment is no longer current. Refresh to see the latest run.",
            )
            current = read_json(self.store.local / "current.json")["revision"]
            if (
                job["status"] not in {"applying", "cancelling", "error"}
                or current != job["base_revision"]
            ):
                return {
                    "job_id": job_id,
                    "base_revision": job["base_revision"],
                    "results": [],
                    "cursor": 0,
                    "available": 0,
                }
            available = job.get("ready_count", 0)
            require(after <= available, "Saved assessment progress changed. Refresh the page.")
            end = min(after + 100, available)
            path = self._path(job_id) / "ready"
            return {
                "job_id": job_id,
                "base_revision": job["base_revision"],
                "results": [read_json(path / f"{i:06}.json") for i in range(after, end)],
                "cursor": end,
                "available": available,
            }

    def _batch(self, path, index, batch, dataset, reviews, effort=None, model=None, fast_mode=None):
        started = time.monotonic()
        self._check_cancelled()
        include_mission = dataset.get("schema_version", 1) < 2
        cached = path / "scores" / f"batch-{index:04}.json"
        if cached.exists():
            answer = read_json(cached)
        else:
            prompt = prompt_text("assessment")
            options = (
                {
                    "cancel_event": self.cancel_event,
                    "effort": effort,
                    "model": model,
                    "fast_mode": fast_mode,
                    "on_metrics": lambda metrics: write_json(
                        path / "metrics" / f"batch-{index:04}.json", metrics
                    ),
                }
                if self.runner is ask_claude
                else {}
            )
            answer = self.runner(
                prompt
                + json.dumps(
                    {
                        "rubric": dataset["rubric"],
                        "labels": dataset["labels"],
                        "role": dataset.get("role", {}),
                        "benchmarks": dataset["workspace"]["calibration"],
                        "people": [
                            assessment_person(p, reviews.get(p["person_key"])) for p in batch
                        ],
                    },
                    ensure_ascii=False,
                ),
                assessment_schema(
                    dataset["weights"],
                    include_mission,
                    source_fields=set().union(
                        *(allowed_source_fields(p, reviews.get(p["person_key"])) for p in batch)
                    ),
                    person_keys=[p["person_key"] for p in batch],
                ),
                **options,
            )
        self._check_cancelled()
        scored = validate_batch(answer, batch, dataset["weights"], reviews, include_mission)
        if not cached.exists():
            write_json(cached, answer, exclusive=True)
        return scored, round(time.monotonic() - started, 3)

    def _assess(self, job_id):
        self._check_cancelled()
        path = self._path(job_id)
        inputs, job = read_json(path / "input.json"), read_json(path / "job.json")
        previous, reviews = inputs["dataset"], inputs["reviews"]
        people = {p["person_key"]: p for p in previous["people"]}
        selected = [people[k] for k in inputs["person_keys"]]
        scores = {}
        previews = []
        ready_keys = {
            read_json(file)["person_key"] for file in sorted((path / "ready").glob("*.json"))
        }
        # Older jobs keep their original 20-person cache layout when retried.
        batch_size = job.get("batch_size", 20)
        parallel = job.get("parallel_batches", 2)
        batch_count = math.ceil(len(selected) / batch_size)
        completed_batches = 0
        started = time.monotonic()
        with ThreadPoolExecutor(max_workers=parallel) as executor:
            futures = [
                executor.submit(
                    self._batch,
                    path,
                    i // batch_size,
                    selected[i : i + batch_size],
                    previous,
                    reviews,
                    job.get("effort"),
                    job.get("model"),
                    job.get("fast_mode"),
                )
                for i in range(0, len(selected), batch_size)
            ]
            try:
                for future in as_completed(futures):
                    batch_scores, batch_seconds = future.result()
                    scores.update({score["person_key"]: score for score in batch_scores})
                    completed_batches += 1
                    for score in batch_scores:
                        person = people[score["person_key"]]
                        if person["person_key"] not in ready_keys:
                            ready_person = assessed_person(
                                person, score, previous["weights"], job["criteria_version"], reviews
                            )
                            # Only score fields travel over the live-results endpoint.
                            # Profile/source data is already in the browser's base snapshot.
                            update = {
                                key: ready_person[key]
                                for key in (
                                    "person_key",
                                    "assessment",
                                    "overall",
                                    "coverage",
                                    "internal",
                                    "enriched",
                                    "assessed_with",
                                )
                            }
                            write_json(
                                path / "ready" / f"{len(ready_keys):06}.json",
                                update,
                                exclusive=True,
                            )
                            ready_keys.add(person["person_key"])
                        old = person.get("assessment") or {}
                        concerns = [
                            entry.get("quality_note", "")
                            for entry in (old, score)
                            if entry.get("quality_concern")
                        ]
                        concerns.extend(
                            v["evidence"]
                            for v in score["dimensions"].values()
                            if v["basis"] == "negative"
                        )
                        previews.append(
                            {
                                "person_key": person["person_key"],
                                "name": person["name"],
                                "overall": round(
                                    sum(
                                        previous["weights"][d] * v["score"]
                                        for d, v in score["dimensions"].items()
                                    )
                                    / 5,
                                    3,
                                ),
                                "summary": score["summary"],
                                "concerns": list(dict.fromkeys(c for c in concerns if c)),
                            }
                        )
                    # Keep status responses small, even for a whole-pool assessment.
                    previews = sorted(
                        previews,
                        key=lambda p: (-p["overall"], p["name"].casefold(), p["person_key"]),
                    )[:5]
                    label = (
                        "people afresh for the final ranking"
                        if job.get("mode") == "full"
                        else "previously assessed people with your approved feedback"
                        if job.get("mode") == "feedback"
                        else "additional profiles"
                    )
                    self._progress(
                        job_id,
                        completed=len(scores),
                        previews=previews,
                        ready_count=len(ready_keys),
                        completed_batches=completed_batches,
                        total_batches=batch_count,
                        last_batch_seconds=batch_seconds,
                        elapsed_seconds=round(time.monotonic() - started, 3),
                        message=f"Assessed {len(scores):,} of {job['count']:,} {label}. Finished people are ready to review below. The saved ranking updates when this run finishes.",
                    )
            except Exception:
                for future in futures:
                    future.cancel()
                raise
        self._check_cancelled()
        current = copy.deepcopy(previous)
        current.pop("workspace", None)
        for index, person in enumerate(current["people"]):
            if person["person_key"] not in scores:
                continue
            score = scores[person["person_key"]]
            current["people"][index] = assessed_person(
                person, score, current["weights"], job["criteria_version"], reviews
            )
        current["people"].sort(
            key=lambda p: (
                p["assessment"] is None,
                -(p["overall"] or 0),
                p["name"].casefold(),
                p["person_key"],
            )
        )
        last, rank = None, 0
        for index, person in enumerate(current["people"]):
            if not person["assessment"]:
                continue
            if person["overall"] != last:
                rank = index + 1
            person["rank"], last = rank, person["overall"]
        current.update(
            revision="assess-" + job_id,
            run="assess-" + job_id,
            created_at=now(),
            criteria_version=job["criteria_version"],
            assessment_job=job_id,
            search_stage="final" if job.get("mode") == "full" else "calibration",
            newly_assessed_keys=inputs["person_keys"],
            parent_revision=previous["revision"],
        )
        current.pop("base_hashes", None)
        total_assessed = sum(bool(p["assessment"]) for p in current["people"])
        current["manifest"]["sample_count"] = total_assessed
        current["manifest"]["selection"] = (
            f"{job['before_count'] + job['count']:,} profiles assessed. Latest expansion: {job['count']:,} previously unassessed profiles, ordered by existing role-relevance signals and profile detail. Selection priority is not a candidate score."
        )
        if job.get("mode") == "full":
            current["manifest"]["selection"] = (
                f"Final search: all {len(current['people']):,} people evaluated afresh using one current rubric."
            )
        if job.get("mode") == "feedback":
            current["manifest"]["selection"] = (
                f"All {total_assessed:,} assessed people updated together using the approved feedback. "
                f"{len(current['people']) - total_assessed:,} people remain unassessed."
            )
        current["movement"] = make_movement(previous, current, job.get("corrections", []))
        added = [
            {
                "person_key": p["person_key"],
                "name": p["name"],
                "overall": p["overall"],
                "rank": p["rank"],
            }
            for p in current["people"]
            if p["person_key"] in scores
        ]
        current["movement"]["added"] = added
        with self.store.lock:
            self._check_cancelled()
            require(
                read_json(self.store.local / "current.json")["revision"] == job["base_revision"],
                "The rubric or ranking changed during assessment. This result was not activated. Start a new batch with the current criteria.",
            )
            write_json(
                self.store.local / "history" / (current["revision"] + ".json"),
                current,
                exclusive=True,
            )
            job.update(
                result_revision=current["revision"],
                added=added,
                ready_count=len(ready_keys),
                completed_batches=completed_batches,
                total_batches=batch_count,
                elapsed_seconds=round(time.monotonic() - started, 3),
            )
            self._write(job)
            write_json(self.store.local / "current.json", {"revision": current["revision"]})
            message = (
                f"Final ranking ready. All {len(scores):,} people were evaluated afresh using the current criteria."
                if job.get("mode") == "full"
                else f"Updated all {len(scores):,} assessed people. Every score now uses the same approved criteria."
                if job.get("mode") == "feedback"
                else f"Added {len(scores):,} newly assessed people. {total_assessed:,} of {len(current['people']):,} people are now assessed."
            )
            job.update(status="complete", completed=len(scores), message=message)
            self._write(job)
