"""Lead-owned source helper. It writes literal authored modules, not runtime state."""
import json
from pathlib import Path

HERE = Path(__file__).resolve().parent

def paragraphs(text):
    return text.strip().split("\n\n")

def choice(id, label, target, **extra):
    return dict(id=id, label=label, target=target, **extra)

class Module:
    def __init__(self, name):
        self.name = name
        self.scenes = []
        self.staging = []
        self.sources = []
        self.characters = []
        self.questions = []
        self.interpretationRules = []
        self.hints = []
        self.beliefIds = []
    def scene(self, id, title, text, choices, actors, location, props=(), **extra):
        self.scenes.append(dict(id=id, title=title, paragraphs=paragraphs(text), choices=choices, **extra))
        self.staging.append(dict(sceneId=id, location=location, actors=list(actors), props=list(props)))
    def source(self, id, title, text, kind="observation", provenance=None, **extra):
        self.sources.append(dict(id=id,title=title,text=text,kind=kind,provenanceId=provenance or id,**extra))
    def write(self, **notes):
        keys=("scenes","staging","sources","characters","questions","interpretationRules","hints","beliefIds")
        data={key:getattr(self,key) for key in keys}
        data["notes"]=dict(status="completed first-pass literary module",**notes)
        (HERE/(self.name+".json")).write_text(json.dumps(data,ensure_ascii=False,indent=2)+"\n")
