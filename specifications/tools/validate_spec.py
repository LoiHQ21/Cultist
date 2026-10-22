#!/usr/bin/env python3
"""Validate the authored specification, not a browser implementation.

No third-party dependencies. Run from any working directory:
    python3 tools/validate_spec.py

Deterministic legal-route sampling is used for reachability witnesses only.
It is not exhaustive, and the sample is not a measure of human difficulty.
"""

from __future__ import annotations

import copy
import json
import random
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = json.loads((ROOT / "02-CONTENT.json").read_text())
R = DATA["rules"]
ITEMS = DATA["items"]
ASPECTS = DATA["aspects"]
VOTIVES = DATA["votives"]
PETITIONS = DATA["petitions"]
BY_DAY = {day: [p for p in PETITIONS if p["day"] == day] for day in range(1, 6)}


def clamp(value):
    return max(R["stat_min"], min(R["stat_max"], value))


def aspect(mercy, dominion, previous):
    if max(mercy, dominion) < R["learning_threshold"]:
        return "listening"
    if mercy > dominion:
        return "merciful"
    if dominion > mercy:
        return "possessive"
    return previous


def starting(opening="listening"):
    learning = R["openings"][opening]
    return {
        "defence": R["starting_defence"],
        "trust": R["starting_trust"],
        "mercy": learning["mercy"],
        "dominion": learning["dominion"],
        "aspect": "listening",
        "awakening": 0,
        "inventory": list(R["starting_inventory"]),
    }


def delta(base, catalyst, used_aspect):
    result = {key: base[key] for key in ("defence", "trust")}
    if catalyst == "mirror":
        for key in result:
            result[key] += base[key]
    elif catalyst:
        for key in result:
            result[key] += ITEMS[catalyst][key]
    for key in result:
        result[key] += ASPECTS[used_aspect][key]
    if catalyst == "loose_shadow":
        result["trust"] = max(0, result["trust"])
    return result


def ritual(state, petition, votive, catalyst):
    new = copy.deepcopy(state)
    used_aspect = state["aspect"]
    outcome = petition["outcomes"][votive]
    if catalyst:
        if catalyst not in new["inventory"]:
            raise ValueError(f"Unavailable catalyst: {catalyst}")
        new["inventory"].remove(catalyst)
    change = delta(outcome, catalyst, used_aspect)
    for key in ("defence", "trust"):
        new[key] = clamp(state[key] + change[key])
    new["trust"] = clamp(new["trust"] - R["ignored_trust_cost"])
    for axis in ("mercy", "dominion"):
        learned = VOTIVES[votive]["lesson"][axis]
        if catalyst == "mirror":
            learned *= 2
        elif catalyst:
            learned += ITEMS[catalyst]["lesson"][axis]
        new[axis] += learned
    new["aspect"] = aspect(new["mercy"], new["dominion"], used_aspect)
    new["inventory"].append(outcome["reward"])
    new["awakening"] += 1
    return new


def raw_change(state, choice):
    new = copy.deepcopy(state)
    for key in ("defence", "trust"):
        new[key] = clamp(new[key] + choice[key])
    return new


def response(state, choice, catalyst):
    new = copy.deepcopy(state)
    if catalyst:
        new["inventory"].remove(catalyst)
    changes = delta(choice, catalyst, state["aspect"])
    return raw_change(new, changes)


def classify(state, fate):
    if state["trust"] == 0:
        return "abandoned"
    if state["defence"] < R["defence_to_survive"]:
        return "overrun"
    if state["trust"] < R["trust_for_intact_community"]:
        return "fractured"
    return {"sleep": "quiet", "remain": "guarded", "wander": "free"}[fate]


def validate_content():
    assert len(PETITIONS) == 10
    assert len({p["id"] for p in PETITIONS}) == 10
    assert len(DATA["visitors"]) == 6
    assert len(VOTIVES) == 3 and len(ITEMS) == 7
    assert sum(i["kind"] == "remnant" for i in ITEMS.values()) == 4
    assert set(DATA["endings"]) == {
        "abandoned", "overrun", "fractured", "quiet", "guarded", "free"
    }
    assert all(len(BY_DAY[day]) == 2 for day in range(1, 6))
    cases = 0
    for p in PETITIONS:
        assert p["visitor"] in DATA["visitors"]
        assert p["gift"] in R["replay_gift_pool"]
        assert set(p["outcomes"]) == set(VOTIVES)
        for v, outcome in p["outcomes"].items():
            assert ITEMS[outcome["reward"]]["kind"] == "remnant"
            assert outcome["scene"] in {"guardian", "grain", "shadow", "names"}
            assert set(outcome["interpretations"]) == set(ASPECTS)
            for key in ("title", "omen", "event", "echo"):
                assert isinstance(outcome[key], str) and outcome[key]
            for a in ASPECTS:
                assert outcome["interpretations"][a]
                for c in [None, *ITEMS]:
                    state = starting()
                    state["aspect"] = a
                    state["inventory"] = list(ITEMS)
                    original = copy.deepcopy(state)
                    out = ritual(state, p, v, c)
                    assert state == original, "Calculation mutated its input"
                    assert out == ritual(state, p, v, c), "Non-deterministic result"
                    assert 0 <= out["trust"] <= 8 and 0 <= out["defence"] <= 8
                    assert out["awakening"] == 1
                    assert len(out["inventory"]) == len(state["inventory"]) + (0 if c else 1)
                    cases += 1
    assert cases == 720
    return cases


