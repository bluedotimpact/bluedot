"""Ashby transport and resumable lead exports. No model calls or browser credentials."""

import base64
import hashlib
import json
import os
import re
import threading
import time
from concurrent.futures import ThreadPoolExecutor
from urllib.error import HTTPError, URLError
from urllib.parse import unquote, urlparse
from urllib.request import Request, urlopen

from .storage import ROOT, read_json, require, write_json


class AshbyError(ValueError):
    def __init__(self, message, *, uncertain=False):
        super().__init__(message)
        self.uncertain = uncertain


class AshbyClient:
    def __init__(self, key=None):
        key_file = ROOT / ".ashby-key"
        self.key = (
            key
            if key is not None
            else (
                os.environ.get("ASHBY_API_KEY")
                or (key_file.read_text().strip() if key_file.exists() else "")
            )
        )

    def call(self, endpoint, **params):
        if not self.key:
            raise AshbyError(
                "Ashby is not connected. Set ASHBY_API_KEY on the server and restart it."
            )
        request = Request(
            "https://api.ashbyhq.com/" + endpoint,
            data=json.dumps(params).encode(),
            headers={
                "Authorization": "Basic " + base64.b64encode((self.key + ":").encode()).decode(),
                "Content-Type": "application/json",
                "User-Agent": "TalentSourcing/1.0",
            },
        )
        try:
            with urlopen(request, timeout=25) as response:
                result = json.load(response)
        except HTTPError as error:
            raise AshbyError(
                f"Ashby {endpoint} returned HTTP {error.code}. "
                "Check the connection and API key permissions, then retry.",
                uncertain=error.code >= 500,
            ) from None
        except (URLError, TimeoutError, OSError, ValueError):
            raise AshbyError(
                f"Ashby did not confirm {endpoint}. Check the connection, then retry.",
                uncertain=True,
            ) from None
        if not result.get("success"):
            info = result.get("errorInfo") or {}
            code = info.get("code") or ", ".join(map(str, result.get("errors", [])))
            raise AshbyError(
                f"Ashby {endpoint} failed ({code or 'request rejected'}). Check the API key permissions and retry."
            )
        return result

    def pages(self, endpoint, **params):
        seen = set()
        while True:
            page = self.call(endpoint, limit=100, **params)
            yield page
            if not page.get("moreDataAvailable"):
                break
            cursor = page.get("nextCursor")
            require(
                cursor and cursor not in seen,
                "Ashby returned incomplete pagination. Retry before adding anyone.",
            )
            seen.add(cursor)
            params["cursor"] = cursor


def linkedin(value):
    parsed = urlparse(str(value).strip())
    if parsed.scheme not in {"http", "https"} or not (
        parsed.hostname == "linkedin.com" or (parsed.hostname or "").endswith(".linkedin.com")
    ):
        return ""
    path = unquote(parsed.path).rstrip("/").casefold()
    return "https://www.linkedin.com" + path if re.fullmatch(r"/in/[^/]+", path) else ""


def contacts(person):
    source, mapped = person.get("source", {}), person.get("contact", {})
    email = str(mapped.get("email") or source.get("email") or "").strip()
    require(
        not email or re.fullmatch(r"[^\s@]+@[^\s@]+\.[^\s@]+", email),
        "This person’s email is not valid. Correct their source contact before adding them to Ashby.",
    )
    link = linkedin(mapped.get("linkedin") or source.get("linkedin") or "")
    require(
        email or link,
        "This person needs an email or a LinkedIn profile to match them safely in Ashby.",
    )
    return email, link


