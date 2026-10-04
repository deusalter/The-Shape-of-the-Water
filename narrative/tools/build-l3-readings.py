"""Build bounded ending readings, never runtime content or a playtime estimate."""
from pathlib import Path
import hashlib
import json
import re

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / "narrative/loop/ENDING-L3-AUDITIONS.md"
text = SOURCE.read_text()


def part(start: str, stop: str, source: str = text) -> str:
    begin = source.index(start) + len(start)
    end = source.index(stop, begin)
    return source[begin:end].strip()


def branch(start: str, stop: str) -> str:
    return "\n".join(line[2:] if line.startswith("  ") else line
                     for line in part(start, stop).splitlines()).strip()


common = [
    part("### B-E01. Before anybody goes\n", "### Choice B-E01-A"),
    branch("- **“Say another man with your memories would frighten you even if he had as much evidence as you.”**\n",
           "- **“Ask whether everyone is making an ordinary certainty impossible"),
    part("### Common passage\n\n“I tried to work out", "### Choice B-E01-B"),
    branch("- **“Ask her to stop describing the day for now. You want to hear a voice without testing it.”**\n",
           "- **“Ask whether she thinks the Ada she remembers ceased to exist.”**"),
    part("### Common passage\n\nMiriam by the door asks", "### B-E02. The last proposed test"),
    part("### B-E02. The last proposed test\n", "### Choice B-E02-A"),
    part("### B-E02-B. An answer you have not heard\n", "Return to B-E02-A's two action choices."),
]
# The two distinctive common-section anchors above include the first words.
common[2] = "“I tried to work out " + common[2]
common[4] = "Miriam by the door asks " + common[4]

refusal = part("### B-E03. Refusal: the front entrance\n", "### B-E04. One more occasion")
opening = refusal.split("#### If Blaise refused before the second-test setup")[0].strip()
base_reunion = part("#### If Blaise refused before the second-test setup\n",
                    "#### If Blaise canceled after the exterior departure", refusal)
canceled_reunion = part("#### If Blaise canceled after the exterior departure\n", "#### Common", refusal)
shoe_passage = part("#### Common\n", "#### If Blaise previously asked for the present touch", refusal)
decline_arm = part("#### Otherwise\n", "#### Common", refusal)
final_refusal = part("#### Common\n\nThe two women come through", "Ending observation:", refusal)
final_refusal = "The two women come through " + final_refusal
refusal_rest = [shoe_passage, decline_arm, final_refusal]

test_setup = part("### B-E04. One more occasion\n", "#### Choice B-E04-A")
repeat_begin = part("### B-E05. The sentence does not finish first\n", "#### If the offer was actually encountered at B-E02-B")
repeat_offer = part("#### If the offer was actually encountered at B-E02-B\n", "#### Otherwise")
repeat_end = part("#### Common\n\nSimon repeats his question.", "Ending observation:")
repeat_end = "Simon repeats his question. " + repeat_end

cancel_first = ("You tell Simon you have changed your mind. He turns the camera off and asks whether the recording "
                "so far should be kept. You say yes. Nobody asks you to state a better reason.")
assert cancel_first in text
closing_door = opening.split("\n\n", 1)[1]

readings = {
    "refusal": common + [opening, base_reunion] + refusal_rest,
    "canceled-test": common + [test_setup, cancel_first, closing_door, canceled_reunion] + refusal_rest,
    "second-crossing": common + [test_setup, repeat_begin, repeat_offer, repeat_end],
}

output = ROOT / "narrative/loop/readings"
output.mkdir(parents=True, exist_ok=True)
manifest = {
    "scope": "Ending fragments with one explicit selection per branch; not whole-game routes or engine tests.",
    "source": str(SOURCE.relative_to(ROOT)),
    "sourceSha256": hashlib.sha256(SOURCE.read_bytes()).hexdigest(),
    "choicesCommonToTheseReadings": ["B-E01-A: another man with my memories", "B-E01-B: hear a voice without testing",
                                     "B-E02-B: hear Ada's answer before deciding", "earlier B-R03: no requested hand-touch"],
    "wordDefinition": "Unicode word groups with internal apostrophe or hyphen; passage text only, excluding reading headings and editorial context.",
    "readings": [],
}
for name, pieces in readings.items():
    passage = "\n\n".join(pieces).strip()
    assert "###" not in passage and "Ending observation:" not in passage
    words = len(re.findall(r"\b\w+(?:[’'\-]\w+)*\b", passage))
    path = output / f"ENDING-{name.upper()}.md"
    path.write_text(f"# L3 ending reading: {name}\n\n"
                    "Bounded author reading, not a complete player route. Required preceding encounters are recorded in "
                    "ENDING-L3-AUDITIONS.md. The prose below selects one branch at each decision and contains no unseen sibling variants.\n\n"
                    + passage + "\n")
    manifest["readings"].append({"path": str(path.relative_to(ROOT)), "passageWords": words,
                                  "sha256": hashlib.sha256(path.read_bytes()).hexdigest()})
(output / "MANIFEST.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n")
print(json.dumps(manifest, ensure_ascii=False, indent=2))
