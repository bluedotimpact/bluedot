"""Propose feedback lessons, then refresh the whole assessed shortlist on approval."""

import copy
import hashlib
import json
from uuid import uuid4

from .assessments import ASSESSMENT_EFFORT, ASSESSMENT_MODEL
from .evidence import model_person, reviewed
from .jobs import BUSY, JobFlow, digest, now
from .model import ask_claude
from .prompts import prompt_text
from .schemas import check_schema, proposal_schema
from .storage import read_json, require, write_json


class FeedbackFlow(JobFlow):
    def __init__(self, store, runner=ask_claude):
        super().__init__(store, runner, folder="feedback")

    def _latest(self):
        job = super()._latest()
        if job and job.get("next_job_id") and not job.get("learned_only"):
            # The assessment owns progress, cancellation, retry and publication.
            child = read_json(self.store.local / "assessments" / job["next_job_id"] / "job.json")
            for field in ("status", "message", "completed", "count", "result_revision"):
                if field in child:
                    job[field] = child[field]
        return job

    def _public(self, job):
        result = super()._public(job)
        if result and result["status"] == "ready":
            result["stale"] = not self._unchanged(job)
        return result

    def _unchanged(self, job):
        return (
            read_json(self.store.local / "current.json")["revision"] == job["base_revision"]
            and digest(self.store.flags()) == job["reviews_hash"]
        )

    def start(self, context=""):
        require(
            isinstance(context, str) and len(context) <= 20000,
            "Additional context must be at most 20,000 characters",
        )
        with self.store.lock:
            self._require_no_expansion()
            last = self._latest()
            if last and last["status"] in BUSY:
                return self._public(last)
            if (
                last
                and last["status"] == "ready"
                and self._unchanged(last)
                and context == last.get("context", "")
            ):
                return self._public(last)
            dataset, flags = self.store.dataset(), self.store.flags()
            feedback = reviewed(flags)
            require(
                feedback or context.strip(),
                "Add a star, decision or note to a candidate first, or describe your feedback below.",
            )
            job = {
                "id": uuid4().hex,
                "status": "reviewing",
                "message": "Reading your saved decisions and notes…",
                "created_at": now(),
                "base_revision": dataset["revision"],
                "reviews_hash": digest(flags),
                "context": context,
                "review_count": len(feedback),
                "sample_count": sum(bool(p["assessment"]) for p in dataset["people"]),
            }
            path = self._path(job["id"])
            write_json(
                path / "input.json",
                {"dataset": dataset, "reviews": flags},
                exclusive=True,
            )
            self._write(job)
            write_json(self.root / "current.json", {"job_id": job["id"]})
            self._launch(self._propose, job["id"])
            return self._public(job)

    def _propose(self, job_id):
        path = self._path(job_id)
        inputs, job = read_json(path / "input.json"), read_json(path / "job.json")
        dataset, flags = inputs["dataset"], reviewed(inputs["reviews"])
        people = [
            model_person(p, flags.get(p["person_key"]))
            for p in dataset["people"]
            if p["person_key"] in flags
        ]
        # Review all explicit feedback, plus a small slice of the ranking for context.
        calibration = [
            model_person(p)
            for p in dataset["people"]
            if p["assessment"] and p["person_key"] not in flags
        ][:15]
        prompt = prompt_text("feedback")
        schema = proposal_schema(dataset["weights"])
        payload = {
            "rubric": dataset["rubric"],
            "weights": dataset["weights"],
            "labels": dataset["labels"],
            "role": dataset.get("role", {}),
            "benchmarks": dataset["workspace"]["calibration"],
            "manager_context": job["context"],
            "reviewed_people": people,
            "current_top_sample": calibration,
        }
        options = (
            {"effort": ASSESSMENT_EFFORT, "model": ASSESSMENT_MODEL, "fast_mode": True}
            if self.runner is ask_claude
            else {}
        )
        answer = self.runner(prompt + json.dumps(payload, ensure_ascii=False), schema, **options)
        check_schema(answer, schema)
        keys = {p["person_key"] for p in dataset["people"]}
        for change in answer["changes"]:
            require(
                change["rule"].strip() and change["reason"].strip(),
                "AI proposed an empty rule",
            )
            require(set(change["person_keys"]) <= keys, "AI cited an unknown person")
        for correction in answer["corrections"]:
            require(correction["person_key"] in keys, "AI cited an unknown correction")
        self._progress(
            job_id,
            status="ready",
            proposal=answer,
            message="Review the proposed changes. Your ranking has not changed.",
        )

    def approve(self, job_id):
        with self.store.lock:
            job = self._latest()
            if job and job["id"] == job_id and job.get("next_job_id"):
                return self._public(job)  # Repeated clicks never start another refresh.
            self._require_no_expansion()
            require(
                job and job["id"] == job_id and job["status"] == "ready",
                "This proposal is no longer awaiting approval. Refresh its status.",
            )
            require(
                self._unchanged(job),
                "Your feedback or ranking changed. Review the latest feedback before approving.",
            )
            require(
                job["proposal"]["changes"] or job["proposal"]["corrections"],
                "There are no supported changes yet. Add specific reasons to your feedback.",
            )
            job["approved_at"] = now()
            self._apply(job)
            return self._public(self._latest())

    def _require_no_expansion(self):
        flow = getattr(self.store, "assessments", None)
        job = flow._latest() if flow else None
        require(
            not job or job["status"] not in BUSY,
            "Additional profiles are being assessed. Wait for that run before reviewing feedback.",
        )

    def dismiss(self, job_id):
        with self.store.lock:
            job = self._latest()
            require(
                job and job["id"] == job_id and job["status"] == "ready",
                "This proposal is no longer awaiting approval.",
            )
            job.update(
                status="dismissed",
                message="Kept the current rubric and ranking. Your feedback is still saved.",
            )
            self._write(job)
            return self._public(job)

    def _apply(self, job):
        # Stage the approved rubric. It becomes active with ALL refreshed scores.
        path = self._path(job["id"])
        inputs = read_json(path / "input.json")
        current = copy.deepcopy(inputs["dataset"])
        addendum = "\n\n## Approved review feedback · " + job["approved_at"] + "\n"
        for change in job["proposal"]["changes"]:
            addendum += (
                f"\n- [{change['dimension']}] {change['rule']}\n  Reason: {change['reason']}\n"
            )
        addendum += (
            "\nNamed feedback checks apply only to the named person. "
            "Investigate the evidence; never force a score or generalize a personal fact:\n"
        )
        addendum += json.dumps(job["proposal"]["corrections"], ensure_ascii=False)
        current["rubric"] += addendum
        (path / "rubric.md").write_text(current["rubric"])
        current["rubric_sha256"] = hashlib.sha256(current["rubric"].encode()).hexdigest()
        current["feedback_job"] = job["id"]
        self.store.assessments.start_feedback(job, current, inputs["reviews"])