def validate_edges():
    granary = PETITIONS[0]
    s = starting()
    s["inventory"].append("ring")  # Accepting Mara's authored gift.
    out = ritual(s, granary, "chain", "bell")
    assert (out["defence"], out["trust"], out["mercy"], out["dominion"]) == (3, 3, 0, 2)
    assert out["aspect"] == "possessive" and out["inventory"][-1] == "guardian_tear"
    # New aspect must not change the result that taught it.
    assert out["defence"] == 3

    s = starting()
    s["trust"] = 8
    out = ritual(s, granary, "seed", "ring")
    assert out["trust"] == 7

    s = starting()
    s["defence"] = 0
    s["mercy"] = 3
    s["aspect"] = "merciful"
    out = ritual(s, granary, "seed", None)
    assert out["defence"] == 0

    wall = next(p for p in PETITIONS if p["id"] == "wall")
    s = starting()
    s["inventory"] = ["mirror"]
    out = ritual(s, wall, "knife", "mirror")
    assert out["defence"] == 7 and out["trust"] == 0 and out["dominion"] == 2

    s = starting()
    s["dominion"] = 3
    s["aspect"] = "possessive"
    s["inventory"] = ["loose_shadow"]
    out = ritual(s, wall, "knife", "loose_shadow")
    assert out["trust"] == 3  # Still loses the unanswered-prayer point.

    assert aspect(1, 1, "listening") == "listening"
    assert aspect(2, 2, "listening") == "listening"
    assert aspect(4, 4, "merciful") == "merciful"
    assert aspect(4, 4, "possessive") == "possessive"
    assert aspect(5, 4, "possessive") == "merciful"

    s = starting()
    s["inventory"] = ["mirror"]
    s["awakening"] = 5
    out = response(s, DATA["finale"]["response"][0], "mirror")
    assert (out["defence"], out["trust"]) == (5, 2)
    assert (out["mercy"], out["dominion"], out["awakening"]) == (0, 0, 5)
    assert out["inventory"] == []

    assert classify({"trust": 0, "defence": 1}, "sleep") == "abandoned"
    assert classify({"trust": 6, "defence": 5}, "remain") == "overrun"
    assert classify({"trust": 3, "defence": 6}, "sleep") == "fractured"
    assert classify({"trust": 4, "defence": 6}, "sleep") == "quiet"
    assert classify({"trust": 4, "defence": 6}, "remain") == "guarded"
    assert classify({"trust": 4, "defence": 6}, "wander") == "free"


def witness_routes():
    """Sample legal first-run routes; enumerate every finale for each sampled route."""
    rng = random.Random(104729)
    found = {}
    strategies = set()
    attempts = 0
    for attempt in range(1200):
        attempts = attempt + 1
        state = starting()
        path = []
        for day in range(1, 6):
            p = rng.choice(BY_DAY[day])
            state["inventory"].append(p["gift"])
            v = rng.choice(list(VOTIVES))
            c = rng.choice([None, *sorted(set(state["inventory"]))])
            state = ritual(state, p, v, c)
            discarded = []
            while len(state["inventory"]) > R["inventory_capacity"]:
                index = rng.randrange(len(state["inventory"]))
                discarded.append(state["inventory"].pop(index))
            path.append({
                "day": day,
                "petition": p["id"],
                "votive": v,
                "catalyst": c,
                "discarded": discarded,
                "after": {k: state[k] for k in ("defence", "trust", "mercy", "dominion", "aspect")},
            })
        assert state["awakening"] == 5
        for first in DATA["finale"]["response"]:
            for c in [None, *sorted(set(state["inventory"]))]:
                one = response(state, first, c)
                for second in DATA["finale"]["interpretations"][state["aspect"]]["choices"]:
                    two = raw_change(one, second)
                    for third in DATA["finale"]["fates"]:
                        three = raw_change(two, third)
                        ending = classify(three, third["id"])
                        if ending in {"quiet", "guarded", "free"}:
                            strategies.add(tuple(step["votive"] for step in path))
                        if ending not in found:
                            found[ending] = {
                                "seed": "FIRST-EMBER",
                                "opening": "listening",
                                "guided": True,
                                "days": copy.deepcopy(path),
                                "finale": {
                                    "response": first["id"],
                                    "catalyst": c,
                                    "interpretation": second["id"],
                                    "fate": third["id"],
                                },
                                "final": {k: three[k] for k in ("defence", "trust", "mercy", "dominion", "aspect")},
                                "ending": ending,
                            }
        if len(found) == 6 and len(strategies) >= 3:
            break
    assert len(found) == 6, f"Missing endings: {set(DATA['endings']) - set(found)}"
    assert len(strategies) >= 3
    return found, attempts, len(strategies)


