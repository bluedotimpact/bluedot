"""Import a different role and CSV shape without inheriting campus-specific logic."""

import base64
import copy
import tempfile
import unittest
from pathlib import Path

from talent_sourcing.evidence import model_person
from talent_sourcing.imports import import_search, inspect_csv, parse_csv
from talent_sourcing.roles import draft_role, validate_role
from talent_sourcing.searches import SearchCatalog
from talent_sourcing.workspace import ReviewStore
from tests.test_assessments import NewPeopleAI
from tests.test_feedback import wait

CSV = 'Candidate ID,Full Name,Job Title,Email Address,LinkedIn URL,past_roles\r\n42,"Alex, Example",Engineering Lead,alex@example.invalid,https://example.invalid/alex,"Built tools, hired engineers"\r\n43,Alex Example,Researcher,other@example.invalid,,Published evaluations\r\n'
ROLE = {
    "title": "Engineering Lead",
    "organization": "Example Labs",
    "brief": "Build reliable research tools and lead an engineering team.",
    "rubric": "Technical delivery: 0 unknown; 1 title; 2 relevant work; 3 strong outcomes; 4 repeated quality; 5 rare corroborated excellence.",
    "dimensions": [
        {"key": "engineering", "label": "Technical delivery", "weight": 70},
        {"key": "hiring", "label": "Hiring engineers", "weight": 30},
    ],
    "sampling_terms": ["engineer", "built tools"],
}


def encoded(value=CSV):
    return base64.b64encode(value.encode()).decode()


