"""CSV inspection and immutable imports. Keep original bytes and every source field."""

import base64
import csv
import hashlib
import io
import json
import re
from dataclasses import dataclass
from pathlib import Path
from uuid import uuid4

from .jobs import digest, now
from .roles import validate_role
from .storage import require, write_json

MAX_CSV_BYTES = 20 * 1024 * 1024
MAX_ROWS = 50000
csv.field_size_limit(MAX_CSV_BYTES)


@dataclass(frozen=True)
class ParsedCSV:
    raw: bytes
    headers: list[str]
    rows: list[dict[str, str]]
    delimiter: str


def parse_csv(encoded: str) -> ParsedCSV:
    require(
        isinstance(encoded, str) and len(encoded) <= (MAX_CSV_BYTES * 4 // 3 + 4),
        "CSV must be at most 20 MB",
    )
    try:
        raw = base64.b64decode(encoded, validate=True)
    except ValueError:
        raise ValueError("Invalid CSV upload") from None
    require(0 < len(raw) <= MAX_CSV_BYTES, "Choose a CSV file of at most 20 MB")
    try:
        text = raw.decode("utf-16" if raw.startswith((b"\xff\xfe", b"\xfe\xff")) else "utf-8-sig")
    except UnicodeError:
        raise ValueError("Save the CSV as UTF-8 or UTF-16, then upload it again") from None
    require("\x00" not in text, "CSV contains null bytes")
    try:
        delimiter = csv.Sniffer().sniff(text[:65536], delimiters=",;\t|").delimiter
    except csv.Error:
        # A short export with quoted multiline cells can defeat whole-file sniffing.
        # Its header still provides a useful delimiter without reading cell contents.
        try:
            delimiter = csv.Sniffer().sniff(text.splitlines()[0], delimiters=",;\t|").delimiter
        except csv.Error:
            delimiter = ","
    reader = csv.DictReader(io.StringIO(text, newline=""), delimiter=delimiter, strict=True)
    try:
        headers = reader.fieldnames or []
        require(
            headers and all(h.strip() for h in headers),
            "CSV needs non-empty column headings",
        )
        require(len(headers) == len(set(headers)), "CSV contains duplicate column headings")
        require(len(headers) <= 250, "CSV supports up to 250 columns")
        rows = []
        for row in reader:
            require(
                None not in row and all(v is not None for v in row.values()),
                f"CSV has inconsistent columns near line {reader.line_num}",
            )
            if not any(v.strip() for v in row.values()):
                continue
            rows.append(row)
            require(len(rows) <= MAX_ROWS, "CSV supports up to 50,000 people per search")
    except csv.Error as error:
        raise ValueError(f"Could not read CSV: {error}") from None
    require(rows, "The CSV has no people")
    return ParsedCSV(raw, headers, rows, delimiter)


def suggest_mapping(headers: list[str]) -> dict:
    aliases = {
        "name": ["name", "full name", "fullname", "candidate name"],
        "first_name": ["first", "first name", "firstname"],
        "last_name": ["last", "last name", "lastname", "surname"],
        "key": ["person key", "person id", "id", "email", "email address"],
        "email": ["email", "email address"],
        "linkedin": ["linkedin", "linkedin url", "linkedin profile"],
        "headline": [
            "current role or status",
            "linkedin headline",
            "job title",
            "current title",
            "title",
            "role",
        ],
    }
    normalized = {re.sub(r"[_-]+", " ", h).strip().casefold(): h for h in headers}
    return {
        field: next((normalized[a] for a in names if a in normalized), "")
        for field, names in aliases.items()
    }


def inspect_csv(encoded: str) -> dict:
    parsed = parse_csv(encoded)
    return {
        "headers": parsed.headers,
        "row_count": len(parsed.rows),
        "preview": parsed.rows[:3],
        "mapping": suggest_mapping(parsed.headers),
        "delimiter": parsed.delimiter,
    }


def quoted(value: str) -> str:
    """Keep source values readable in errors, even when a cell contains long prose."""
    text = " ".join(value.split())
    return f"“{text[:120]}{'…' if len(text) > 120 else ''}”"


def import_search(destination: Path, encoded: str, filename: str, mapping: dict, role: dict) -> str:
    """Validate everything before creating a new search; never write human flags."""
    role = validate_role(role)
    parsed = parse_csv(encoded)
    require(
        isinstance(mapping, dict) and set(mapping) <= set(suggest_mapping([])),
        "Invalid column mapping",
    )
    require(
        all(isinstance(v, str) and (not v or v in parsed.headers) for v in mapping.values()),
        "Mapped column is missing",
    )
    require(
        mapping.get("name") or mapping.get("first_name") or mapping.get("last_name"),
        "Map a name column or first/last name columns",
    )
    require(isinstance(filename, str) and 0 < len(filename) <= 250, "Invalid filename")
    source_hash = hashlib.sha256(parsed.raw).hexdigest()
    keys = {}
    people = []
    for index, row in enumerate(parsed.rows, 1):
        mapped = {k: row.get(v, "").strip() for k, v in mapping.items()}
        name = mapped.get("name") or " ".join(
            filter(None, (mapped.get("first_name"), mapped.get("last_name")))
        )
        if not name:
            columns = list(
                dict.fromkeys(
                    mapping[field]
                    for field in ("name", "first_name", "last_name")
                    if mapping.get(field)
                )
            )
            clue = next(
                (
                    (mapping[field], mapped[field])
                    for field in ("email", "linkedin", "key")
                    if mapped.get(field)
                ),
                next((item for item in row.items() if item[1].strip()), ("", "")),
            )
            raise ValueError(
                f"One person has no name in the selected name columns: "
                f"{', '.join(quoted(column) for column in columns)}. "
                f"You can find this entry by {quoted(clue[0])}: {quoted(clue[1])}.\n\n"
                "In the column mapping, choose the column containing people's full names, or choose "
                "their first and last name columns. If the name is missing from the CSV, "
                "fill it in and upload the corrected file. Your role criteria are still here."
            )
        identity = mapped.get("key") if mapping.get("key") else f"{source_hash}:{index}"
        if not identity or identity in keys:
            column = quoted(mapping["key"])
            if not identity:
                problem = (
                    f"{quoted(name)} has no value in {column}, the column selected as the unique ID. "
                    "This column needs a different, non-empty value for every person."
                )
                alternative = f"fill in the missing values in {column}"
            else:
                problem = (
                    f"{quoted(name)} and {quoted(keys[identity])} both have {quoted(identity)} "
                    f"in {column}, the column selected as the unique ID. "
                    "The app needs a different ID for each entry to keep their reviews separate."
                )
                alternative = (
                    f"correct the repeated values in {column} "
                    "(or remove the extra entry if it is the same person)"
                )
            raise ValueError(
                f"Cannot create this search yet. {problem}\n\n"
                "To continue with every entry, go to the column mapping and set “Unique ID (optional)” "
                "to “Generate IDs automatically”. Then click “Create search with these criteria”. "
                "This keeps all entries, including any duplicate people.\n\n"
                f"Or {alternative} and upload the corrected CSV. Your role criteria are still here."
            )
        keys[identity] = name
        key = "person-" + hashlib.sha256(identity.encode()).hexdigest()[:24]
        text = " ".join(row.values()).casefold()
        priority = sum(term.casefold() in text for term in role["sampling_terms"])
        contact_fields = {mapping.get("email"), mapping.get("key")}
        contact_fields.update(
            h for h in parsed.headers if re.search(r"email|e-mail|phone|mobile", h, re.I)
        )
        people.append(
            {
                "person_key": key,
                "name": name,
                "source": row,
                "contact": {
                    "email": mapped.get("email", ""),
                    "linkedin": mapped.get("linkedin", ""),
                },
                "headline": mapped.get("headline", ""),
                "private_source_fields": sorted(contact_fields - {None, ""}),
                "assessment": None,
                "overall": None,
                "coverage": None,
                "rank": None,
                "enriched": False,
                "backgrounds": [],
                "internal": False,
                "selection_priority": priority,
                "richness": sum(min(len(v.strip()), 2000) for v in row.values()),
            }
        )
    role_metadata = {key: role[key] for key in ("title", "organization", "brief", "sampling_terms")}
    revision = "import-" + uuid4().hex
    weights = {d["key"]: d["weight"] for d in role["dimensions"]}
    labels = {d["key"]: d["label"] for d in role["dimensions"]}
    data = {
        "schema_version": 2,
        "revision": revision,
        "run": revision,
        "created_at": now(),
        "role": role_metadata,
        "rubric": role["rubric"],
        "criteria_version": digest(role["rubric"]),
        "search_stage": "calibration",
        "weights": weights,
        "labels": labels,
        "score_scale": 100,
        "formula": " + ".join(f"{weights[k]} × {labels[k]} / 5" for k in weights),
        "people": people,
        "calibration": [],
        "movement": {"baseline": None},
        "manifest": {
            "source": Path(filename).name,
            "source_sha256": source_hash,
            "pool_count": len(people),
            "sample_count": 0,
            "column_mapping": mapping,
            "selection": "Initial batches prioritize sampling-term matches, then profile detail. These are sampling aids, not ability scores. The final search evaluates every person.",
        },
    }
    require(not destination.exists(), "Search already exists")
    destination.mkdir(parents=True)
    raw_path = destination / "raw/source.csv"
    raw_path.parent.mkdir()
    raw_path.write_bytes(parsed.raw)
    raw_path.chmod(0o400)
    write_json(
        destination / "workspace.json",
        {"id": destination.name, "name": Path(filename).name, "role": role_metadata},
    )
    write_json(destination / "history" / (revision + ".json"), data, exclusive=True)
    write_json(destination / "current.json", {"revision": revision})
    return revision


def reuse_people(destination, source, role):
    """Start a role with the same source people, never another role's scores or reviews."""
    import shutil

    role = validate_role(role)
    data = source.dataset()
    for person in data["people"]:
        prior = person.get("assessment") or {}
        if prior.get("web_findings"):
            person["source"]["Previous research findings (verify identity)"] = json.dumps(
                prior["web_findings"], ensure_ascii=False
            )
        if prior.get("quality_concern") and prior.get("quality_note"):
            person["source"]["Previous assessment concerns (recheck for this role)"] = prior[
                "quality_note"
            ]
        person.update(assessment=None, overall=None, coverage=None, rank=None, enriched=False)
        person.pop("assessed_with", None)
        person["selection_priority"] = sum(
            term.casefold() in " ".join(map(str, person["source"].values())).casefold()
            for term in role["sampling_terms"]
        )
    revision = "import-" + uuid4().hex
    metadata = {key: role[key] for key in ("title", "organization", "brief", "sampling_terms")}
    weights = {d["key"]: d["weight"] for d in role["dimensions"]}
    labels = {d["key"]: d["label"] for d in role["dimensions"]}
    data.update(
        schema_version=2,
        revision=revision,
        run=revision,
        created_at=now(),
        role=metadata,
        rubric=role["rubric"],
        criteria_version=digest(role["rubric"]),
        search_stage="calibration",
        weights=weights,
        labels=labels,
        calibration=[],
        movement={"baseline": None},
        formula=" + ".join(f"{weights[k]} × {labels[k]} / 5" for k in weights),
    )
    data["manifest"]["sample_count"] = 0
    for key in ("workspace", "newly_assessed_keys", "reviews", "token"):
        data.pop(key, None)
    require(not destination.exists(), "Search already exists")
    destination.mkdir(parents=True)
    raw = source.local / "raw/source.csv"
    if raw.exists():
        (destination / "raw").mkdir()
        shutil.copyfile(raw, destination / "raw/source.csv")
        (destination / "raw/source.csv").chmod(0o400)
    write_json(
        destination / "workspace.json",
        {"id": destination.name, "name": source.dataset()["workspace"]["name"], "role": metadata},
    )
    write_json(destination / "history" / (revision + ".json"), data, exclusive=True)
    write_json(destination / "current.json", {"revision": revision})