def check_witnesses(found):
    """Replay every saved witness independently, including explicit discards."""
    for ending, route in found.items():
        state = starting(route["opening"])
        for step in route["days"]:
            p = next(p for p in PETITIONS if p["id"] == step["petition"])
            assert p["day"] == step["day"]
            state["inventory"].append(p["gift"])
            state = ritual(state, p, step["votive"], step["catalyst"])
            for discarded in step["discarded"]:
                state["inventory"].remove(discarded)
            assert len(state["inventory"]) <= R["inventory_capacity"]
            assert all(state[k] == value for k, value in step["after"].items())
        f = route["finale"]
        first = next(c for c in DATA["finale"]["response"] if c["id"] == f["response"])
        state = response(state, first, f["catalyst"])
        second = next(c for c in DATA["finale"]["interpretations"][state["aspect"]]["choices"] if c["id"] == f["interpretation"])
        state = raw_change(state, second)
        third = next(c for c in DATA["finale"]["fates"] if c["id"] == f["fate"])
        state = raw_change(state, third)
        assert classify(state, f["fate"]) == ending
        assert all(state[k] == value for k, value in route["final"].items())


def named_success_routes():
    """Two deliberately different successful routes, with all inventory decisions."""
    definitions = {
        "balanced_guardians": {
            "rituals": [
                ("granary", "chain", "ring"),
                ("silent_bell", "chain", "guardian_tear"),
                ("wall", "chain", "guardian_tear"),
                ("refugees", "chain", "guardian_tear"),
                ("tomorrow", "chain", "guardian_tear"),
            ],
            "finale": {"response": "stand", "catalyst": "forgotten_name", "interpretation": "freedom", "fate": "sleep"},
            "expected_aspect": "listening",
        },
        "merciful_boundaries": {
            "rituals": [
                ("granary", "seed", "bell"),
                ("orchard", "seed", "mirror"),
                ("wall", "chain", "ring"),
                ("bridge", "chain", "guardian_tear"),
                ("watch", "chain", "guardian_tear"),
            ],
            "finale": {"response": "stand", "catalyst": "bell", "interpretation": "boundary", "fate": "sleep"},
            "expected_aspect": "merciful",
        },
    }
    result = {}
    for name, definition in definitions.items():
        state = starting()
        steps = []
        for day, (pid, v, c) in enumerate(definition["rituals"], 1):
            p = next(p for p in PETITIONS if p["id"] == pid)
            assert p["day"] == day
            state["inventory"].append(p["gift"])
            state = ritual(state, p, v, c)
            discarded = []
            while len(state["inventory"]) > R["inventory_capacity"]:
                discarded.append(state["inventory"].pop(0))
            steps.append({
                "day": day, "petition": pid, "votive": v, "catalyst": c,
                "discarded": discarded,
                "after": {k: state[k] for k in ("defence", "trust", "mercy", "dominion", "aspect")},
            })
        assert state["aspect"] == definition["expected_aspect"]
        f = definition["finale"]
        first = next(c for c in DATA["finale"]["response"] if c["id"] == f["response"])
        state = response(state, first, f["catalyst"])
        second = next(c for c in DATA["finale"]["interpretations"][state["aspect"]]["choices"] if c["id"] == f["interpretation"])
        state = raw_change(state, second)
        third = next(c for c in DATA["finale"]["fates"] if c["id"] == f["fate"])
        state = raw_change(state, third)
        assert classify(state, f["fate"]) == "quiet"
        route = {
            "seed": "FIRST-EMBER", "opening": "listening", "guided": True,
            "days": steps, "finale": f,
            "final": {k: state[k] for k in ("defence", "trust", "mercy", "dominion", "aspect")},
            "ending": "quiet",
        }
        check_witnesses({"quiet": route})
        result[name] = route
    return result


def main():
    cases = validate_content()
    validate_edges()
    found, attempts, strategies = witness_routes()
    check_witnesses(found)
    named = named_success_routes()
    report = {
        "scope": "Specification/reference-model validation only; no browser implementation exists in this package.",
        "content_version": DATA["content_version"],
        "recipe_aspect_catalyst_cases": cases,
        "sampled_legal_five_day_routes": attempts,
        "distinct_successful_votive_sequences_seen": strategies,
        "endings_reached": sorted(found),
        "witnesses": found,
        "named_success_routes": named,
    }
    output = ROOT / "reference" / "validation-witnesses.json"
    output.write_text(json.dumps(report, indent=2) + "\n")
    print(f"PASS: {cases} recipe/aspect/catalyst cases and edge checks.")
    print(f"PASS: all 6 endings reached within {attempts} sampled legal five-day routes.")
    print(f"PASS: {strategies} distinct successful votive sequences observed.")
    print(f"PASS: every saved witness replayed with legal inventory and matching results.")
    print("PASS: additional Listening and Merciful routes reach A Quiet Dawn.")
    print(f"Evidence: {output}")
    for ending in sorted(found):
        final = found[ending]["final"]
        print(f"  {ending}: Defence {final['defence']}, Trust {final['trust']}, {final['aspect']}")


if __name__ == "__main__":
    main()