class ImportTests(unittest.TestCase):
    def test_mapping_quotes_and_original_bytes(self):
        preview = inspect_csv(encoded())
        self.assertEqual(preview["row_count"], 2)
        self.assertEqual(preview["mapping"]["name"], "Full Name")
        self.assertEqual(preview["preview"][0]["Full Name"], "Alex, Example")
        mapping = preview["mapping"] | {"key": "Candidate ID"}
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary) / "search"
            import_search(root, encoded(), "export.csv", mapping, ROLE)
            self.assertEqual((root / "raw/source.csv").read_bytes(), CSV.encode())
            data = ReviewStore(root).dataset()
            self.assertEqual(data["role"]["title"], "Engineering Lead")
            self.assertEqual(data["weights"], {"engineering": 70, "hiring": 30})
            self.assertEqual(data["people"][0]["contact"]["email"], "alex@example.invalid")
            self.assertEqual(data["people"][0]["source"]["Full Name"], "Alex, Example")
            source = model_person(data["people"][0])["source"]
            self.assertNotIn("Email Address", source)
            self.assertNotIn("Candidate ID", source)
            self.assertEqual(len(data["people"]), 2)
            self.assertTrue(all(p["assessment"] is None for p in data["people"]))
            self.assertFalse((root / "flags.json").exists())
            with self.assertRaisesRegex(ValueError, "already exists"):
                import_search(root, encoded(), "export.csv", mapping, ROLE)

    def test_fresh_row_keys_duplicates_and_invalid_input(self):
        raw = "Name,Work\nSame Person,A\nSame Person,B\n"
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            keys = []
            for name in ["one", "two"]:
                import_search(root / name, encoded(raw), "people.csv", {"name": "Name"}, ROLE)
                data = ReviewStore(root / name).dataset()
                keys.append([p["person_key"] for p in data["people"]])
            self.assertEqual(keys[0], keys[1])
            self.assertNotEqual(keys[0][0], keys[0][1])
            with self.assertRaisesRegex(ValueError, "both have"):
                import_search(
                    root / "bad", encoded(raw), "people.csv", {"name": "Name", "key": "Name"}, ROLE
                )
            self.assertFalse((root / "bad").exists())
        for raw in ["Name,Name\nA,B\n", "Name,Role\nA,B,C\n", "Name,Role\n", "Name,,Role\nA,B,C\n"]:
            with self.subTest(raw=raw), self.assertRaises(ValueError):
                parse_csv(encoded(raw))
        with self.assertRaises(ValueError):
            parse_csv("not base64!")

    def test_id_errors_identify_people_and_explain_recovery_without_writing(self):
        cases = [
            (
                "Full Name,Email\nAlex Example,alex@example.invalid\nTaylor Example,   \n",
                ["Taylor Example", "has no value", "Email", "different, non-empty"],
            ),
            (
                "Full Name,Email\nAlex Example,shared@example.invalid\nTaylor Example, shared@example.invalid \n",
                ["Taylor Example", "Alex Example", "both have", "shared@example.invalid", "Email"],
            ),
            (
                "First,Last,ID\nAlex,Example,42\nTaylor,Example,42\n",
                ["Taylor Example", "Alex Example", "both have", "42", "ID"],
            ),
        ]
        for raw, details in cases:
            with self.subTest(raw=raw), tempfile.TemporaryDirectory() as temporary:
                destination = Path(temporary) / "search"
                mapping = inspect_csv(encoded(raw))["mapping"]
                with self.assertRaises(ValueError) as error:
                    import_search(destination, encoded(raw), "people.csv", mapping, ROLE)
                for detail in details + [
                    "Generate IDs automatically",
                    "Unique ID (optional)",
                    "Create search with these criteria",
                    "duplicate people",
                ]:
                    self.assertIn(detail, str(error.exception))
                self.assertNotIn("Row ", str(error.exception))
                self.assertFalse(destination.exists())
                # Following the suggested recovery keeps all entries separate.
                import_search(destination, encoded(raw), "people.csv", mapping | {"key": ""}, ROLE)
                people = ReviewStore(destination).dataset()["people"]
                self.assertEqual(len(people), 2)
                self.assertEqual(len({person["person_key"] for person in people}), 2)

    def test_missing_name_error_identifies_entry_and_selected_columns(self):
        raw = "Full Name,Email\n,alex@example.invalid\n"
        with tempfile.TemporaryDirectory() as temporary:
            destination = Path(temporary) / "search"
            with self.assertRaises(ValueError) as error:
                import_search(
                    destination,
                    encoded(raw),
                    "people.csv",
                    inspect_csv(encoded(raw))["mapping"],
                    ROLE,
                )
            for detail in ["Full Name", "alex@example.invalid", "column mapping", "corrected file"]:
                self.assertIn(detail, str(error.exception))
            self.assertFalse(destination.exists())

    def test_utf16_bom_semicolon_and_multiline(self):
        raw = 'Name;Evidence\r\nAlex;"Line one\nLine two"\r\n'.encode("utf-16")
        parsed = parse_csv(base64.b64encode(raw).decode())
        self.assertEqual(parsed.rows[0]["Evidence"], "Line one\nLine two")
        self.assertEqual(parsed.raw, raw)

    def test_invalid_role_is_rejected_before_any_write(self):
        for patch in [
            {"dimensions": [{"key": "x", "label": "X", "weight": 80}]},
            {"title": ""},
            {"sampling_terms": [""]},
            {"rubric": ""},
        ]:
            with self.subTest(patch=patch), self.assertRaises(ValueError):
                validate_role(ROLE | patch)

    def test_draft_has_role_specific_levels_and_exact_weights(self):
        calls = []

        def model(prompt, schema):
            calls.append(prompt)
            return {
                "dimensions": [
                    {
                        "key": "technical",
                        "label": "Technical delivery",
                        "weight": 100,
                        "levels": [
                            "Unknown",
                            "Title only",
                            "Built a tool",
                            "Reliable shipped tools",
                            "Repeated exceptional tools",
                            "Rare verified impact",
                        ],
                    }
                ],
                "sampling_terms": ["engineering"],
                "guidance": "Investigate quality and references.",
            }

        role = draft_role(ROLE["title"], ROLE["brief"], runner=model)
        self.assertIn("5: Rare verified impact", role["rubric"])
        self.assertEqual(role["dimensions"][0]["weight"], 100)
        self.assertNotIn("Alex", calls[0])

    def test_catalog_and_new_role_assessment_preserve_independent_reviews(self):
        with tempfile.TemporaryDirectory() as temporary:
            default = ReviewStore(Path(temporary))
            catalog = SearchCatalog(default)
            self.assertFalse(catalog.listing("")["configured"])
            payload = {
                "csv": encoded(),
                "filename": "people.csv",
                "mapping": inspect_csv(encoded())["mapping"],
                "role": copy.deepcopy(ROLE),
            }
            one, two = catalog.create(payload), catalog.create(payload)
            first, second = catalog.get(one["id"]), catalog.get(two["id"])
            before = first.dataset()
            key = before["people"][0]["person_key"]
            first.update(key, {"notes": "I have seen this technical work.", "star": True}, 0)
            notes = (first.local / "flags.json").read_bytes()
            self.assertEqual(second.flags(), {})
            self.assertNotEqual(
                first.dataset()["workspace"]["id"], second.dataset()["workspace"]["id"]
            )
            first.assessments.runner = NewPeopleAI()
            first.assessments.start_full(before["revision"])
            job = wait(first.assessments)
            self.assertEqual(job["status"], "complete", job)
            after = first.dataset()
            self.assertEqual(after["search_stage"], "final")
            self.assertEqual(after["people"][0]["overall"], 40)
            self.assertEqual(
                set(after["people"][0]["assessment"]["dimensions"]), {"engineering", "hiring"}
            )
            self.assertNotIn("mission", after["people"][0]["assessment"])
            self.assertEqual((first.local / "flags.json").read_bytes(), notes)
            self.assertEqual((first.local / "raw/source.csv").read_bytes(), CSV.encode())
            with self.assertRaises(ValueError):
                catalog.get("../outside")
