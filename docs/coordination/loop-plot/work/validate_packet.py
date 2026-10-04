#!/usr/bin/env python3
"""Validate this proposal packet's integrity and finite outline, not the game."""
import hashlib
import json
from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[4]
WORK = Path(__file__).resolve().parent
TEAM = "docs/coordination/loop-plot/"


def git(*args):
    return subprocess.check_output(["git", *args], cwd=ROOT)


manifest = json.loads((WORK / "input-provenance.json").read_text())
base = manifest["inputCommit"]
current_inputs = {}
for item in manifest["inputs"]:
    raw = git("show", f"{base}:{item['path']}")
    assert hashlib.sha256(raw).hexdigest() == item["sha256"], item["path"]
    current_inputs[item["path"]] = item["sha256"]
for item in manifest.get("followupInputs", []):
    raw = git("show", f"{item['inputCommit']}:{item['path']}")
    assert hashlib.sha256(raw).hexdigest() == item["sha256"], item["path"]
    current_inputs[item["path"]] = item["sha256"]
for path, expected in current_inputs.items():
    assert hashlib.sha256((ROOT / path).read_bytes()).hexdigest() == expected, path

integration_base = manifest.get("integrationBase", base)
paths = set(git("diff", "--name-only", integration_base).decode().splitlines())
paths.update(git("ls-files", "--others", "--exclude-standard").decode().splitlines())
for path in paths:
    assert path in {TEAM + "STATUS.json", TEAM + "RESPONSE.md"} or path.startswith(TEAM + "work/"), path
git("diff", "--check", integration_base)

parsed = []
for path in sorted((ROOT / TEAM).rglob("*.json")):
    if path.name == "validation.json":
        continue
    json.loads(path.read_text())
    parsed.append(str(path.relative_to(ROOT)))

graph = json.loads((WORK / "route-graph.json").read_text())
nodes = {node["id"]: node for node in graph["nodes"]}
assert len(nodes) == len(graph["nodes"])
edges = {node: [] for node in nodes}
for edge in graph["edges"]:
    assert edge["from"] in nodes and edge["to"] in nodes
    assert edge["to"] not in edges[edge["from"]]
    edges[edge["from"]].append(edge["to"])
traces = []


def visit(node, previous):
    assert node not in previous, "Unbounded cycle in finite review outline"
    route = previous + [node]
    if nodes[node]["terminal"]:
        assert not edges[node], "Terminal has outgoing action"
        traces.append(route)
        return
    assert edges[node], f"Nonterminal dead end: {node}"
    for target in edges[node]:
        visit(target, route)


visit(graph["start"], [])
assert set(nodes) == {node for trace in traces for node in trace}
for trace in traces:
    assert trace.count("first_return") == 1
    terminal = trace[-1]
    if terminal == "ending_repeat":
        for needed in ["risk", "roles", "departure", "camera", "second_return"]:
            assert needed in trace
        assert [nodes[n]["occasion"] for n in trace].count("o2") == 2
    else:
        assert all(nodes[n]["occasion"] != "o2" for n in trace)
    if terminal == "cancel":
        assert "departure" in trace and "camera" in trace
    if terminal in {"postpone", "direct_refusal"}:
        assert "camera" not in trace
    assert ("watch_box" in trace) != ("retrieve_front" in trace)

scenes = (WORK / "PERFORMED-REVISIONS.md").read_text()
assert "\u2014" not in scenes, "Em dash in original scene proposal"
assert "She puts the coat on." in scenes
assert "You had asked him to leave the first word visible" in scenes
assert "B-E03's “unmarked one in your right”" in scenes

counts = {node: sum(t[-1] == node for t in traces)
          for node, item in nodes.items() if item["terminal"]}
report = {
    "status": "PASS",
    "scope": "Static proposal integrity and abstract route graph only",
    "inputCommit": base,
    "integrationBase": integration_base,
    "checkedInputHashes": len(manifest["inputs"]),
    "checkedFollowupHashes": len(manifest.get("followupInputs", [])),
    "ownedChangedOrUntrackedPaths": sorted(paths),
    "parsedJsonFiles": parsed,
    "graph": {"nodes": len(nodes), "edges": len(graph["edges"]),
              "terminalTraces": len(traces), "tracesPerEnding": counts},
    "sceneSha256": hashlib.sha256(scenes.encode()).hexdigest(),
    "checks": ["input hashes and Git blobs", "ownership", "git diff --check",
               "JSON parse", "unique reachable finite graph with terminal routes",
               "refusal/postponement/cancel do not enter o2",
               "repeat follows departure and recording setup",
               "material alternatives remain distinct", "no original narrative em dashes",
               "three child-review repair markers present"],
    "notRun": ["Runtime occasion tests", "browser tests", "human reading",
               "full-game route exploration", "physical experiment"],
    "limits": "Graph abstracts source microchoices. Marker checks are not semantic proof; parent manually checked dependent prose. No literary quality, canon acceptance or game-completion claim."
}
(WORK / "validation.json").write_text(json.dumps(report, indent=2) + "\n")
print(json.dumps({k: report[k] for k in ["status", "scope", "checkedInputHashes", "graph"]}, indent=2))
