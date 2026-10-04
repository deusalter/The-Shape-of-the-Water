"""Pin the lead's stable modules against completed compiler captures."""
from pathlib import Path
import hashlib
import json
import re
import shutil

here = Path(__file__).resolve().parent
repo = here.parents[1]
evidence = repo / "docs/execution/evidence/mercy-content"
build = json.loads((evidence / "build.json").read_text())
manifest = json.loads((here / "manifest.json").read_text())

def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

def count(text):
    return len(re.findall(r"\b[\w’']+\b", text))

for name in ["manifest.json", *manifest["modules"]]:
    expected = build["sourceHashes"]["narrative/mercy/" + name]
    if sha(here / name) != expected:
        raise ValueError(f"Compiler source pin differs: {name}")

routes = []
for file in sorted(evidence.glob("*.encountered-run.json")):
    run = json.loads(file.read_text())
    if run["content"]["hash"] != build["contentHash"]:
        raise ValueError(f"Capture not refreshed: {file.name}")
    passages = [t for t in run["seen"]["transcript"] if t["kind"] == "passage"]
    routes.append(dict(file=str(file.relative_to(repo)), sha256=sha(file),
                       passages=len(passages), words=sum(count(p) for s in passages for p in s["paragraphs"])))
if len(routes) < 4:
    raise ValueError("Expected four completed route captures")

module_counts = []
for name in manifest["modules"]:
    data = json.loads((here / name).read_text())
    module_counts.append(dict(module=name, scenes=len(data["scenes"]),
                             baseWordsIncludingExclusiveScenes=sum(count(p) for s in data["scenes"] for p in s["paragraphs"])))
counts = dict(contentSha256=build["contentSha256"], contentHash=build["contentHash"],
              method="Unicode word tokens in encountered passage paragraphs only; excludes titles, action labels, notebook, research, waiting and other routes.",
              routes=routes, moduleCounts=module_counts,
              warning="Module totals include mutually exclusive scenes and both endings; they are not one playthrough. No human reading or playing duration has been measured. Prior long-form planning targets are not claimed.")
(here / "WORD-COUNTS.json").write_text(json.dumps(counts, ensure_ascii=False, indent=2) + "\n")

destination = here / "accepted" / ("full-story-v7-" + build["contentSha256"][:8])
destination.mkdir(parents=True, exist_ok=True)
names = ["manifest.json", "authoring.py", *manifest["modules"],
         *(Path(name).stem + ".source.py" for name in manifest["modules"]),
         "AUTHOR-NOTES.md", "PHILOSOPHY-MAP.md", "NAMES.md", "CURRENT-READING-ORDER.md",
         "VOICE.md", "VOICE-ANCHORS.json", "REVIEW-DISPOSITION.md", "WORD-COUNTS.json"]
pins = {}
for name in names:
    source = here / name
    target = destination / name
    if target.exists() and sha(target) != sha(source):
        raise ValueError(f"Refusing to replace accepted snapshot: {target}")
    if not target.exists():
        shutil.copy2(source, target)
    pins[name] = sha(source)

receipt = dict(status="Lead-selected complete authored arc with exact integrated source captures; not individual owner approval or a timed-length certification.",
               contentSha256=build["contentSha256"], contentHash=build["contentHash"], sourcePins=pins,
               wordCountRecord="WORD-COUNTS.json", engineBuildRecord=str((evidence / "build.json").relative_to(repo)),
               boundaries="Engineering and reader reports retain their own exact scopes. Earlier source drafts and blind packets remain unchanged. No further narrative mutation is part of this freeze.")
(destination / "FREEZE.json").write_text(json.dumps(receipt, ensure_ascii=False, indent=2) + "\n")
(here / "CURRENT-FREEZE.json").write_text(json.dumps(dict(snapshot=str(destination.relative_to(repo)), **receipt), ensure_ascii=False, indent=2) + "\n")
print(str(destination.relative_to(repo)))
print(f"Captured route words: {min(r['words'] for r in routes)}–{max(r['words'] for r in routes)}")
