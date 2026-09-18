"""Durable job lifecycle, crash recovery, progress and worker errors."""

import hashlib
import json
import threading
from concurrent.futures import CancelledError
from datetime import datetime, timezone

from .storage import read_json, require, write_json

BUSY = ("reviewing", "applying", "cancelling")

CANCELLED_MESSAGE = (
    "Assessment cancelled. Your previous criteria, ranking and saved reviews are unchanged. "
    "Start another run when you are ready."
)


def now():
    return datetime.now(timezone.utc).isoformat()


def digest(value):
    return hashlib.sha256(
        json.dumps(value, sort_keys=True, ensure_ascii=False).encode()
    ).hexdigest()


class JobFlow:
    def __init__(self, store, runner, folder):
        self.store = store
        self.root = store.local / folder
        self.runner = runner
        self.thread = None
        self.cancel_event = threading.Event()
        # Recover a completed pointer switch; never repeat an interrupted AI job.
        job = self._latest()
        if job and job["status"] in BUSY:
            pointer = read_json(store.local / "current.json")
            if job.get("result_revision") == pointer["revision"]:
                job.update(
                    status="complete",
                    message="Ranking updated. Review the changes below.",
                )
            elif job["status"] == "cancelling":
                job.update(status="cancelled", message=CANCELLED_MESSAGE)
            else:
                message = (
                    "The server restarted. Retry to continue from saved batches."
                    if folder == "assessments"
                    else "The server restarted during this review. Your notes are saved. Start a new review here."
                )
                job.update(status="error", message=message)
            self._write(job)

    def _path(self, job_id):
        require(
            isinstance(job_id, str)
            and len(job_id) == 32
            and all(c in "0123456789abcdef" for c in job_id),
            "Invalid feedback review ID",
        )
        return self.root / job_id

    def _latest(self):
        pointer = self.root / "current.json"
        return (
            read_json(self._path(read_json(pointer)["job_id"]) / "job.json")
            if pointer.exists()
            else None
        )

    def _write(self, job):
        job["updated_at"] = now()
        write_json(self._path(job["id"]) / "job.json", job)

    def _public(self, job):
        if not job:
            return None
        result = {k: v for k, v in job.items() if k not in {"reviews_hash"}}
        return result

    def status(self):
        with self.store.lock:
            return self._public(self._latest())

    def _check_cancelled(self):
        if self.cancel_event.is_set():
            raise CancelledError()

    def _launch(self, method, job_id):
        self.cancel_event = threading.Event()
        self.thread = threading.Thread(target=self._work, args=(method, job_id), daemon=True)
        self.thread.start()

    def _work(self, method, job_id):
        try:
            method(job_id)
        except Exception as error:
            with self.store.lock:
                job = read_json(self._path(job_id) / "job.json")
                if isinstance(error, CancelledError) or self.cancel_event.is_set():
                    job.update(status="cancelled", message=CANCELLED_MESSAGE)
                else:
                    job.update(
                        status="error",
                        message=str(error)
                        if isinstance(error, ValueError)
                        else "The review could not be completed. Your notes are saved. Retry here.",
                    )
                self._write(job)

    def _progress(self, job_id, **patch):
        with self.store.lock:
            self._check_cancelled()
            job = read_json(self._path(job_id) / "job.json")
            job.update(patch)
            self._write(job)