def fit_note(data, person, review, job, marker):
    a = person.get("assessment")
    lines = [f"New lead: {person['name']} — {job['title']}", "", "Assessment"]
    if a:
        lines.extend(
            [
                a["summary"],
                f"Evidence score: {person['overall']}/100. Evidence coverage: {person['coverage']}%.",
                "Scores reflect available evidence, not hiring certainty.",
                "",
                "Evidence by criterion",
            ]
        )
        for key, d in a["dimensions"].items():
            lines.append(
                f"{data['labels'].get(key, key)}: {d['score']}/5 ({d['basis']}) — {d['evidence']}"
            )
            if d.get("source_fields"):
                lines.append("Source fields: " + ", ".join(d["source_fields"]))
        for flag, title in [
            ("quality_concern", "Quality concern"),
            ("internal", "Internal candidate"),
        ]:
            if a.get(flag):
                lines.extend(
                    [
                        "",
                        title
                        + ": "
                        + a.get(
                            "quality_note" if flag == "quality_concern" else "internal_note", ""
                        ),
                    ]
                )
        if a.get("mission"):
            lines.append("Mission evidence: " + a["mission"].get("note", ""))
        for key, flag in a.get("flags", {}).items():
            if flag.get("value") and flag.get("note"):
                lines.append(key.replace("_", " ").capitalize() + ": " + flag["note"])
        if a.get("questions"):
            lines.extend(["", "Questions to investigate", *["• " + q for q in a["questions"]]])
        if a.get("web_findings"):
            lines.extend(["", "Additional evidence"])
            for finding in a["web_findings"]:
                lines.append(
                    f"{finding.get('finding', '')} — {finding.get('url', '')} (checked {finding.get('checked_at', 'unknown')}; identity match: {finding.get('identity_match', 'not recorded')})"
                )
    else:
        lines.append(
            "Not yet assessed. Added based on the reviewer’s interest; no AI fit assessment is available."
        )
    if review.get("notes", "").strip():
        lines.extend(["", "Your review", review["notes"]])
    if review.get("triage"):
        lines.extend(
            [
                "",
                "Reviewer decision: "
                + {"yes": "Shortlist", "maybe": "Maybe", "no": "Pass"}[review["triage"]],
            ]
        )
    lines.extend(
        [
            "",
            f"Role: {job['title']} (Ashby job {job['id']})",
            f"Assessment revision: {data['revision']}",
            f"Criteria: {person.get('assessed_with') or data.get('criteria_version', 'original')}",
            "Source pool: " + data["workspace"]["name"],
        ]
    )
    email, link = contacts(person)
    if link:
        lines.append("LinkedIn: " + link)
    lines.extend(["", marker])
    return "\n".join(lines)


