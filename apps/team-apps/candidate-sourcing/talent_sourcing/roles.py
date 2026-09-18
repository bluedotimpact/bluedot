"""Role configuration and rubric drafting, independent of any candidate pool."""

import json
import re
from typing import TypedDict

from .model import ask_claude
from .prompts import prompt_text
from .schemas import STRING, STRINGS, array, check_schema, obj
from .storage import require


class Dimension(TypedDict):
    key: str
    label: str
    weight: int


class Role(TypedDict):
    title: str
    organization: str
    brief: str
    rubric: str
    dimensions: list[Dimension]
    sampling_terms: list[str]


def validate_role(role: dict) -> Role:
    """Validate user-approved configuration before importing or sending it to a model."""
    require(isinstance(role, dict), "Role must be an object")
    for key, limit in [
        ("title", 200),
        ("organization", 200),
        ("brief", 50000),
        ("rubric", 100000),
    ]:
        value = role.get(key, "")
        require(isinstance(value, str) and len(value) <= limit, f"Invalid {key}")
        if key in {"title", "brief", "rubric"}:
            require(value.strip(), f"Add the role {key}")
    dimensions = role.get("dimensions")
    require(
        isinstance(dimensions, list) and 1 <= len(dimensions) <= 8,
        "Use 1–8 scoring dimensions",
    )
    keys = set()
    for dimension in dimensions:
        require(
            isinstance(dimension, dict) and set(dimension) == {"key", "label", "weight"},
            "Invalid dimension fields",
        )
        key = dimension["key"]
        require(
            isinstance(key, str) and re.fullmatch(r"[a-z][a-z0-9_]{0,39}", key),
            "Dimension keys must be short lowercase identifiers",
        )
        require(key not in keys, "Dimension keys must be unique")
        keys.add(key)
        require(
            isinstance(dimension["label"], str) and 0 < len(dimension["label"].strip()) <= 100,
            "Add a dimension label",
        )
        require(
            type(dimension["weight"]) is int and 1 <= dimension["weight"] <= 100,
            "Each weight must be a whole percentage from 1 to 100",
        )
    require(
        sum(d["weight"] for d in dimensions) == 100,
        "Dimension weights must add up to 100%",
    )
    terms = role.get("sampling_terms", [])
    require(
        isinstance(terms, list)
        and len(terms) <= 30
        and all(isinstance(t, str) and 1 <= len(t.strip()) <= 80 for t in terms),
        "Use up to 30 short sampling terms",
    )
    return {k: role.get(k, "" if k == "organization" else []) for k in Role.__annotations__}


def draft_role(title: str, brief: str, organization: str = "", runner=ask_claude) -> Role:
    require(isinstance(title, str) and 0 < len(title.strip()) <= 200, "Add a role title")
    require(
        isinstance(brief, str) and 20 <= len(brief.strip()) <= 50000,
        "Add a role brief of 20–50,000 characters",
    )
    require(
        isinstance(organization, str) and len(organization) <= 200,
        "Invalid organization",
    )
    dimension = obj(
        {
            "key": STRING,
            "label": STRING,
            "weight": {"type": "integer", "minimum": 1, "maximum": 100},
            "levels": STRINGS,
        }
    )
    schema = obj({"dimensions": array(dimension), "sampling_terms": STRINGS, "guidance": STRING})
    answer = runner(
        prompt_text("role")
        + json.dumps({"title": title, "brief": brief, "organization": organization}),
        schema,
    )
    check_schema(answer, schema)
    rubric = f"# {title}\n\n## Role brief\n{brief}\n\n## Scoring guidance\n{answer['guidance']}\n"
    for dimension in answer["dimensions"]:
        require(
            len(dimension["levels"]) == 6 and all(x.strip() for x in dimension["levels"]),
            "Each dimension needs explicit levels 0 through 5",
        )
        rubric += f"\n## {dimension['label']}\n"
        rubric += (
            "\n".join(f"- {level}: {text}" for level, text in enumerate(dimension["levels"])) + "\n"
        )
    return validate_role(
        {
            "title": title,
            "brief": brief,
            "organization": organization,
            "rubric": rubric,
            "dimensions": [
                {k: d[k] for k in ("key", "label", "weight")} for d in answer["dimensions"]
            ],
            "sampling_terms": answer["sampling_terms"],
        }
    )
