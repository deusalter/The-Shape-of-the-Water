"""Extract exact selected voice passages from the current literary modules."""
from pathlib import Path
import hashlib
import json

here = Path(__file__).resolve().parent
manifest = json.loads((here / "manifest.json").read_text())
scenes = {}
origins = {}
for name in manifest["modules"]:
    module = json.loads((here / name).read_text())
    for scene in module["scenes"]:
        scenes[scene["id"]] = scene
        origins[scene["id"]] = name

selections = [
    ("Blaise", "Erasmus, public pressure", "a0.refusal-plain", "“I can tell them", 8),
    ("Blaise", "private thought during Julian's touch", "a0.judge", "Why did discovering", 3),
    ("Blaise", "private thought while Julian considers leaving", "a0.invitation", "Was that wish worth", 5),
    ("Blaise", "Vera, an intimate admission", "a1.witness", "“I want not to know", 5),
    ("Blaise", "Vera, contested metaphysical argument", "a2.the-ground", "“I do want a spectator,”", 5),
    ("Blaise", "private thought before public action", "a2.reason", "He had written instructions", 2),
    ("Julian", "Blaise, ordinary work", "a0.horse", "“I see you checked", 3),
    ("Julian", "Blaise, concealed return exposed", "a0.weeds", "“You told me there hadn't", 6),
    ("Julian", "Blaise, loss of a shared evening", "a1.earlier-love", "“I'm sorry I don't remember", 4),
    ("Julian", "Blaise, discussing his next play", "a2.greenroom-listen", "“I thought they might move,”", 3),
    ("Julian", "Blaise, wanting him without an exclusive motive", "a2.greenroom-ask", "“I wanted to see you.", 5),
    ("Julian", "Blaise and Erasmus, final pressure", "a2.julian-earlier", "“Because I'm answering,”", 3),
    ("Vera", "Blaise, ordinary breakfast and records", "a1.vera-box", "“Have I invited you?", 3),
    ("Vera", "Blaise, evaluating her own old evidence", "a1.observations", "“I began by thinking", 3),
    ("Vera", "Blaise, choosing witness status", "a1.witness", "“I will remember if", 1),
    ("Vera", "Blaise, affection for the patron's recognition", "a2.purpose", "“And you can stop", 3),
    ("Vera", "Blaise, particular understanding and immanence", "a2.a-form-of-love", "“Suppose you understand", 3),
    ("Vera", "Blaise, ordinary attachment under eternity", "a2.a-form-of-love", "“I don't want to lose it.”", 4),
    ("Erasmus", "Blaise, irritated after public embarrassment", "a0.promise", "“Will you be angry", 3),
    ("Erasmus", "Blaise, exposed as a finite deceiver", "a1.return-patron", "“Because I thought you would go", 1),
    ("Erasmus", "Blaise and Vera, hospitality during argument", "a2.the-ground", "Erasmus put the plate", 2),
    ("Erasmus", "Blaise, private need admitted in public", "a2.erasmus-loss", "“A person who knew", 3),
    ("Erasmus", "Blaise, ordinary breakfast", "a2.new-morning", "“I can do that again.”", 4),
    ("Ensemble", "Blaise and Julian making a scene with the company", "a2.new-ending", "“Suppose he gives up", 4),
]

anchors = []
for number, (character, listener, scene_id, prefix, count) in enumerate(selections, 1):
    ps = scenes[scene_id]["paragraphs"]
    matches = [i for i, p in enumerate(ps) if p.startswith(prefix)]
    if len(matches) != 1:
        raise ValueError((scene_id, prefix, matches))
    first = matches[0]
    quote = ps[first:first + count]
    anchors.append(dict(id=f"MV{number:02}", character=character, listener=listener,
                        module=origins[scene_id], sceneId=scene_id, variantId="base",
                        firstParagraph=first + 1, paragraphs=quote))

pins = {name: hashlib.sha256((here / name).read_bytes()).hexdigest() for name in manifest["modules"]}
(here / "VOICE-ANCHORS.json").write_text(json.dumps(dict(sourcePins=pins, anchors=anchors), ensure_ascii=False, indent=2) + "\n")
lines = ["# Mercy voice anchors", "", "These 24 passages are exact extracts from the held modules, including interlocutors where a reply is part of the voice. They are preservation anchors, not a claim that a simulated reader identified every speaker blind. `VOICE-ANCHORS.json` records complete source pins and paragraph positions. Regenerate with `python narrative/mercy/preserve-voice.py` only after a lead-approved text change.", "",
         "Blaise's thought should be capable of a real argument and an interested evasion within the same paragraph. His inward precision does not require every spoken answer to be eloquent. Julian is quickest around work and jokes, but can become hesitant when asked to turn affection into a verdict. Vera distinguishes observation from inference while enjoying being right; her ordinary appetite for acknowledgment remains audible. Erasmus often makes an objection seem discourteous before he answers it. His final plain admission should cost him more than a grand speech.", "",
         "The shared scene changes listeners and stakes. Precision overlaps where the argument demands it; ordinary exchanges, interrupted admissions and working comedy prevent that overlap from becoming one universal voice.", ""]
for a in anchors:
    lines += [f"## {a['id']}: {a['character']}", "", f"{a['listener']}. Scene `{a['sceneId']}`, paragraph {a['firstParagraph']}.", ""]
    for p in a["paragraphs"]:
        lines += ["> " + p, ""]
(here / "VOICE.md").write_text("\n".join(lines))
print(f"Preserved {len(anchors)} exact extracts.")
