"""Synthetic-only browser server. It cannot read the user's real candidate pools."""

import argparse
import json
import sys
import tempfile
import time
from concurrent.futures import CancelledError
from http.server import ThreadingHTTPServer
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import talent_sourcing.server as transport
from talent_sourcing.ashby import AshbyIntegration
from talent_sourcing.roles import draft_role
from talent_sourcing.searches import SearchCatalog
from talent_sourcing.server import handler_for
from talent_sourcing.storage import write_json
from talent_sourcing.workspace import ReviewStore
from tests.test_ashby import JOB, FakeAshby
from tests.test_assessments import NewPeopleAI, expand_fixture
from tests.test_feedback import FakeAI


def rubric_model(prompt, schema):
    return {
        "dimensions": [
            {
                "key": "technical",
                "label": "Technical delivery",
                "weight": 60,
                "levels": [
                    "Unknown",
                    "Title",
                    "Relevant work",
                    "Strong results",
                    "Repeated excellence",
                    "Rare verified benchmark",
                ],
            },
            {
                "key": "leadership",
                "label": "Team leadership",
                "weight": 40,
                "levels": [
                    "Unknown",
                    "Title",
                    "Led a team",
                    "Strong team results",
                    "Repeated excellent teams",
                    "Rare verified benchmark",
                ],
            },
        ],
        "sampling_terms": ["engineer", "research"],
        "guidance": "Use job-relevant evidence, verify outcomes, and keep missing evidence unknown.",
    }


class FixtureCatalog(SearchCatalog):
    def get(self, search_id=""):
        store = super().get(search_id)

        def assessment_model(prompt, schema):
            if args.demo:
                if store.assessments.cancel_event.wait(0.5):
                    raise CancelledError()
                return NewPeopleAI()(prompt, schema)
            if store.assessments.status().get("mode") == "feedback":
                payload = json.loads(prompt[prompt.index('{"rubric"') :])
                if payload["people"][0]["person_key"] == "person-1":
                    deadline = time.monotonic() + 120
                    while time.monotonic() < deadline:
                        if (
                            store.flags()
                            .get("person-0", {})
                            .get("notes", "")
                            .startswith("Finish feedback update")
                        ):
                            break
                        if store.assessments.cancel_event.wait(0.05):
                            raise CancelledError()
                    else:
                        raise ValueError("Synthetic feedback test timed out")
                answer = NewPeopleAI()(prompt, schema)
                if payload["people"][0]["person_key"] == "person-0":
                    answer["candidates"][0]["dimensions"]["delivery"].update(
                        score=4,
                        evidence="Manager reports exceptional repeated delivery.",
                        source_fields=["manager_feedback"],
                    )
                return answer
            # A 41-person run is the browser's deterministic cancellation scenario.
            if store.assessments.status().get("count") == 41:
                payload = json.loads(prompt[prompt.index('{"rubric"') :])
                if payload["people"][0]["person_key"] == "new-000":
                    return NewPeopleAI()(prompt, schema)
                if payload["people"][0]["person_key"] == "new-001":
                    deadline = time.monotonic() + 60
                    while time.monotonic() < deadline:
                        if (
                            store.flags()
                            .get("new-000", {})
                            .get("notes", "")
                            .startswith("Early note")
                        ):
                            return NewPeopleAI()(prompt, schema)
                        if store.assessments.cancel_event.wait(0.05):
                            raise CancelledError()
                if store.assessments.cancel_event.wait(60):
                    raise CancelledError()
                raise ValueError("Synthetic cancellation test timed out")
            if store.assessments.status().get("count") == 3:
                payload = json.loads(prompt[prompt.index('{"rubric"') :])
                if payload["people"][0]["person_key"] == "new-002":
                    deadline = time.monotonic() + 60
                    while time.monotonic() < deadline:
                        if (
                            store.flags()
                            .get("new-000", {})
                            .get("notes", "")
                            .startswith("Finish this run")
                        ):
                            return NewPeopleAI()(prompt, schema)
                        if store.assessments.cancel_event.wait(0.05):
                            raise CancelledError()
                    raise ValueError("Synthetic completion test timed out")
            return NewPeopleAI()(prompt, schema)

        store.assessments.runner = assessment_model
        store.feedback.runner = FakeAI()
        return store


parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("--port", type=int, default=0)
parser.add_argument("--demo", action="store_true", help="Complete sample assessments without test pauses")
args = parser.parse_args()

with tempfile.TemporaryDirectory(prefix="talent-ui-") as directory:
    root = Path(directory)
    data = expand_fixture(root, count=103)
    data["role"] = {
        "title": "Research Program Lead",
        "organization": "Example Labs",
        "brief": "Synthetic role.",
    }
    data["people"][0]["name"] = "Alex Example With A Long Candidate Name"
    data["people"][0]["source"]["past_roles"] = (
        "Led research programs, hired a multidisciplinary team, and built tools with several external contributors. "
        * 3
    )
    for person in data["people"]:
        person["source"]["linkedin"] = "https://example.invalid/profile"
    write_json(root / "history/initial.json", data)
    write_json(
        root / "workspace.json",
        {
            "id": "synthetic-ui",
            "name": "Synthetic people.csv",
            "ashby_job": {"id": JOB, "title": "Research Program Lead"},
        },
    )
    store = ReviewStore(root)
    catalog = FixtureCatalog(store, AshbyIntegration(root, FakeAshby()))
    transport.draft_role = lambda **kwargs: draft_role(**kwargs, runner=rubric_model)
    server = ThreadingHTTPServer(("127.0.0.1", args.port), handler_for(store, catalog, synthetic=True))
    print(json.dumps({"url": f"http://127.0.0.1:{server.server_port}"}), flush=True)
    try:
        server.serve_forever()
    finally:
        server.server_close()
