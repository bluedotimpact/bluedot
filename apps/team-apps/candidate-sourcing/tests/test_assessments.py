import copy
import json
import tempfile
import threading
import time
import unittest
from pathlib import Path
from unittest.mock import patch

from talent_sourcing.assessments import (
    MAX_BATCH_SIZE,
    PARALLEL_BATCHES,
    assessment_schema,
    selection_order,
)
from talent_sourcing.feedback import digest
from talent_sourcing.storage import read_json, write_json
from talent_sourcing.workspace import ReviewStore
from tests.test_feedback import FakeAI, fixture, wait


def expand_fixture(root, count=23, dimensions=None):
    dataset = fixture(root, dimensions=dimensions)
    template = dataset["people"].pop()
    for i in range(count):
        person = copy.deepcopy(template)
        person.update(person_key=f"new-{i:03}", name=f"New Candidate {i:03}")
        person["source"]["selection_priority"] = count - i
        dataset["people"].append(person)
    write_json(root / "history/initial.json", dataset)
    return dataset


class NewPeopleAI:
    def __init__(self):
        self.calls = []
        self.failure = False
        self.block = None
        self.started = threading.Event()
        self.transform = None

    def __call__(self, prompt, schema):
        payload = json.loads(prompt[prompt.index('{"rubric"') :])
        self.calls.append(payload)
        self.started.set()
        if self.block:
            self.block.wait(4)
        if self.failure and payload["people"][0]["person_key"] == "new-020":
            raise ValueError("Synthetic provider interruption")
        dimensions = schema["properties"]["candidates"]["items"]["properties"]["dimensions"][
            "properties"
        ]
        scored = []
        for p in payload["people"]:
            item = {
                "person_key": p["person_key"],
                "dimensions": {
                    d: {
                        "score": 2,
                        "basis": "evidence",
                        "evidence": "Relevant operations responsibility; outcomes unverified.",
                        "source_fields": ["past_roles"],
                    }
                    for d in dimensions
                },
                "summary": "An operations background worth investigating.",
                "flags": {
                    f: {"value": False, "note": "Not established."}
                    for f in ["immediate_fit", "connector", "deep_dive"]
                },
                "questions": ["What did you deliver?", "Who can verify the results?"],
                "internal": False,
                "internal_note": "No current internal role.",
                "quality_concern": False,
                "quality_note": "No quality data supplied.",
                "lean": "operations",
            }
            if "mission" in schema["properties"]["candidates"]["items"]["properties"]:
                item["mission"] = {
                    "basis": "no_data",
                    "note": "Career motivation unknown.",
                }
            scored.append(item)
        answer = {"candidates": scored}
        return self.transform(answer) if self.transform else answer


class AssessmentTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix="campus-more-test-")
        self.root = Path(self.temp.name)
        self.initial = expand_fixture(self.root)
        self.store = ReviewStore(self.root)
        self.ai = NewPeopleAI()
        self.flow = self.store.assessments
        self.flow.runner = self.ai
        self.store.feedback.runner = FakeAI()

    def tearDown(self):
        if self.flow.thread and self.flow.thread.is_alive():
            self.flow.cancel_event.set()
            self.flow.thread.join(5)
        self.temp.cleanup()

    def test_cancel_stops_queued_work_and_allows_a_smaller_run(self):
        expand_fixture(self.root, count=63)
        self.store.update("person-0", {"notes": "Keep this note.", "star": True}, 0)
        before = (self.root / "current.json").read_bytes()
        notes = (self.root / "flags.json").read_bytes()
        self.ai.block = threading.Event()
        job = self.flow.start(63, "initial")
        self.assertTrue(self.ai.started.wait(2))
        try:
            with self.assertRaisesRegex(ValueError, "no longer current"):
                self.flow.cancel("stale-job")
            self.assertEqual(self.flow.cancel(job["id"])["status"], "cancelling")
            self.assertEqual(self.flow.cancel(job["id"])["status"], "cancelling")
            self.assertEqual(self.flow.start(1, "initial")["id"], job["id"])
            with self.assertRaisesRegex(ValueError, "being assessed"):
                self.store.feedback.start("Do not race the cancelling assessment.")
        finally:
            self.ai.block.set()
        self.assertEqual(wait(self.flow)["status"], "cancelled")
        self.assertLessEqual(
            len(self.ai.calls), PARALLEL_BATCHES, "Queued batches must never call the provider"
        )
        self.assertEqual((self.root / "current.json").read_bytes(), before)
        self.assertEqual((self.root / "flags.json").read_bytes(), notes)
        self.assertFalse((self.root / "history" / ("assess-" + job["id"] + ".json")).exists())
        self.assertEqual(ReviewStore(self.root).assessments.status()["status"], "cancelled")
        self.flow.start(1, "initial")
        self.assertEqual(wait(self.flow)["status"], "complete")
        self.assertEqual(sum(bool(p["assessment"]) for p in self.store.dataset()["people"]), 3)
        with self.assertRaisesRegex(ValueError, "no longer current"):
            self.flow.cancel(job["id"])

    def test_cancel_retains_completed_batch_files(self):
        blocked = threading.Event()
        started = threading.Event()

        def runner(prompt, schema):
            payload = json.loads(prompt[prompt.index('{"rubric"') :])
            if payload["people"][0]["person_key"] == "new-020":
                started.set()
                blocked.wait(4)
            return self.ai(prompt, schema)

        self.flow.runner = runner
        job = self.flow.start(23, "initial")
        cache = self.root / "assessments" / job["id"] / "scores/batch-0000.json"
        try:
            self.assertTrue(started.wait(2))
            deadline = time.monotonic() + 2
            while not cache.exists() and time.monotonic() < deadline:
                time.sleep(0.01)
            saved = cache.read_bytes()
            self.flow.cancel(job["id"])
        finally:
            blocked.set()
        self.assertEqual(wait(self.flow)["status"], "cancelled")
        self.assertEqual(cache.read_bytes(), saved)
        self.assertEqual(self.store.dataset()["revision"], "initial")

    def test_cancel_final_search_and_recover_interrupted_cancellation(self):
        self.ai.block = threading.Event()
        job = self.flow.start_full("initial")
        self.assertTrue(self.ai.started.wait(2))
        self.flow.cancel(job["id"])
        self.ai.block.set()
        self.assertEqual(wait(self.flow)["status"], "cancelled")
        self.assertEqual(self.store.dataset()["people"], self.initial["people"])
        path = self.root / "assessments" / job["id"] / "job.json"
        saved = read_json(path)
        saved["status"] = "cancelling"
        write_json(path, saved)
        restored = ReviewStore(self.root)
        self.assertEqual(restored.assessments.status()["status"], "cancelled")
        with self.assertRaisesRegex(ValueError, "Only an interrupted"):
            restored.assessments.retry(job["id"])

    def test_cancel_at_publication_boundary_never_activates_results(self):
        from talent_sourcing.scoring import make_movement

        def cancel_before_publish(*args):
            self.flow.cancel(self.flow.status()["id"])
            return make_movement(*args)

        with patch("talent_sourcing.assessments.make_movement", side_effect=cancel_before_publish):
            self.flow.start(1, "initial")
            self.assertEqual(wait(self.flow)["status"], "cancelled")
        self.assertEqual(self.store.dataset()["revision"], "initial")
        self.flow.start(1, "initial")
        completed = wait(self.flow)
        revision = self.store.dataset()["revision"]
        self.assertEqual(self.flow.cancel(completed["id"])["status"], "complete")
        self.assertEqual(self.store.dataset()["revision"], revision)

    def test_small_request_runs_people_in_parallel_and_records_progress(self):
        both_started = threading.Barrier(2, timeout=2)

        def runner(prompt, schema):
            both_started.wait()
            return self.ai(prompt, schema)

        self.flow.runner = runner
        job = self.flow.start(2, "initial")
        done = wait(self.flow)
        self.assertEqual(done["status"], "complete", done)
        self.assertEqual(job["batch_size"], 1)
        self.assertEqual(job["effort"], "medium")
        self.assertEqual(job["model"], "claude-opus-5")
        self.assertTrue(job["fast_mode"])
        self.assertEqual(len(self.ai.calls), 2)
        self.assertTrue(all(len(call["people"]) == 1 for call in self.ai.calls))
        self.assertEqual(done["completed_batches"], 2)
        self.assertEqual(done["total_batches"], 2)
        self.assertGreaterEqual(done["elapsed_seconds"], 0)

    def test_parallelism_is_bounded_and_groups_are_small(self):
        active = maximum = 0
        lock = threading.Lock()
        ready = threading.Event()
        release = threading.Event()

        def runner(prompt, schema):
            nonlocal active, maximum
            with lock:
                active += 1
                maximum = max(maximum, active)
                if active == PARALLEL_BATCHES:
                    ready.set()
            try:
                release.wait(3)
                return self.ai(prompt, schema)
            finally:
                with lock:
                    active -= 1

        self.flow.runner = runner
        expand_fixture(self.root, count=63)
        self.flow.start(63, "initial")
        try:
            self.assertTrue(ready.wait(2), "All worker slots should be used")
        finally:
            release.set()
        done = wait(self.flow)
        self.assertEqual(done["status"], "complete", done)
        self.assertEqual(maximum, PARALLEL_BATCHES)
        self.assertTrue(all(len(call["people"]) <= MAX_BATCH_SIZE for call in self.ai.calls))
        keys = [person["person_key"] for call in self.ai.calls for person in call["people"]]
        self.assertEqual(len(keys), 63)
        self.assertEqual(len(set(keys)), 63)

    def test_validated_previews_arrive_before_publication_and_keep_concerns(self):
        blocked = threading.Event()
        ready = threading.Event()
        original = (self.root / "current.json").read_bytes()

        def runner(prompt, schema):
            payload = json.loads(prompt[prompt.index('{"rubric"') :])
            self.assertEqual(
                schema["properties"]["candidates"]["items"]["properties"]["questions"]["minItems"],
                2,
            )
            if payload["people"][0]["person_key"] == "new-020":
                ready.set()
                blocked.wait(4)
            answer = self.ai(prompt, schema)
            for score in answer["candidates"]:
                score["quality_concern"] = True
                score["quality_note"] = "Supplied concern must remain visible."
            return answer

        self.flow.runner = runner
        job = self.flow.start(23, "initial")
        try:
            self.assertTrue(ready.wait(2))
            deadline = time.monotonic() + 2
            while time.monotonic() < deadline:
                status = self.flow.status()
                if status["completed"] == 22:
                    break
                time.sleep(0.01)
            self.assertEqual(status["status"], "applying")
            self.assertEqual(status["completed"], 22)
            self.assertEqual(len(status["previews"]), 5)
            self.assertEqual(status["previews"][0]["name"], "New Candidate 000")
            self.assertEqual(status["previews"][0]["overall"], 40)
            self.assertIn(
                "Supplied concern must remain visible.", status["previews"][0]["concerns"]
            )
            self.assertEqual((self.root / "current.json").read_bytes(), original)
            page = self.flow.results(job["id"])
            self.assertEqual(page["cursor"], 22)
            self.assertEqual(len(page["results"]), 22)
            result = next(p for p in page["results"] if p["person_key"] == "new-000")
            self.assertTrue(result["assessment"]["quality_concern"])
            self.assertEqual(result["assessment"]["dimensions"]["delivery"]["score"], 2)
            self.assertEqual(len(result["assessment"]["questions"]), 2)
            self.assertNotIn("source", result)
            self.store.update("new-000", {"notes": "Written while assessing.", "star": True}, 0)
            self.flow.cancel(job["id"])

        finally:
            blocked.set()
        self.assertEqual(wait(self.flow)["status"], "cancelled")
        self.assertEqual((self.root / "current.json").read_bytes(), original)
        self.assertEqual(self.flow.results(job["id"])["results"], [])
        self.assertEqual(self.store.flags()["new-000"]["notes"], "Written while assessing.")
        self.assertTrue(self.store.flags()["new-000"]["star"])

    def test_live_result_pages_survive_restart_and_retry_without_duplicate_entries(self):
        expand_fixture(self.root, count=125)
        release_failure = threading.Event()

        def runner(prompt, schema):
            payload = json.loads(prompt[prompt.index('{"rubric"') :])
            if payload["people"][0]["person_key"] == "new-124":
                release_failure.wait(5)
                raise ValueError("Synthetic failed last assessment")
            return self.ai(prompt, schema)

        self.flow.runner = runner
        job = self.flow.start(125, "initial")
        try:
            deadline = time.monotonic() + 3
            while self.flow.status().get("ready_count", 0) < 124 and time.monotonic() < deadline:
                time.sleep(0.01)
            first = self.flow.results(job["id"])
            second = self.flow.results(job["id"], first["cursor"])
            self.assertEqual(len(first["results"]), 100)
            self.assertEqual(len(second["results"]), 24)
            keys = [p["person_key"] for p in first["results"] + second["results"]]
            self.assertEqual(len(set(keys)), 124)
            self.assertNotIn("new-124", keys)
            for after in (-1, True, 126):
                with self.assertRaises(ValueError):
                    self.flow.results(job["id"], after)
            with self.assertRaisesRegex(ValueError, "no longer current"):
                self.flow.results("stale")
        finally:
            release_failure.set()
        self.assertEqual(wait(self.flow)["status"], "error")
        restored = ReviewStore(self.root)
        self.assertEqual(restored.assessments.results(job["id"]), first)
        restored.assessments.runner = self.ai
        restored.assessments.retry(job["id"])
        done = wait(restored.assessments)
        self.assertEqual(done["status"], "complete", done)
        path = self.root / "assessments" / job["id"] / "ready"
        self.assertEqual(len(list(path.glob("*.json"))), 125)
        self.assertEqual([read_json(path / f"{i:06}.json")["person_key"] for i in range(124)], keys)
        final = {p["person_key"]: p for p in restored.dataset()["people"]}
        for result in first["results"] + second["results"]:
            for key, value in result.items():
                self.assertEqual(final[result["person_key"]][key], value)
        self.assertEqual(restored.assessments.results(job["id"])["results"], [])

    def test_response_schema_restricts_citations_without_leaking_between_people(self):
        from talent_sourcing.schemas import STRINGS, check_schema

        specific = assessment_schema(
            ["delivery"], False, source_fields={"past_roles"}, person_keys=["new-000"]
        )
        properties = specific["properties"]["candidates"]["items"]["properties"]
        fields = properties["dimensions"]["properties"]["delivery"]["properties"]["source_fields"]
        check_schema(["past_roles"], fields)
        with self.assertRaises(ValueError):
            check_schema(["invented_manager_reference"], fields)
        with self.assertRaises(ValueError):
            check_schema("wrong-person", properties["person_key"])
        empty = assessment_schema(["delivery"], False, source_fields=set(), person_keys=["empty"])
        fields = empty["properties"]["candidates"]["items"]["properties"]["dimensions"][
            "properties"
        ]["delivery"]["properties"]["source_fields"]
        check_schema([], fields)
        with self.assertRaises(ValueError):
            check_schema(["invented"], fields)
        self.assertEqual(STRINGS, {"type": "array", "items": {"type": "string"}})
        self.assertNotIn(
            "enum",
            assessment_schema(["delivery"])["properties"]["candidates"]["items"]["properties"][
                "person_key"
            ],
        )

    def test_legacy_retry_preserves_twenty_person_cache_layout(self):
        # Create an interrupted legacy run without launching paid work.
        with patch.object(self.flow, "_launch"):
            job = self.flow.start(23, "initial")
        path = self.root / "assessments" / job["id"]
        for field in (
            "batch_size",
            "parallel_batches",
            "effort",
            "model",
            "fast_mode",
            "ready_count",
        ):
            job.pop(field)
        job["status"] = "error"
        write_json(path / "job.json", job)
        selected = sorted(
            (p for p in self.initial["people"] if not p["assessment"]), key=selection_order
        )
        self.flow._batch(path, 0, selected[:20], self.store.dataset(), {})
        cached = (path / "scores/batch-0000.json").read_bytes()
        self.ai.calls.clear()
        self.flow.retry(job["id"])
        done = wait(self.flow)
        self.assertEqual(done["status"], "complete", done)
        self.assertEqual(len(self.ai.calls), 1)
        self.assertEqual(len(self.ai.calls[0]["people"]), 3)
        self.assertEqual((path / "scores/batch-0000.json").read_bytes(), cached)
        self.assertEqual(done["completed"], 23)

    def test_exact_count_selection_scores_and_notes_preserved(self):
        self.store.update("person-0", {"notes": "Keep my review.", "star": True}, 0)
        notes = (self.root / "flags.json").read_bytes()
        old = (self.root / "history/initial.json").read_bytes()
        self.flow.start(21, "initial")
        job = wait(self.flow)
        self.assertEqual(job["status"], "complete", job)
        data = self.store.dataset()
        self.assertEqual(sum(bool(p["assessment"]) for p in data["people"]), 23)
        self.assertEqual(set(data["newly_assessed_keys"]), {f"new-{i:03}" for i in range(21)})
        for p in data["people"]:
            if p["person_key"].startswith("person-"):
                before = next(
                    x for x in self.initial["people"] if x["person_key"] == p["person_key"]
                )
                self.assertEqual(p["assessment"], before["assessment"])
                self.assertEqual(p["overall"], before["overall"])
            if p["person_key"] in data["newly_assessed_keys"]:
                self.assertEqual(p["overall"], 40)
                self.assertEqual(p["assessed_with"], digest(data["rubric"]))
        self.assertEqual((self.root / "flags.json").read_bytes(), notes)
        self.assertEqual((self.root / "history/initial.json").read_bytes(), old)
        self.assertEqual(len(self.ai.calls), 21)
        self.assertEqual(len(data["movement"]["added"]), 21)
        self.flow.start(2, data["revision"])
        wait(self.flow)
        self.assertTrue(all(p["assessment"] for p in self.store.dataset()["people"]))

    def test_count_validation_empty_pool_and_stale_revision(self):
        for count in [0, -1, 1.5, True, "2", 24]:
            with self.assertRaises(ValueError):
                self.flow.start(count, "initial")
        with self.assertRaisesRegex(ValueError, "changed"):
            self.flow.start(1, "old")
        self.flow.start(23, "initial")
        wait(self.flow)
        with self.assertRaisesRegex(ValueError, "remain"):
            self.flow.start(1, self.store.dataset()["revision"])

    def test_duplicate_click_and_cross_workflow_exclusion(self):
        self.ai.block = threading.Event()
        first = self.flow.start(2, "initial")
        self.assertTrue(self.ai.started.wait(2))
        second = self.flow.start(2, "initial")
        self.assertEqual(first["id"], second["id"])
        with self.assertRaisesRegex(ValueError, "being assessed"):
            self.store.feedback.start("Consider clearer evidence.")
        with self.assertRaisesRegex(ValueError, "being assessed"):
            self.store.feedback.approve("anything")
        self.ai.block.set()
        wait(self.flow)
        self.assertEqual(len(self.ai.calls), 2)
        # A retried HTTP request after completion cannot start another wave.
        with self.assertRaisesRegex(ValueError, "changed"):
            self.flow.start(2, "initial")

    def test_failed_batch_retries_only_uncached_work(self):
        self.ai.failure = True
        job = self.flow.start(23, "initial")
        failed = wait(self.flow)
        self.assertEqual(failed["status"], "error")
        self.assertEqual(self.store.dataset()["revision"], "initial")
        cached = list((self.root / "assessments" / job["id"] / "scores").glob("*.json"))
        self.assertGreater(len(cached), 0)
        self.assertLessEqual(len(cached), 22)
        cached_keys = {
            score["person_key"] for path in cached for score in read_json(path)["candidates"]
        }
        self.ai.failure = False
        self.flow.retry(job["id"])
        done = wait(self.flow)
        self.assertEqual(done["status"], "complete", done)
        starts = [p["people"][0]["person_key"] for p in self.ai.calls]
        self.assertEqual(starts.count("new-000"), 1)
        self.assertEqual(starts.count("new-020"), 2)
        all_keys = [p["person_key"] for call in self.ai.calls for p in call["people"]]
        self.assertTrue(all(all_keys.count(key) == 1 for key in cached_keys))

    def test_invalid_model_response_never_changes_ranking(self):
        for change in ["keys", "score", "source", "unknown", "internal", "questions"]:

            def mutate(answer):
                s = answer["candidates"][0]
                if change == "keys":
                    s["person_key"] = "person-0"
                if change == "score":
                    s["dimensions"]["delivery"]["score"] = 6
                if change == "source":
                    s["dimensions"]["delivery"]["source_fields"] = ["imagined"]
                if change == "unknown":
                    s["dimensions"]["delivery"]["basis"] = "no_data"
                if change == "questions":
                    s["questions"] = ["Too few questions"]
                if change == "internal":
                    s["internal"] = True
                    s["flags"]["immediate_fit"]["value"] = True
                return answer

            self.ai.transform = mutate
            self.flow.start(1, "initial")
            job = wait(self.flow)
            self.assertEqual(job["status"], "error")
            self.assertEqual(self.store.dataset()["revision"], "initial")

    def test_reviews_can_continue_during_assessment(self):
        self.ai.block = threading.Event()
        self.flow.start(2, "initial")
        self.assertTrue(self.ai.started.wait(2))
        self.store.update("new-000", {"notes": "New observation while the job runs."}, 0)
        self.ai.block.set()
        done = wait(self.flow)
        self.assertEqual(done["status"], "complete", done)
        self.assertEqual(
            self.store.flags()["new-000"]["notes"],
            "New observation while the job runs.",
        )

    def test_changed_rubric_does_not_get_overwritten(self):
        self.ai.block = threading.Event()
        self.flow.start(1, "initial")
        self.assertTrue(self.ai.started.wait(2))
        other = copy.deepcopy(self.initial)
        other["revision"] = "external"
        other["rubric"] = "Different rubric"
        write_json(self.root / "history/external.json", other)
        write_json(self.root / "current.json", {"revision": "external"})
        self.ai.block.set()
        done = wait(self.flow)
        self.assertEqual(done["status"], "error")
        self.assertEqual(self.store.dataset()["revision"], "external")
        with self.assertRaisesRegex(ValueError, "changed"):
            self.flow.retry(done["id"])

    def test_feedback_updates_the_sample_then_new_people_use_the_same_criteria(self):
        self.store.update("person-0", {"notes": "I saw repeat delivery through teams."}, 0)
        self.store.feedback.start()
        proposal = wait(self.store.feedback)
        self.store.feedback.approve(proposal["id"])
        learned = wait(self.store.feedback)
        self.assertEqual(learned["status"], "complete", learned)
        data = self.store.dataset()
        self.assertEqual(sum(bool(p["assessment"]) for p in data["people"]), 2)
        self.assertEqual(len(self.ai.calls), 2)
        self.assertIn("Approved review feedback", self.ai.calls[0]["rubric"])
        self.flow.start(3, data["revision"])
        self.assertEqual(wait(self.flow)["status"], "complete")
        data = self.store.dataset()
        self.assertEqual(sum(bool(p["assessment"]) for p in data["people"]), 5)
        self.assertTrue(
            all(
                p["assessed_with"] == data["criteria_version"]
                for p in data["people"]
                if p["assessment"]
            )
        )
        self.assertEqual(self.store.feedback.runner.scores, 0)

    def test_final_search_evaluates_everyone_afresh_preserving_notes_and_web_evidence(
        self,
    ):
        data = read_json(self.root / "history/initial.json")
        data["people"][0]["assessment"]["web_findings"] = [
            {
                "finding": "Verified synthetic role",
                "url": "https://example.invalid/profile",
            }
        ]
        data["people"][0]["enriched"] = True
        data["people"][0]["overall"] = 99
        write_json(self.root / "history/initial.json", data)
        self.store.update("person-0", {"star": True, "notes": "Remember my observation."}, 0)
        notes = (self.root / "flags.json").read_bytes()
        self.flow.start_full("initial")
        done = wait(self.flow)
        self.assertEqual(done["status"], "complete", done)
        self.assertEqual(done["mode"], "full")
        view = self.store.dataset()
        self.assertEqual(view["search_stage"], "final")
        self.assertTrue(all(p["assessment"] for p in view["people"]))
        self.assertTrue(all(p["assessed_with"] == view["criteria_version"] for p in view["people"]))
        self.assertEqual({p["overall"] for p in view["people"]}, {40})
        self.assertEqual((self.root / "flags.json").read_bytes(), notes)
        person = next(p for p in view["people"] if p["person_key"] == "person-0")
        self.assertTrue(person["enriched"])
        self.assertEqual(
            person["assessment"]["web_findings"],
            data["people"][0]["assessment"]["web_findings"],
        )
        for call in self.ai.calls:
            self.assertTrue(all(p["assessment"] is None for p in call["people"]))
        self.assertEqual(sum(len(c["people"]) for c in self.ai.calls), len(data["people"]))

    def test_separate_pool_dimensions_and_job_recovery(self):
        other = self.root / "second"
        expand_fixture(
            other,
            1,
            dimensions=[
                "delivery",
                "leadership",
                "community",
                "experience",
                "workplace",
            ],
        )
        second = ReviewStore(other)
        second.assessments.runner = NewPeopleAI()
        job = second.assessments.start(1, "initial")
        wait(second.assessments)
        self.assertEqual(self.store.dataset()["revision"], "initial")
        assessment = next(
            p["assessment"] for p in second.dataset()["people"] if p["person_key"] == "new-000"
        )
        self.assertIn("mission", assessment)
        path = other / "assessments" / job["id"] / "job.json"
        saved = read_json(path)
        saved["status"] = "applying"
        write_json(path, saved)
        restored = ReviewStore(other)
        self.assertEqual(restored.assessments.status()["status"], "complete")


if __name__ == "__main__":
    unittest.main()
