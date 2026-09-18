"""Synthetic Ashby only: role isolation, identity matching, retries and note integrity."""

import copy
import tempfile
import unittest
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

from talent_sourcing.ashby import AshbyClient, AshbyError, AshbyIntegration, linkedin
from talent_sourcing.searches import SearchCatalog
from talent_sourcing.storage import write_json
from talent_sourcing.workspace import ReviewStore
from tests.test_feedback import fixture
from tests.test_imports import ROLE

JOB = "11111111-1111-4111-8111-111111111111"
OTHER = "22222222-2222-4222-8222-222222222222"


class FakeAshby(AshbyClient):
    def __init__(self):
        super().__init__("synthetic")
        self.jobs = {
            JOB: {
                "id": JOB,
                "title": "Research Program Lead",
                "status": "Open",
                "jobPostingIds": ["posting"],
            },
            OTHER: {
                "id": OTHER,
                "title": "Engineering Lead",
                "status": "Open",
                "jobPostingIds": ["posting"],
            },
        }
        self.jobs["33333333-3333-4333-8333-333333333333"] = {
            "id": "33333333-3333-4333-8333-333333333333",
            "title": "Program Lead, Technical AI Safety Project Sprint",
            "status": "Open",
            "jobPostingIds": ["posting"],
        }
        self.candidates, self.applications, self.notes = {}, {}, {}
        self.calls = []
        self.fail = None
        self.after_write = None

    def call(self, endpoint, **params):
        self.calls.append((endpoint, copy.deepcopy(params)))
        if self.fail == endpoint:
            self.fail = None
            raise AshbyError("Synthetic permission failure")
        if endpoint == "job.list":
            return {
                "success": True,
                "results": [j for j in self.jobs.values() if j["status"] == "Open"],
            }
        if endpoint == "job.info":
            result = self.jobs[params["id"]]
        elif endpoint == "jobPosting.info":
            result = {
                "descriptionPlain": "Build reliable research tools and lead a multidisciplinary engineering team."
            }
        elif endpoint == "candidate.list":
            return {
                "success": True,
                "results": list(self.candidates.values()),
                "syncToken": "next-sync",
            }
        elif endpoint == "candidate.create":
            cid = "candidate-" + str(len(self.candidates))
            result = {
                "id": cid,
                "name": params["name"],
                "emailAddresses": [{"value": params["primaryEmailAddress"]}]
                if params.get("primaryEmailAddress")
                else [],
                "socialLinks": [{"type": "LinkedIn", "url": params["linkedInUrl"]}]
                if params.get("linkedInUrl")
                else [],
                "applicationIds": [],
                "profileUrl": "https://example.invalid/candidate/" + cid,
            }
            self.candidates[cid] = result
        elif endpoint == "candidate.info":
            result = self.candidates[params["id"]]
        elif endpoint == "application.info":
            result = self.applications[params["applicationId"]]
        elif endpoint == "application.create":
            aid = "application-" + str(len(self.applications))
            result = {"id": aid, "job": {"id": params["jobId"]}, "status": "Lead"}
            self.applications[aid] = result
            self.candidates[params["candidateId"]]["applicationIds"].append(aid)
        elif endpoint == "candidate.createNote":
            nid = "note-" + str(len(self.notes))
            result = {"id": nid, "content": params["note"], "candidateId": params["candidateId"]}
            self.notes[nid] = result
        elif endpoint == "candidate.listNotes":
            return {
                "success": True,
                "results": [
                    n for n in self.notes.values() if n["candidateId"] == params["candidateId"]
                ],
            }
        else:
            raise AssertionError(endpoint)
        if self.after_write == endpoint:
            self.after_write = None
            raise AshbyError("Synthetic lost response", uncertain=True)
        return {"success": True, "results": copy.deepcopy(result)}


class AshbyTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.data = fixture(self.root)
        write_json(
            self.root / "workspace.json",
            {
                "id": "test-workspace",
                "name": "People.csv",
                "ashby_job": {"id": JOB, "title": "Research Program Lead"},
            },
        )
        self.store = ReviewStore(self.root)
        self.client = FakeAshby()
        self.integration = AshbyIntegration(self.root, self.client)

    def add(self, key="person-0"):
        return self.integration.add_lead(
            self.store, key, "initial", self.store.flags().get(key, {}).get("version", 0)
        )

    def writes(self, endpoint):
        return [p for e, p in self.client.calls if e == endpoint]

    def test_note_contains_full_assessment_and_exact_saved_review(self):
        review = "I worked with them.\nExcellent follow-through; check availability. <script>literal text</script>"
        self.store.update("person-0", {"notes": review}, 0)
        self.data["people"][0]["assessment"].update(
            quality_concern=True, quality_note="Verify this source."
        )
        write_json(self.root / "history/initial.json", self.data)
        result = self.add()
        self.assertEqual(result["status"], "complete")
        note = self.writes("candidate.createNote")[0]
        for text in [
            review,
            "Synthetic candidate with relevant experience.",
            "Delivery: 2/5",
            "Verify this source.",
            "What did you deliver?",
            "Research Program Lead",
        ]:
            self.assertIn(text, note["note"])
        self.assertFalse(note["sendNotifications"])
        self.assertNotIn("note", self.integration.receipts(self.store)["person-0"])
        self.assertFalse(self.store.flags()["person-0"]["star"])
        self.assertEqual(self.writes("application.create")[0]["jobId"], JOB)
        self.assertNotIn("interviewStageId", self.writes("application.create")[0])

    def test_repeat_clicks_and_restart_do_not_duplicate(self):
        with ThreadPoolExecutor(max_workers=3) as pool:
            list(pool.map(lambda _: self.add(), range(3)))
        self.integration = AshbyIntegration(self.root, self.client)
        self.add()
        for endpoint in ("candidate.create", "application.create", "candidate.createNote"):
            self.assertEqual(len(self.writes(endpoint)), 1)

    def test_existing_candidate_and_archived_application_are_not_recreated_or_moved(self):
        self.add()
        self.client.applications["application-0"]["status"] = "Archived"
        (self.root / "ashby-leads.json").unlink()
        self.add()
        self.assertEqual(len(self.writes("candidate.create")), 1)
        self.assertEqual(len(self.writes("application.create")), 1)
        self.assertEqual(self.client.applications["application-0"]["status"], "Archived")

    def test_linkedin_match_with_different_name_and_email(self):
        self.client.call(
            "candidate.create",
            name="Another spelling",
            primaryEmailAddress="different@example.invalid",
            linkedInUrl="https://linkedin.com/in/example/?trk=abc",
        )
        self.data["people"][0]["contact"] = {"linkedin": "https://www.linkedin.com/in/EXAMPLE"}
        write_json(self.root / "history/initial.json", self.data)
        self.add()
        self.assertEqual(len(self.writes("candidate.create")), 1)

    def test_ambiguous_identity_blocks_every_write(self):
        for name in ("One", "Two"):
            self.client.call(
                "candidate.create", name=name, primaryEmailAddress="fixture@example.invalid"
            )
        with self.assertRaisesRegex(ValueError, "More than one"):
            self.add()
        self.assertEqual(len(self.writes("candidate.create")), 2)
        self.assertFalse(self.writes("application.create"))

    def test_missing_contact_never_creates_by_name_only(self):
        self.data["people"][0]["source"].pop("email")
        write_json(self.root / "history/initial.json", self.data)
        with self.assertRaisesRegex(ValueError, "email or a LinkedIn"):
            self.add()
        self.assertFalse(self.client.calls)

    def test_closed_role_and_stale_review_or_assessment_block_writes(self):
        self.client.jobs[JOB]["status"] = "Closed"
        with self.assertRaisesRegex(ValueError, "no longer open"):
            self.add()
        self.client.jobs[JOB]["status"] = "Open"
        self.store.update("person-0", {"notes": "New text"}, 0)
        with self.assertRaisesRegex(ValueError, "review changed"):
            self.integration.add_lead(self.store, "person-0", "initial", 0)
        with self.assertRaisesRegex(ValueError, "assessment changed"):
            self.integration.add_lead(self.store, "person-0", "old", 1)
        self.assertFalse(self.writes("candidate.create"))

    def test_partial_note_failure_retries_without_duplicate_lead(self):
        self.client.fail = "candidate.createNote"
        with self.assertRaisesRegex(ValueError, "lead is in Ashby"):
            self.add()
        self.assertEqual(self.integration.receipts(self.store)["person-0"]["status"], "error")
        self.add()
        self.assertEqual(len(self.client.notes), 1)
        self.assertEqual(len(self.writes("candidate.create")), 1)
        self.assertEqual(len(self.writes("application.create")), 1)

    def test_lost_write_responses_recover_from_ashby_reads(self):
        for endpoint in ("candidate.create", "application.create", "candidate.createNote"):
            with self.subTest(endpoint=endpoint):
                self.client = FakeAshby()
                self.integration = AshbyIntegration(self.root, self.client)
                for name in ("ashby-leads.json", "ashby-index.json"):
                    (self.root / name).unlink(missing_ok=True)
                self.client.after_write = endpoint
                with self.assertRaises(ValueError):
                    self.add()
                self.integration = AshbyIntegration(self.root, self.client)
                self.assertEqual(self.add()["status"], "complete")
                self.assertEqual(len(self.writes(endpoint)), 1)

    def test_unconfirmed_create_does_not_blindly_retry(self):
        self.client.after_write = "candidate.create"
        with self.assertRaises(ValueError):
            self.add()
        self.client.candidates.clear()
        with self.assertRaisesRegex(ValueError, "not confirmed"):
            self.add()
        self.assertEqual(len(self.writes("candidate.create")), 1)

    def test_interrupted_export_is_retryable_after_restart(self):
        write_json(
            self.root / "ashby-leads.json", {"person-0": {"status": "pending", "job_id": JOB}}
        )
        receipt = self.integration.receipts(self.store)["person-0"]
        self.assertEqual(receipt["status"], "error")
        self.assertIn("interrupted", receipt["error"])

    def test_unassessed_note_is_honest(self):
        self.add("person-2")
        note = self.writes("candidate.createNote")[0]["note"]
        self.assertIn("Not yet assessed", note)
        self.assertNotIn("Evidence score:", note)

    def test_new_role_reuses_people_without_scores_or_human_reviews(self):
        self.store.update("person-0", {"notes": "Private old-role review", "star": True}, 0)
        self.data["people"][0]["source"]["legacy_priority"] = 12
        self.data["people"][0]["assessment"]["web_findings"] = [
            {
                "finding": "Published research",
                "url": "https://example.invalid/research",
                "identity_match": "uncertain",
            }
        ]
        self.data["people"][0]["assessment"].update(
            quality_concern=True, quality_note="Verify responsibility."
        )
        write_json(self.root / "history/initial.json", self.data)
        before = (self.root / "history/initial.json").read_bytes()
        catalog = SearchCatalog(self.store, self.integration)
        result = catalog.create({"source_search_id": "", "ashby_job_id": OTHER, "role": ROLE})
        other = catalog.get(result["id"])
        self.assertEqual(other.dataset()["workspace"]["ashby_job"]["id"], OTHER)
        self.assertEqual(other.dataset()["role"]["title"], "Engineering Lead")
        self.assertEqual(other.dataset()["people"][0]["person_key"], "person-0")
        self.assertTrue(
            all(
                p["assessment"] is None and p["rank"] is None and p["overall"] is None
                for p in other.dataset()["people"]
            )
        )
        self.assertEqual(other.flags(), {})
        source = other.dataset()["people"][0]["source"]
        self.assertEqual(source["legacy_priority"], 12)
        self.assertIn("uncertain", source["Previous research findings (verify identity)"])
        self.assertEqual(
            source["Previous assessment concerns (recheck for this role)"], "Verify responsibility."
        )
        self.assertEqual((self.root / "history/initial.json").read_bytes(), before)
        self.assertEqual(self.store.flags()["person-0"]["notes"], "Private old-role review")
        self.assertEqual(catalog.listing(result["id"])["searches"][1]["ashby_job_id"], OTHER)

    def test_open_role_list_and_credentials_stay_server_side(self):
        self.client.jobs[OTHER]["status"] = "Closed"
        self.client.jobs["33333333-3333-4333-8333-333333333333"]["status"] = "Closed"
        self.assertEqual(self.integration.jobs(), [{"id": JOB, "title": "Research Program Lead"}])
        self.assertEqual(
            self.integration.details(JOB)["brief"],
            "Build reliable research tools and lead a multidisciplinary engineering team.",
        )

    def test_linkedin_normalization_rejects_other_sites(self):
        self.assertEqual(
            linkedin("https://uk.linkedin.com/in/Example/?x=y"),
            "https://www.linkedin.com/in/example",
        )
        self.assertEqual(linkedin("https://linkedin.com.evil.invalid/in/example"), "")
