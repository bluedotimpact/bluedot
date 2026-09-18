"""HTTP boundaries, independent search routing and a clean first launch."""

import http.client
import json
import tempfile
import threading
import unittest
from http.server import ThreadingHTTPServer
from pathlib import Path

from talent_sourcing.ashby import AshbyIntegration
from talent_sourcing.searches import SearchCatalog
from talent_sourcing.server import handler_for
from talent_sourcing.storage import write_json
from talent_sourcing.workspace import ReviewStore
from tests.test_ashby import JOB, FakeAshby
from tests.test_assessments import NewPeopleAI, expand_fixture
from tests.test_feedback import wait
from tests.test_imports import ROLE, encoded


class HTTPTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.store = ReviewStore(Path(self.temporary.name))
        self.ashby = FakeAshby()
        catalog = SearchCatalog(self.store, AshbyIntegration(self.store.local, self.ashby))
        self.server = ThreadingHTTPServer(("127.0.0.1", 0), handler_for(self.store, catalog))
        self.thread = threading.Thread(target=self.server.serve_forever, daemon=True)
        self.thread.start()
        self.origin = f"http://127.0.0.1:{self.server.server_port}"

    def tearDown(self):
        self.server.shutdown()
        self.server.server_close()
        self.thread.join()
        self.temporary.cleanup()

    def request(self, path, body=None, headers=None):
        client = http.client.HTTPConnection("127.0.0.1", self.server.server_port)
        values = {
            "Content-Type": "application/json",
            "Origin": self.origin,
            "X-Review-Token": self.store.token,
        }
        values.update(headers or {})
        client.request(
            "POST" if body is not None else "GET",
            path,
            body=json.dumps(body) if body is not None else None,
            headers=values,
        )
        response = client.getresponse()
        content = response.read()
        result = (
            json.loads(content)
            if response.headers["Content-Type"].startswith("application/json")
            else content.decode()
        )
        client.close()
        return response.status, result

    def test_ashby_roles_and_lead_route_require_saved_review_and_local_auth(self):
        expand_fixture(self.store.local)
        write_json(
            self.store.local / "workspace.json",
            {"id": "http-fixture", "ashby_job": {"id": JOB, "title": "Research Program Lead"}},
        )
        self.assertEqual(self.request("/api/ashby/jobs")[0], 200)
        self.assertEqual(
            self.request("/api/ashby/job?id=" + JOB)[1]["title"], "Research Program Lead"
        )
        body = {"person_key": "person-0", "revision": "initial", "review_version": 0}
        for headers in [{"X-Review-Token": "wrong"}, {"Origin": "https://example.invalid"}]:
            self.assertEqual(self.request("/api/ashby/lead", body, headers)[0], 403)
        self.assertFalse(self.ashby.candidates)
        self.store.update("person-0", {"notes": "Exact current review"}, 0)
        self.assertEqual(self.request("/api/ashby/lead", body)[0], 400)
        status, result = self.request("/api/ashby/lead", body | {"review_version": 1})
        self.assertEqual(status, 200)
        self.assertEqual(result["status"], "complete")
        self.assertIn("Exact current review", next(iter(self.ashby.notes.values()))["content"])
        self.assertEqual(
            self.request("/api/data")[1]["ashby_leads"]["person-0"]["status"], "complete"
        )

    def test_cancel_requires_auth_and_current_job_id(self):
        expand_fixture(self.store.local)
        ai = NewPeopleAI()
        ai.block = threading.Event()
        self.store.assessments.runner = ai
        job = self.store.assessments.start(2, "initial")
        self.assertTrue(ai.started.wait(2))
        try:
            for headers in [{"X-Review-Token": "wrong"}, {"Origin": "https://example.invalid"}]:
                self.assertEqual(
                    self.request("/api/assessments/cancel", {"job_id": job["id"]}, headers)[0], 403
                )
            self.assertEqual(self.request("/api/assessments/cancel", {"job_id": "stale"})[0], 400)
            self.assertEqual(self.request("/api/assessments/cancel", {})[0], 400)
            status, result = self.request("/api/assessments/cancel", {"job_id": job["id"]})
            self.assertEqual(status, 200)
            self.assertEqual(result["status"], "cancelling")
        finally:
            ai.block.set()
        self.assertEqual(wait(self.store.assessments)["status"], "cancelled")
        self.assertEqual(self.store.dataset()["revision"], "initial")

    def test_live_result_endpoint_validates_job_and_cursor(self):
        expand_fixture(self.store.local)
        self.store.assessments.runner = NewPeopleAI()
        job = self.store.assessments.start(1, "initial")
        self.assertEqual(wait(self.store.assessments)["status"], "complete")
        status, result = self.request(f"/api/assessments/results?job_id={job['id']}&after=0")
        self.assertEqual(status, 200)
        self.assertEqual(result["results"], [])
        for query in [
            "",
            "job_id=stale",
            f"job_id={job['id']}&after=-1",
            f"job_id={job['id']}&after=abc",
            f"job_id={job['id']}&after=0&after=1",
        ]:
            self.assertEqual(self.request("/api/assessments/results?" + query)[0], 400)
        self.assertEqual(
            self.request(
                f"/api/assessments/results?job_id={job['id']}", headers={"Host": "example.invalid"}
            )[0],
            403,
        )

    def test_clean_launch_catalogue_and_assets(self):
        status, view = self.request("/api/searches")
        self.assertEqual(status, 200)
        self.assertFalse(view["configured"])
        self.assertEqual(view["searches"], [])
        self.assertEqual(view["token"], self.store.token)
        for path in ["/", "/assets/shared.js", "/preview/workbench/", "/assets/../talent_sourcing/server.py"]:
            self.assertEqual(self.request(path)[0], 404)
        self.assertFalse(self.request("/api/health")[1]["synthetic"])

    def test_write_requires_host_origin_and_session_token(self):
        for headers in [
            {"Origin": "https://example.invalid"},
            {"X-Review-Token": "wrong"},
            {"Host": "example.invalid"},
        ]:
            with self.subTest(headers=headers):
                self.assertEqual(
                    self.request("/api/searches/inspect", {"csv": encoded()}, headers)[0], 403
                )
        self.assertEqual(self.request("/api/searches/inspect", {"csv": encoded()})[0], 200)

    def test_import_routes_to_independent_store_and_survives_reload(self):
        payload = {
            "csv": encoded(),
            "filename": "people.csv",
            "mapping": {"name": "Full Name"},
            "role": ROLE,
        }
        status, search = self.request("/api/searches/create", payload)
        self.assertEqual(status, 200, search)
        base = search["url"]
        status, data = self.request(base + "api/data")
        self.assertEqual(status, 200)
        self.assertEqual(data["role"]["title"], "Engineering Lead")
        self.assertEqual(len(data["people"]), 2)
        self.assertNotEqual(data["token"], self.store.token)
        key = data["people"][0]["person_key"]
        patch = {"person_key": key, "patch": {"notes": "Keep this review."}, "version": 0}
        self.assertEqual(self.request(base + "api/review", patch)[0], 403)
        self.assertEqual(
            self.request(base + "api/review", patch, {"X-Review-Token": data["token"]})[0], 200
        )
        self.assertEqual(
            self.request(base + "api/data")[1]["reviews"][key]["notes"], "Keep this review."
        )
        self.assertEqual(self.store.flags(), {})
        self.assertEqual(len(self.request("/api/searches")[1]["searches"]), 1)
