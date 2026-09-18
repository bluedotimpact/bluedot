"""A server owns one default search and any additional searches created in its UI."""

import re
import threading
from uuid import uuid4

from .ashby import AshbyIntegration
from .imports import import_search, reuse_people
from .storage import read_json, require, write_json
from .workspace import ReviewStore


class SearchCatalog:
    def __init__(self, default: ReviewStore, ashby=None):
        self.default = default
        self.ashby = ashby or AshbyIntegration(default.local)
        self.root = default.local / "searches"
        self._stores = {}
        self._lock = threading.Lock()

    def get(self, search_id: str = "") -> ReviewStore:
        if not search_id:
            return self.default
        require(re.fullmatch(r"[a-f0-9]{32}", search_id), "Invalid search ID")
        with self._lock:
            if search_id not in self._stores:
                path = self.root / search_id
                require((path / "current.json").is_file(), "Search not found")
                self._stores[search_id] = ReviewStore(path)
            return self._stores[search_id]

    def listing(self, active_id: str) -> dict:
        rows = []
        if (self.default.local / "current.json").exists():
            data = self.default.dataset()
            rows.append(
                {
                    "id": "",
                    "ashby_job_id": (data["workspace"].get("ashby_job") or {}).get("id"),
                    "title": data["role"]["title"],
                    "pool": data["workspace"]["name"],
                    "url": "/",
                }
            )
        for folder in sorted(self.root.glob("*")):
            if re.fullmatch(r"[a-f0-9]{32}", folder.name) and (folder / "current.json").exists():
                settings = read_json(folder / "workspace.json")
                rows.append(
                    {
                        "id": folder.name,
                        "ashby_job_id": (settings.get("ashby_job") or {}).get("id"),
                        "title": settings["role"]["title"],
                        "pool": settings["name"],
                        "url": f"/search/{folder.name}/",
                    }
                )
        return {
            "searches": rows,
            "active_id": active_id,
            "configured": any(r["id"] == active_id for r in rows),
            "token": self.get(active_id).token,
        }

    def create(self, payload: dict) -> dict:
        payload = dict(payload)
        job_id = payload.pop("ashby_job_id", None)
        job = self.ashby.job(job_id) if job_id else None
        if job:
            payload["role"] = {**payload["role"], "title": job["title"]}
        search_id = uuid4().hex
        destination = self.root / search_id
        if "source_search_id" in payload:
            require(
                set(payload) == {"source_search_id", "role"},
                "Choose a people pool and approved role criteria.",
            )
            reuse_people(destination, self.get(payload["source_search_id"]), payload["role"])
        else:
            require(
                set(payload) == {"csv", "filename", "mapping", "role"},
                "CSV, filename, mapping and approved role required",
            )
            import_search(
                destination,
                payload["csv"],
                payload["filename"],
                payload["mapping"],
                payload["role"],
            )
        if job:
            path = destination / "workspace.json"
            settings = read_json(path)
            settings["ashby_job"] = {"id": job["id"], "title": job["title"]}
            write_json(path, settings)
        return {"id": search_id, "url": f"/search/{search_id}/"}
