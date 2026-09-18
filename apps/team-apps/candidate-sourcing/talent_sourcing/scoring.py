"""Score comparisons are role-independent; weights belong to each search."""

from .schemas import FLAGS


def make_movement(previous, current, corrections):
    old = {p["person_key"]: p for p in previous["people"] if p["assessment"]}
    rows = []
    for p in current["people"]:
        if not p["assessment"] or p["person_key"] not in old:
            continue
        b = old[p["person_key"]]
        changes = [
            {"dimension": d, "before": b["assessment"]["dimensions"][d], "after": v}
            for d, v in p["assessment"]["dimensions"].items()
            if v != b["assessment"]["dimensions"][d]
        ]
        if (
            changes
            or b["assessment"]["flags"] != p["assessment"]["flags"]
            or b["overall"] != p["overall"]
        ):
            rows.append(
                {
                    "person_key": p["person_key"],
                    "name": p["name"],
                    "rank_before": b["rank"],
                    "rank_after": p["rank"],
                    "score_before": b["overall"],
                    "score_after": p["overall"],
                    "score_change": round(p["overall"] - b["overall"], 3),
                    "dimensions": changes,
                    "flags_before": b["assessment"]["flags"],
                    "flags_after": p["assessment"]["flags"],
                }
            )

    def counts(people):
        return {
            f: sum(bool(p["assessment"]["flags"][f]["value"]) for p in people if p["assessment"])
            for f in FLAGS
        }

    top = [p["overall"] for p in current["people"] if p["assessment"]][:20]
    by_key = {p["person_key"]: p for p in current["people"]}
    checks = []
    for correction in corrections:
        key = correction["person_key"]
        p = by_key[key]
        b = old.get(key)
        change = p["overall"] - b["overall"] if b and p["assessment"] else None
        direction = (
            "up" if change and change > 0 else "down" if change and change < 0 else "unchanged"
        )
        checks.append(
            {
                "name": p["name"],
                "person_key": key,
                "expected": correction["expected"],
                "observed": f"{direction}: {b['overall']} → {p['overall']}"
                if b
                else "Not in the assessed sample",
                "matched": correction["expected"] != "check"
                and direction == correction["expected"],
                "reason": correction["reason"],
            }
        )
    return {
        "baseline": previous["revision"],
        "changed": rows,
        "risers": sorted(
            [r for r in rows if r["score_change"] > 0], key=lambda r: -r["score_change"]
        )[:10],
        "fallers": sorted(
            [r for r in rows if r["score_change"] < 0], key=lambda r: r["score_change"]
        )[:10],
        "flags_before": counts(previous["people"]),
        "flags_after": counts(current["people"]),
        "top20_spread": {
            "min": min(top) if top else None,
            "max": max(top) if top else None,
            "distinct": len(set(top)),
        },
        "named_corrections": checks,
    }
