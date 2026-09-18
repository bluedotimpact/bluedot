"""Build minimal model inputs without sending contact details."""


def reviewed(flags):
    return {
        k: r
        for k, r in flags.items()
        if r.get("star") or r.get("triage") or r.get("notes", "").strip()
    }


def model_person(person, review=None):
    # Exclude contact details; all job evidence and preserved web findings remain.
    source = {
        k: v
        for k, v in person["source"].items()
        if k not in {"email", "phone", "person_key"} | set(person.get("private_source_fields", []))
    }
    return {
        "person_key": person["person_key"],
        "name": person["name"],
        "source": source,
        "assessment": person["assessment"],
        "manager_feedback": review or {},
    }
