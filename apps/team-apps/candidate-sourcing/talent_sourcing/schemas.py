"""Strict contracts for model responses; validated before any result is published."""

from .storage import require

FLAGS = ("immediate_fit", "connector", "deep_dive")


def obj(properties):
    return {
        "type": "object",
        "properties": properties,
        "required": list(properties),
        "additionalProperties": False,
    }


def array(items):
    return {"type": "array", "items": items}


STRING = {"type": "string"}
STRINGS = array(STRING)


def proposal_schema(dimensions):
    return obj(
        {
            "summary": STRING,
            "changes": array(
                obj(
                    {
                        "dimension": {
                            "type": "string",
                            "enum": ["general", *dimensions],
                        },
                        "rule": STRING,
                        "reason": STRING,
                        "person_keys": STRINGS,
                    }
                )
            ),
            "corrections": array(
                obj(
                    {
                        "person_key": STRING,
                        "expected": {"type": "string", "enum": ["up", "down", "check"]},
                        "reason": STRING,
                    }
                )
            ),
            "questions": STRINGS,
        }
    )


def score_schema(dimensions):
    dimension = obj(
        {
            "score": {"type": "integer", "minimum": 0, "maximum": 5},
            "basis": {"type": "string", "enum": ["evidence", "no_data", "negative"]},
            "evidence": STRING,
            "source_fields": STRINGS,
        }
    )
    return obj(
        {
            "candidates": array(
                obj(
                    {
                        "person_key": STRING,
                        "dimensions": obj({d: dimension for d in dimensions}),
                        "summary": STRING,
                        "flags": obj(
                            {f: obj({"value": {"type": "boolean"}, "note": STRING}) for f in FLAGS}
                        ),
                        "questions": STRINGS,
                    }
                )
            )
        }
    )


def check_schema(value, schema):
    """Validate our small JSON-schema subset even if a provider ignores its schema."""
    kind = schema["type"]
    require(
        {
            "object": type(value) is dict,
            "array": type(value) is list,
            "string": type(value) is str,
            "integer": type(value) is int,
            "boolean": type(value) is bool,
        }[kind],
        "AI returned an invalid " + kind,
    )
    if kind == "object":
        require(
            set(value) == set(schema["properties"]),
            "AI returned unexpected or missing fields",
        )
        for k, v in value.items():
            check_schema(v, schema["properties"][k])
    if kind == "array":
        require(
            schema.get("minItems", 0) <= len(value) <= schema.get("maxItems", len(value)),
            "AI returned the wrong number of list items",
        )
        for v in value:
            check_schema(v, schema["items"])
    if "enum" in schema:
        require(value in schema["enum"], "AI returned an unsupported value")
    if kind == "integer":
        require(
            schema["minimum"] <= value <= schema["maximum"],
            "AI integer outside the permitted range",
        )
