"""A search owns its history, role and human reviews; no global candidate state."""

import hashlib
import secrets
import threading
from datetime import datetime, timezone
from pathlib import Path

from .storage import LOCAL, read_json, require, write_json


class ReviewStore:
    def __init__(self, local):
        self.local = Path(local).resolve()
        # Approval hands off to the assessment flow inside the same transaction.
        self.lock = threading.RLock()
        self.token = secrets.token_urlsafe(32)
        from .feedback import FeedbackFlow

        self.feedback = FeedbackFlow(self)
        from .assessments import AssessmentFlow

        self.assessments = AssessmentFlow(self)

    def dataset(self):
        current = read_json(self.local / "current.json")
        revision = current["revision"]
        require(
            "/" not in revision and "\\" not in revision and ".." not in revision,
            "Invalid current revision",
        )
        dataset = read_json(self.local / "history" / (revision + ".json"))
        # Presentation settings belong to the dataset, never to a second app.
        # The immutable assessment snapshot and human reviews stay untouched.
        settings_path = self.local / "workspace.json"
        settings = read_json(settings_path) if settings_path.exists() else {}
        manifest = dataset.get("manifest", {})
        require(
            dataset.get("score_scale") == 100,
            "Overall scores must use 0–100; migrate this snapshot before serving",
        )
        dataset["workspace"] = {
            "id": settings.get("id", hashlib.sha256(str(self.local).encode()).hexdigest()[:24]),
            "name": settings.get(
                "name",
                Path(manifest.get("source_path", manifest.get("source", "Candidate pool"))).name,
            ),
            "score_scale": 100,
            "ashby_job": settings.get("ashby_job"),
            "calibration": settings.get("calibration", dataset.get("calibration", [])),
            "feedback_note": settings.get(
                "feedback_note",
                "Check each profile's quality notes and source evidence.",
            ),
            "legacy_draft_key": settings.get(
                "legacy_draft_key",
                "bluedot-campus-lead-review-drafts" if self.local == LOCAL.resolve() else None,
            ),
        }
        # Preserve imported sampling metadata as search configuration, never role constants.
        sampling_weights = settings.get("sampling_weights", {})
        if sampling_weights:
            for person in dataset["people"]:
                if (
                    "selection_priority" not in person
                    and "selection_priority" not in person["source"]
                ):
                    person["selection_priority"] = sum(
                        person.get("selection_signals", {}).get(key, 0) * weight
                        for key, weight in sampling_weights.items()
                    )
        dataset.setdefault(
            "role",
            settings.get("role", {"title": "Saved search", "brief": "", "organization": ""}),
        )
        return dataset

    def flags(self):
        path = self.local / "flags.json"
        return read_json(path) if path.exists() else {}

    def update(self, key, patch, expected):
        require(
            isinstance(patch, dict) and bool(patch) and set(patch) <= {"star", "triage", "notes"},
            "Invalid review fields",
        )
        if "star" in patch:
            require(type(patch["star"]) is bool, "Star must be true or false")
        if "triage" in patch:
            require(patch["triage"] in {"", "yes", "maybe", "no"}, "Invalid triage status")
        if "notes" in patch:
            require(
                isinstance(patch["notes"], str) and len(patch["notes"]) <= 20000,
                "Notes must be at most 20,000 characters",
            )
        require(type(expected) is int and expected >= 0, "Expected review version required")
        require(
            key in {p["person_key"] for p in self.dataset()["people"]},
            "Unknown person key",
        )
        with self.lock:
            flags = self.flags()
            old = flags.get(key, {"star": False, "triage": "", "notes": "", "version": 0})
            if old["version"] != expected:
                return None, old
            new = {
                **old,
                **patch,
                "version": old["version"] + 1,
                "updated_at": datetime.now(timezone.utc).isoformat(),
            }
            flags[key] = new
            write_json(self.local / "flags.json", flags)
            return new, None
