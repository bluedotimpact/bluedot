"""Feedback approval, isolation, persistence and scoring-integrity checks."""

import tempfile
import threading
import unittest
from pathlib import Path
from unittest.mock import patch

from talent_sourcing.feedback import FeedbackFlow
from talent_sourcing.storage import read_json, write_json
from talent_sourcing.workspace import ReviewStore


def fixture(root, dimensions=None):
    dimensions = dimensions or [
        "delivery",
        "leadership",
        "community",
        "experience",
        "mission",
    ]
    people = []
    for index in range(3):
        assessment = {
            "dimensions": {
                d: {
                    "score": 2,
                    "basis": "evidence",
                    "evidence": "Relevant responsibility; results unverified.",
                    "source_fields": ["past_roles"],
                }
                for d in dimensions
            },
            "summary": "Synthetic candidate with relevant experience.",
            "flags": {
                f: {"value": False, "note": "Not established."}
                for f in ["immediate_fit", "connector", "deep_dive"]
            },
            "questions": ["What did you deliver?", "Who can verify the results?"],
            "web_findings": [],
            "internal": False,
            "internal_note": "External fixture.",
            "quality_concern": False,
            "quality_note": "No quality data.",
        }
        people.append(
            {
                "person_key": f"person-{index}",
                "name": f"Candidate {index}",
                "source": {
                    "past_roles": "Owned operations for a residential learning program.",
                    "email": "fixture@example.invalid",
                },
                "assessment": assessment if index < 2 else None,
                "overall": 40 if index < 2 else None,
                "coverage": 100 if index < 2 else None,
                "rank": 1 if index < 2 else None,
                "enriched": False,
            }
        )
    dataset = {
        "revision": "initial",
        "run": "initial",
        "created_at": "2026-09-17",
        "rubric": "Score responsibility at 2; repeated verified results at 4.",
        "weights": {d: 20 for d in dimensions},
        "labels": {d: d.title() for d in dimensions},
        "score_scale": 100,
        "formula": "weighted dimensions",
        "manifest": {"selection": "Synthetic sample"},
        "people": people,
        "calibration": [],
        "movement": {"baseline": None},
    }
    write_json(root / "history/initial.json", dataset)
    write_json(root / "current.json", {"revision": "initial"})
    return dataset


class FakeAI:
    def __init__(self):
        self.proposals = 0
        self.scores = 0
        self.transform = None

    def __call__(self, prompt, schema):
        if "changes" in schema["properties"]:
            self.proposals += 1
            dimension = schema["properties"]["changes"]["items"]["properties"]["dimension"]["enum"][
                1
            ]
            return {
                "summary": "Use demonstrated repeat delivery, with manager observations attributed.",
                "changes": [
                    {
                        "dimension": dimension,
                        "rule": "Award 4 for repeated verified delivery through a team.",
                        "reason": "Manager reports repeat results for Candidate 0.",
                        "person_keys": ["person-0"],
                    }
                ],
                "corrections": [
                    {
                        "person_key": "person-0",
                        "expected": "up",
                        "reason": "New delivery evidence.",
                    }
                ],
                "questions": ["Who can independently verify these results?"],
            }
        self.scores += 1
        # Generate fresh scores without receiving prior numeric assessments.
        from tests.test_assessments import NewPeopleAI

        value = NewPeopleAI()(prompt, schema)
        for item in value["candidates"]:
            if item["person_key"] == "person-0":
                item["dimensions"][next(iter(item["dimensions"]))].update(
                    score=4,
                    source_fields=["manager_feedback"],
                    evidence="Manager reports repeated delivery.",
                )
        return self.transform(value) if self.transform else value


def wait(flow):
    flow.thread.join(5)
    assert not flow.thread.is_alive(), "Feedback worker did not finish"
    job = flow.status()
    if job.get("next_job_id"):
        wait(flow.store.assessments)
        job = flow.status()
    return job


class FeedbackTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix="campus-feedback-test-")
        self.root = Path(self.temp.name)
        fixture(self.root)
        self.store = ReviewStore(self.root)
        self.ai = FakeAI()
        self.flow = self.store.feedback = FeedbackFlow(self.store, self.ai)
        self.store.assessments.runner = self.ai
        self.store.update(
            "person-0",
            {
                "triage": "yes",
                "notes": "I observed repeated delivery through excellent teams.",
            },
            0,
        )

    def tearDown(self):
        for flow in (self.flow, self.store.assessments):
            if flow.thread and flow.thread.is_alive():
                flow.cancel_event.set()
                flow.thread.join(5)
        self.temp.cleanup()

    def propose(self):
        self.flow.start()
        job = wait(self.flow)
        self.assertEqual(job["status"], "ready", job)
        return job

    def test_review_approval_movement_and_history_preserve_human_data(self):
        notes = (self.root / "flags.json").read_bytes()
        old = (self.root / "history/initial.json").read_bytes()
        job = self.propose()
        self.assertEqual(read_json(self.root / "current.json")["revision"], "initial")
        self.assertEqual(self.ai.scores, 0)
        same = self.flow.start()
        self.assertEqual(same["id"], job["id"])
        self.assertEqual(self.ai.proposals, 1)
        self.flow.approve(job["id"])
        done = wait(self.flow)
        self.assertEqual(done["status"], "complete", done)
        data = self.store.dataset()
        self.assertEqual(data["people"][0]["overall"], 48)
        self.assertIsNone(data["people"][2]["assessment"])
        self.assertEqual(data["movement"]["risers"][0]["person_key"], "person-0")
        self.assertTrue(data["movement"]["named_corrections"][0]["matched"])
        self.assertEqual(self.ai.scores, 2)
        self.assertTrue(
            all(
                p["assessed_with"] == data["criteria_version"]
                for p in data["people"]
                if p["assessment"]
            )
        )
        self.assertIn("Approved review feedback", data["rubric"])
        self.assertEqual((self.root / "flags.json").read_bytes(), notes)
        self.assertEqual((self.root / "history/initial.json").read_bytes(), old)
        self.assertTrue((self.root / "feedback" / job["id"] / "rubric.md").exists())
        self.assertEqual(ReviewStore(self.root).feedback.status()["status"], "complete")

    def test_stale_feedback_cannot_be_approved(self):
        job = self.propose()
        self.store.update("person-0", {"notes": "Actually this needs checking."}, 1)
        self.assertTrue(self.flow.status()["stale"])
        with self.assertRaisesRegex(ValueError, "changed"):
            self.flow.approve(job["id"])
        self.assertEqual(self.ai.scores, 0)

    def test_keep_current_ranking_does_not_rescore(self):
        job = self.propose()
        self.flow.dismiss(job["id"])
        self.assertEqual(self.flow.status()["status"], "dismissed")
        self.assertEqual(self.ai.scores, 0)
        with self.assertRaises(ValueError):
            self.flow.approve(job["id"])

    def test_other_dimensions_and_dataset_isolation(self):
        second = self.root / "second"
        fixture(second, dimensions=["projects", "people", "community", "taste", "workplace"])
        other = ReviewStore(second)
        other.feedback.runner = FakeAI()
        other.assessments.runner = other.feedback.runner
        other.update("person-0", {"notes": "I observed repeat delivery."}, 0)
        job = other.feedback.start()
        wait(other.feedback)
        other.feedback.approve(job["id"])
        done = wait(other.feedback)
        self.assertEqual(done["status"], "complete", done)
        self.assertEqual(other.dataset()["people"][0]["overall"], 48)
        self.assertEqual(self.store.dataset()["revision"], "initial")
        self.assertIsNone(self.flow.status())
        self.assertEqual(other.flags()["person-0"]["notes"], "I observed repeat delivery.")

    def test_update_is_atomic_and_new_notes_are_retained_for_next_round(self):
        job = self.propose()
        release = threading.Event()
        started = threading.Event()
        ai = self.ai

        def runner(prompt, schema):
            started.set()
            release.wait(4)
            return ai(prompt, schema)

        self.store.assessments.runner = runner
        original = self.store.dataset()
        update = self.flow.approve(job["id"])
        try:
            self.assertTrue(started.wait(2))
            self.assertEqual(self.store.dataset(), original)
            self.assertEqual(self.flow.status()["status"], "applying")
            self.assertEqual(self.flow.approve(job["id"])["next_job_id"], update["next_job_id"])
            self.store.update("person-0", {"notes": "New note for next round."}, 1)
        finally:
            release.set()
        done = wait(self.flow)
        self.assertEqual(done["status"], "complete", done)
        self.assertEqual(self.ai.scores, 2)
        self.assertEqual(self.store.flags()["person-0"]["notes"], "New note for next round.")
        self.assertNotEqual(self.store.dataset()["rubric"], original["rubric"])
        self.assertEqual(self.flow.approve(job["id"])["status"], "complete")
        self.assertEqual(self.ai.scores, 2)

    def test_cancel_feedback_update_preserves_criteria_scores_and_new_notes(self):
        job = self.propose()
        started = threading.Event()
        release = threading.Event()
        ai = self.ai

        def runner(prompt, schema):
            started.set()
            release.wait(4)
            return ai(prompt, schema)

        self.store.assessments.runner = runner
        original = self.store.dataset()
        update = self.flow.approve(job["id"])
        try:
            self.assertTrue(started.wait(2))
            self.store.update("person-1", {"notes": "Retain on cancellation."}, 0)
            self.store.assessments.cancel(update["next_job_id"])
            self.assertEqual(self.flow.status()["status"], "cancelling")
        finally:
            release.set()
        self.assertEqual(wait(self.flow)["status"], "cancelled")
        self.assertEqual(self.store.dataset(), original)
        self.assertEqual(self.store.flags()["person-1"]["notes"], "Retain on cancellation.")
        self.assertEqual(ReviewStore(self.root).feedback.status()["status"], "cancelled")

    def test_person_specific_correction_without_general_changes_still_updates_everyone(self):
        ai = self.ai

        def propose(prompt, schema):
            answer = ai(prompt, schema)
            answer["changes"] = []
            return answer

        self.flow.runner = propose
        job = self.propose()
        self.flow.approve(job["id"])
        self.assertEqual(wait(self.flow)["status"], "complete")
        self.assertEqual(self.ai.scores, 2)
        self.assertEqual(self.store.dataset()["people"][0]["overall"], 48)

    def test_failed_update_restarts_with_saved_results_and_original_feedback(self):
        job = self.propose()
        failed = False
        ai = self.ai

        def runner(prompt, schema):
            nonlocal failed
            if '"person_key": "person-1"' in prompt and not failed:
                failed = True
                raise ValueError("Synthetic update failure")
            return ai(prompt, schema)

        self.store.assessments.runner = runner
        update = self.flow.approve(job["id"])
        self.assertEqual(wait(self.flow)["status"], "error")
        self.assertEqual(self.store.dataset()["revision"], "initial")
        restored = ReviewStore(self.root)
        restored.assessments.runner = self.ai
        restored.assessments.retry(update["next_job_id"])
        self.assertEqual(wait(restored.assessments)["status"], "complete")
        self.assertEqual(restored.feedback.status()["status"], "complete")
        self.assertEqual(restored.dataset()["people"][0]["overall"], 48)
        self.assertEqual(self.ai.proposals, 1)

    def test_feedback_before_any_assessments_can_update_criteria_without_scoring(self):
        data = read_json(self.root / "history/initial.json")
        for person in data["people"]:
            person.update(assessment=None, overall=None, coverage=None, rank=None)
        write_json(self.root / "history/initial.json", data)
        job = self.propose()
        self.flow.approve(job["id"])
        self.assertEqual(wait(self.flow)["status"], "complete")
        self.assertEqual(self.ai.scores, 0)
        self.assertTrue(all(not p["assessment"] for p in self.store.dataset()["people"]))

    def test_interrupted_linked_update_recovers_and_only_publishes_after_retry(self):
        proposal = self.propose()
        with patch.object(self.store.assessments, "_launch"):
            job = self.flow.approve(proposal["id"])
        restored = ReviewStore(self.root)
        self.assertEqual(restored.feedback.status()["status"], "error")
        self.assertEqual(restored.dataset()["revision"], "initial")
        restored.assessments.runner = self.ai
        restored.assessments.retry(job["next_job_id"])
        self.assertEqual(wait(restored.assessments)["status"], "complete")
        self.assertEqual(restored.feedback.status()["status"], "complete")
        data = restored.dataset()
        self.assertTrue(
            all(
                p["assessed_with"] == data["criteria_version"]
                for p in data["people"]
                if p["assessment"]
            )
        )

    def test_no_supported_lessons_keeps_approval_disabled_on_server(self):
        ai = self.ai

        def runner(prompt, schema):
            answer = ai(prompt, schema)
            answer.update(changes=[], corrections=[])
            return answer

        self.flow.runner = runner
        job = self.propose()
        with self.assertRaisesRegex(ValueError, "no supported changes"):
            self.flow.approve(job["id"])
        self.assertEqual(self.store.dataset()["revision"], "initial")

    def test_feedback_proposal_uses_fast_model_without_changing_global_settings(self):
        ai = self.ai
        with patch("talent_sourcing.feedback.ask_claude") as runner:
            runner.side_effect = lambda prompt, schema, **kwargs: ai(prompt, schema)
            self.flow.runner = runner
            self.propose()
            self.assertEqual(
                runner.call_args.kwargs,
                {
                    "model": "claude-opus-5",
                    "effort": "medium",
                    "fast_mode": True,
                },
            )

    def test_invalid_proposal_keys_are_rejected(self):
        self.flow.runner = lambda *_: {
            "summary": "Bad",
            "changes": [
                {
                    "dimension": "delivery",
                    "rule": "Rule",
                    "reason": "Reason",
                    "person_keys": ["unknown"],
                }
            ],
            "corrections": [],
            "questions": [],
        }
        self.flow.start()
        done = wait(self.flow)
        self.assertEqual(done["status"], "error")
        self.assertEqual(self.store.dataset()["revision"], "initial")

    def test_restart_and_completed_pointer_recovery(self):
        job = self.propose()
        path = self.root / "feedback" / job["id"] / "job.json"
        state = read_json(path)
        state["status"] = "applying"
        write_json(path, state)
        restored = ReviewStore(self.root)
        self.assertEqual(restored.feedback.status()["status"], "error")
        state["result_revision"] = "initial"
        write_json(path, state)
        restored = ReviewStore(self.root)
        self.assertEqual(restored.feedback.status()["status"], "complete")

    def test_new_feedback_before_approval_keeps_ranking_unchanged(self):
        job = self.propose()
        self.store.update("person-0", {"star": True}, 1)
        with self.assertRaisesRegex(ValueError, "changed"):
            self.flow.approve(job["id"])
        self.assertEqual(self.store.dataset()["revision"], "initial")
        self.assertTrue(self.store.flags()["person-0"]["star"])

    def test_duplicate_clicks_share_a_running_job(self):
        event = threading.Event()
        runner = self.flow.runner
        self.flow.runner = lambda prompt, schema: (
            event.wait(3),
            runner(prompt, schema),
        )[1]
        first = self.flow.start()
        second = self.flow.start()
        self.assertEqual(first["id"], second["id"])
        event.set()
        wait(self.flow)
        self.assertEqual(self.ai.proposals, 1)

    def test_no_feedback_and_no_context_rejected(self):
        write_json(self.root / "flags.json", {})
        with self.assertRaisesRegex(ValueError, "Add a star"):
            self.flow.start()
        with self.assertRaises(ValueError):
            self.flow.start({"bad": "context"})
        with self.assertRaises(ValueError):
            self.flow.approve("../current")


if __name__ == "__main__":
    unittest.main()