class AshbyIntegration:
    def __init__(self, root, client=None):
        self.root = root
        self.client = client or AshbyClient()
        self.lock = threading.RLock()
        self.active_exports = set()
        self.index_lock = threading.Lock()
        self.jobs_lock = threading.Lock()
        self.jobs_cache = None
        self.jobs_time = 0

    def jobs(self, refresh=False):
        with self.jobs_lock:
            if (
                not refresh
                and self.jobs_cache is not None
                and time.monotonic() - self.jobs_time < 60
            ):
                return self.jobs_cache
            jobs = [
                job
                for page in self.client.pages("job.list", status=["Open"])
                for job in page["results"]
                if job["status"] == "Open"
            ]
            self.jobs_cache = sorted(
                [{"id": j["id"], "title": j["title"]} for j in jobs],
                key=lambda j: j["title"].casefold(),
            )
            self.jobs_time = time.monotonic()
            return self.jobs_cache

    def job(self, job_id):
        require(
            isinstance(job_id, str) and re.fullmatch(r"[a-fA-F0-9-]{36}", job_id),
            "Choose an open Ashby role.",
        )
        job = self.client.call("job.info", id=job_id)["results"]
        require(
            job["status"] == "Open",
            "This role is no longer open in Ashby. Choose another open role.",
        )
        return job

    def details(self, job_id):
        job = self.job(job_id)
        description = ""
        if job.get("jobPostingIds"):
            posting = self.client.call("jobPosting.info", jobPostingId=job["jobPostingIds"][0])[
                "results"
            ]
            description = posting.get("descriptionPlain", "")
        return {"id": job["id"], "title": job["title"], "brief": description}

    def sync_candidates(self):
        # Incremental, private identity index. Never send resumes or contacts to the browser.
        with self.index_lock:
            path = self.root / "ashby-index.json"
            old = read_json(path) if path.exists() else {}
            candidates = dict(old.get("candidates", {}))
            params = {"syncToken": old["sync_token"]} if old.get("sync_token") else {}
            token = None
            for page in self.client.pages("candidate.list", **params):
                for c in page["results"]:
                    candidates[c["id"]] = {
                        "id": c["id"],
                        "name": c["name"],
                        "profileUrl": c.get("profileUrl", ""),
                        "emails": [e["value"].casefold() for e in c.get("emailAddresses", [])],
                        "linkedin": [
                            linkedin(s.get("url"))
                            for s in c.get("socialLinks", [])
                            if linkedin(s.get("url"))
                        ],
                    }
                token = page.get("syncToken")
            write_json(path, {"candidates": candidates, "sync_token": token})
            return candidates

    def warm(self):
        try:
            self.sync_candidates()
        except (ValueError, OSError):
            pass  # Exports retry and surface the error; warming never blocks the UI.

    def receipts(self, store):
        path = store.local / "ashby-leads.json"
        records = read_json(path) if path.exists() else {}
        for key, receipt in records.items():
            if (
                receipt.get("status") == "pending"
                and (str(store.local), key) not in self.active_exports
            ):
                receipt.update(
                    status="error",
                    error="The earlier export was interrupted. Retry adding to Ashby to check what was saved and finish the note.",
                )
        # Fit note snapshots remain server-side. Return only display status and verified links.
        return {
            key: {
                k: r[k]
                for k in ("status", "candidate_url", "job_id", "error", "updated_at")
                if k in r
            }
            for key, r in records.items()
        }

    def add_lead(self, store, key, revision, review_version, assessment_job_id=None):
        with self.lock:
            identity = (str(store.local), key)
            self.active_exports.add(identity)
            try:
                return self._export(store, key, revision, review_version, assessment_job_id)
            finally:
                self.active_exports.discard(identity)

    def _export(self, store, key, revision, review_version, assessment_job_id=None):
        # Serialize exports across role workspaces; human review saves keep their own lock.
        with self.lock:
            with store.lock:
                data = store.dataset()
                require(
                    revision == data["revision"],
                    "The assessment changed. Refresh and review it before adding this person.",
                )
                binding = data["workspace"].get("ashby_job")
                require(binding, "Connect this search to an open Ashby role first.")
                person = next((p for p in data["people"] if p["person_key"] == key), None)
                require(person, "This person is not in the current search. Refresh and try again.")
                if assessment_job_id:
                    status = store.assessments.status()
                    require(
                        status and status["id"] == assessment_job_id and status["mode"] == "more",
                        "Wait for the criteria update to finish before adding its new assessment.",
                    )
                    cursor, result = 0, None
                    while True:
                        page = store.assessments.results(assessment_job_id, cursor)
                        result = next(
                            (p for p in page["results"] if p["person_key"] == key), result
                        )
                        if (
                            result
                            or page["cursor"] >= page["available"]
                            or page["cursor"] <= cursor
                        ):
                            break
                        cursor = page["cursor"]
                    require(
                        result,
                        "This live assessment is no longer available. Refresh before adding this person.",
                    )
                    person = {**person, **result}
                review = store.flags().get(key, {"version": 0, "notes": ""})
                require(
                    type(review_version) is int and review_version == review["version"],
                    "Your review changed. Wait for it to save, then retry so the note includes your latest text.",
                )
                path = store.local / "ashby-leads.json"
                records = read_json(path) if path.exists() else {}
                receipt = records.get(key, {})
                if receipt.get("status") == "complete":
                    return self.receipts(store)[key]
            email, link = contacts(person)
            with ThreadPoolExecutor(max_workers=2) as pool:
                future = pool.submit(self.sync_candidates)
                job = self.job(binding["id"])
                candidates = future.result()
            if not receipt:
                marker = (
                    "Talent sourcing reference: "
                    + hashlib.sha256(
                        f"{data['workspace']['id']}:{key}:{job['id']}".encode()
                    ).hexdigest()[:24]
                )
                receipt = {
                    "job_id": job["id"],
                    "marker": marker,
                    "note": fit_note(data, person, review, job, marker),
                    "status": "pending",
                }
                records[key] = receipt
            require(
                receipt["job_id"] == job["id"],
                "This export belongs to another role. Refresh before retrying.",
            )

            def save():
                receipt["updated_at"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
                write_json(path, records)

            def create(endpoint, field, **params):
                # Persist intent before a write. An uncertain response must be reconciled by reads.
                receipt["inflight"] = field
                save()
                try:
                    result = self.client.call(endpoint, **params)["results"]
                except AshbyError as error:
                    if not error.uncertain:
                        receipt.pop("inflight", None)
                        save()
                    raise
                receipt[field] = result["id"]
                receipt.pop("inflight", None)
                save()
                return result

            try:
                if not receipt.get("candidate_id"):
                    matches = [
                        c
                        for c in candidates.values()
                        if (email and email.casefold() in c["emails"])
                        or (link and link in c["linkedin"])
                    ]
                    require(
                        len(matches) <= 1,
                        "More than one Ashby profile matches this email or LinkedIn. Merge or correct those profiles in Ashby, then retry; nobody was added.",
                    )
                    if matches:
                        candidate = matches[0]
                        receipt["candidate_id"] = candidate["id"]
                        receipt.pop("inflight", None)
                    else:
                        require(
                            receipt.get("inflight") != "candidate_id",
                            "Ashby has not confirmed the earlier candidate creation. Check Ashby and retry once the profile appears; another candidate will not be created automatically.",
                        )
                        params = {"name": person["name"]}
                        if email:
                            params["primaryEmailAddress"] = email
                        if link:
                            params["linkedInUrl"] = link
                        candidate = create("candidate.create", "candidate_id", **params)
                        with self.index_lock:
                            index_path = self.root / "ashby-index.json"
                            index = read_json(index_path)
                            index["candidates"][candidate["id"]] = {
                                "id": candidate["id"],
                                "name": person["name"],
                                "profileUrl": candidate.get("profileUrl", ""),
                                "emails": [email.casefold()] if email else [],
                                "linkedin": [link] if link else [],
                            }
                            write_json(index_path, index)
                    receipt["candidate_url"] = candidate.get("profileUrl", "")
                    save()
                cid = receipt["candidate_id"]
                if not receipt.get("application_id"):
                    candidate = self.client.call("candidate.info", id=cid)["results"]
                    receipt["candidate_url"] = candidate.get(
                        "profileUrl", receipt.get("candidate_url", "")
                    )
                    with ThreadPoolExecutor(max_workers=8) as pool:
                        apps = list(
                            pool.map(
                                lambda aid: self.client.call("application.info", applicationId=aid)[
                                    "results"
                                ],
                                candidate.get("applicationIds", []),
                            )
                        )
                    existing = next(
                        (
                            a
                            for a in apps
                            if a.get("jobId", (a.get("job") or {}).get("id")) == job["id"]
                        ),
                        None,
                    )
                    if existing:
                        receipt["application_id"] = existing["id"]
                        receipt.pop("inflight", None)
                        save()
                    else:
                        require(
                            receipt.get("inflight") != "application_id",
                            "Ashby has not confirmed the earlier lead creation. Retry once it appears in Ashby; another application will not be created automatically.",
                        )
                        create(
                            "application.create", "application_id", candidateId=cid, jobId=job["id"]
                        )
                if not receipt.get("note_id"):
                    # Read before retrying a note whose write may have succeeded before a timeout.
                    if receipt.get("inflight") == "note_id":
                        notes = [
                            n
                            for page in self.client.pages("candidate.listNotes", candidateId=cid)
                            for n in page["results"]
                        ]
                        existing = next(
                            (n for n in notes if receipt["marker"] in json.dumps(n)), None
                        )
                        require(
                            existing,
                            "The lead exists, but Ashby has not confirmed its note yet. Retry once the note appears; a duplicate note will not be posted.",
                        )
                        receipt["note_id"] = existing["id"]
                        receipt.pop("inflight", None)
                    else:
                        create(
                            "candidate.createNote",
                            "note_id",
                            candidateId=cid,
                            note=receipt["note"],
                            sendNotifications=False,
                        )
                receipt.update(status="complete", error="")
                save()
                return self.receipts(store)[key]
            except (ValueError, OSError) as error:
                prefix = (
                    "The lead is in Ashby, but its note is not confirmed. "
                    if receipt.get("application_id")
                    else ""
                )
                receipt.update(status="error", error=prefix + str(error))
                save()
                raise ValueError(receipt["error"]) from error
