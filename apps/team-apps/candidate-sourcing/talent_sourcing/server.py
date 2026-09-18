"""Local HTTP transport. Business rules live in the search and workflow modules."""

import argparse
import json
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse

from .imports import inspect_csv
from .roles import draft_role
from .searches import SearchCatalog
from .storage import LOCAL, require
from .workspace import ReviewStore


def handler_for(default_store, catalog=None, *, synthetic=False):
    catalog = catalog or SearchCatalog(default_store)

    class Handler(BaseHTTPRequestHandler):
        def log_message(self, format, *args):
            pass  # Do not put names, notes, or contacts in access logs.

        def respond(self, status, value, kind="application/json; charset=utf-8"):
            body = (
                json.dumps(value, ensure_ascii=False).encode()
                if kind.startswith("application/json")
                else value.encode()
            )
            self.send_response(status)
            self.send_header("Content-Type", kind)
            self.send_header("Content-Length", str(len(body)))
            self.send_header("Cache-Control", "no-store")
            self.send_header("X-Content-Type-Options", "nosniff")
            self.send_header("Referrer-Policy", "no-referrer")
            self.send_header(
                "Content-Security-Policy",
                "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'",
            )
            self.end_headers()
            self.wfile.write(body)

        def valid_host(self):
            allowed = {
                f"127.0.0.1:{self.server.server_port}",
                f"localhost:{self.server.server_port}",
            }
            return self.headers.get("Host") in allowed

        def search_route(self):
            path = urlparse(self.path).path
            if path.startswith("/search/"):
                pieces = path.split("/", 3)
                require(len(pieces) == 4, "Search address needs a trailing slash")
                search_id, path = pieces[2], "/" + pieces[3]
                return catalog.get(search_id), search_id, path
            return default_store, "", path

        def do_GET(self):
            if not self.valid_host():
                return self.respond(403, {"error": "Local host required"})
            try:
                store, search_id, path = self.search_route()
                if path == "/api/ashby/jobs":
                    try:
                        return self.respond(200, catalog.ashby.jobs())
                    except ValueError as error:
                        return self.respond(502, {"error": str(error)})
                if path == "/api/ashby/job":
                    query = parse_qs(urlparse(self.path).query)
                    return self.respond(200, catalog.ashby.details(query.get("id", [""])[0]))
                if path == "/api/searches":
                    return self.respond(200, catalog.listing(search_id))
                if path == "/api/data":
                    return self.respond(
                        200,
                        {
                            **store.dataset(),
                            "reviews": store.flags(),
                            "ashby_leads": catalog.ashby.receipts(store),
                            "token": store.token,
                        },
                    )
                if path == "/api/reviews":
                    return self.respond(200, store.flags())
                if path == "/api/feedback":
                    return self.respond(200, store.feedback.status())
                if path == "/api/assessments/results":
                    query = parse_qs(urlparse(self.path).query)
                    try:
                        require(
                            set(query) <= {"job_id", "after"}, "Invalid assessment results query"
                        )
                        require(
                            len(query.get("job_id", [])) == 1
                            and len(query.get("after", ["0"])) == 1,
                            "Assessment run and results position required",
                        )
                        return self.respond(
                            200,
                            store.assessments.results(
                                query["job_id"][0], int(query.get("after", ["0"])[0])
                            ),
                        )
                    except ValueError as error:
                        return self.respond(400, {"error": str(error)})
                if path == "/api/assessments":
                    return self.respond(200, store.assessments.status())
                if path == "/api/health":
                    configured = (store.local / "current.json").exists()
                    return self.respond(
                        200,
                        {
                            "ok": True,
                            "synthetic": synthetic,
                            "revision": store.dataset()["revision"] if configured else None,
                        },
                    )
                return self.respond(404, {"error": "Not found"})
            except (OSError, ValueError, KeyError) as e:
                return self.respond(500, {"error": f"Local data could not be loaded: {e}"})

        def do_POST(self):
            if not self.valid_host():
                return self.respond(403, {"error": "Local host required"})
            if self.headers.get("Origin") not in {
                f"http://127.0.0.1:{self.server.server_port}",
                f"http://localhost:{self.server.server_port}",
            }:
                return self.respond(403, {"error": "Same-origin request required"})
            try:
                store, search_id, path = self.search_route()
            except ValueError as error:
                return self.respond(400, {"error": str(error)})
            if self.headers.get("X-Review-Token") != store.token:
                return self.respond(403, {"error": "Session changed. Reload before saving."})
            if path not in {
                "/api/searches/inspect",
                "/api/searches/create",
                "/api/roles/draft",
                "/api/review",
                "/api/ashby/lead",
                "/api/feedback/review",
                "/api/feedback/approve",
                "/api/feedback/dismiss",
                "/api/assessments/start",
                "/api/assessments/retry",
                "/api/assessments/cancel",
                "/api/assessments/full",
            }:
                return self.respond(404, {"error": "Not found"})
            try:
                require(
                    self.headers.get("Content-Type", "").split(";")[0] == "application/json",
                    "JSON required",
                )
                length = int(self.headers.get("Content-Length", "0"))
                limit = (
                    29 * 1024 * 1024
                    if path in {"/api/searches/inspect", "/api/searches/create"}
                    else 200000
                )
                require(0 < length <= limit, "Invalid request size")
                body = json.loads(self.rfile.read(length))
                require(isinstance(body, dict), "JSON object required")
                if path == "/api/ashby/lead":
                    require(
                        set(body) - {"assessment_job_id"}
                        == {"person_key", "revision", "review_version"},
                        "Person, assessment revision and saved review version required",
                    )
                    return self.respond(
                        200,
                        catalog.ashby.add_lead(
                            store,
                            body["person_key"],
                            body["revision"],
                            body["review_version"],
                            body.get("assessment_job_id"),
                        ),
                    )
                if path == "/api/searches/inspect":
                    require(set(body) == {"csv"}, "CSV upload required")
                    return self.respond(200, inspect_csv(body["csv"]))
                if path == "/api/roles/draft":
                    require(
                        set(body) == {"title", "brief", "organization"},
                        "Role title, brief and organization required",
                    )
                    return self.respond(200, draft_role(**body))
                if path == "/api/searches/create":
                    return self.respond(200, catalog.create(body))
                if path == "/api/assessments/start":
                    require(
                        set(body) == {"count", "revision"},
                        "Number of additional people and current revision required",
                    )
                    return self.respond(
                        200, store.assessments.start(body["count"], body["revision"])
                    )
                if path == "/api/assessments/full":
                    require(set(body) == {"revision"}, "Current revision required")
                    return self.respond(200, store.assessments.start_full(body["revision"]))
                if path == "/api/assessments/cancel":
                    require(set(body) == {"job_id"}, "Assessment run ID required")
                    return self.respond(200, store.assessments.cancel(body["job_id"]))
                if path == "/api/assessments/retry":
                    require(set(body) == {"job_id"}, "Assessment run ID required")
                    return self.respond(200, store.assessments.retry(body["job_id"]))
                if path == "/api/feedback/review":
                    require(set(body) <= {"context"}, "Invalid feedback fields")
                    return self.respond(200, store.feedback.start(body.get("context", "")))
                if path in {"/api/feedback/approve", "/api/feedback/dismiss"}:
                    require(
                        set(body) == {"job_id"},
                        "Feedback review ID required",
                    )
                    if path.endswith("approve"):
                        return self.respond(
                            200,
                            store.feedback.approve(body["job_id"]),
                        )
                    return self.respond(200, store.feedback.dismiss(body["job_id"]))
                require(
                    isinstance(body, dict) and set(body) == {"person_key", "patch", "version"},
                    "Invalid request fields",
                )
                saved, conflict = store.update(body["person_key"], body["patch"], body["version"])
                if conflict is not None:
                    return self.respond(
                        409,
                        {
                            "error": "This review changed in another tab. Your draft is preserved; reload to compare before saving.",
                            "current": conflict,
                        },
                    )
                return self.respond(200, saved)
            except (ValueError, TypeError, KeyError) as e:
                return self.respond(400, {"error": str(e)})
            except OSError as e:
                return self.respond(500, {"error": f"Review was not saved: {e}"})

    return Handler


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--port", type=int, default=8769)
    parser.add_argument("--data-dir", type=Path, default=LOCAL)
    args = parser.parse_args()
    store = ReviewStore(args.data_dir)
    if (store.local / "current.json").exists():
        store.dataset()  # Fail before serving a broken existing search.
    import threading

    catalog = SearchCatalog(store)
    if catalog.ashby.client.key:
        threading.Thread(target=catalog.ashby.warm, daemon=True).start()
    server = ThreadingHTTPServer(("127.0.0.1", args.port), handler_for(store, catalog))
    print(f"Candidate sourcing engine: http://127.0.0.1:{args.port}", flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        server.server_close()
