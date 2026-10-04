"""Authored finite-occasion assembly. Writes ONLY the separate expanded candidate.

The live v2 bundle and its literal passages are inputs, never output targets.
Draft sections are selected explicitly; editorial headings/guards are not player prose.
This script is not a general Markdown-to-game importer.
"""
raise SystemExit('Bath foundation superseded by owner on 2026-10-04. Preserved script and exact emitted candidate are in narrative/archived/bath-candidate-2026-10-04/. Do not regenerate into the new story.')
from pathlib import Path
from copy import deepcopy
import hashlib
import json
import re

ROOT = Path(__file__).resolve().parents[2]
LIVE = ROOT / 'src/content/case-v2.json'
LIVE_HASH = '8b87c77df304f5bcccaa5f7ae6407997eaa9b0f1a40dca54b7bfde08e1b95751'
assert hashlib.sha256(LIVE.read_bytes()).hexdigest() == LIVE_HASH
old = json.loads(LIVE.read_text())

def read(name): return (ROOT / 'narrative' / name).read_text()
def locate(t, marker, begin=0):
    if marker.startswith('#'):
        found=re.search(r'(?m)^'+re.escape(marker),t[begin:])
        if not found:raise ValueError('Missing heading '+marker)
        return begin+found.start()
    return t.index(marker,begin)
def part(t, start, stop=None):
    begin = locate(t,start) + len(start)
    return t[begin:locate(t,stop,begin) if stop else len(t)].strip()
def section(t, start, stop=None): return part(t, start, stop)
def paras(t):
    lines = [line[2:] if line.startswith('  ') else line for line in t.strip().splitlines()]
    value = [' '.join(p.splitlines()).strip() for p in '\n'.join(lines).split('\n\n') if p.strip()]
    assert all(not p.startswith(('#', '- **', 'Entry:', 'Exit:', 'Editorial')) for p in value), value
    assert all('—' not in p for p in value)
    return value
def chosen(t, label):
    begin = t.index('- **“' + label + '”**')
    body = t[begin:]
    body = body[body.index('\n\n') + 2:]
    if '\n- **' in body: body = body[:body.index('\n- **')]
    return body.strip()
def flag(id, scope='current'): return {'op':'flag','id':id,'scope':scope}
def has(id, scope='current'): return {'op':'hasSource','id':id,'scope':scope}
def ded(id, scope='current'): return {'op':'hasDeduction','id':id,'scope':scope}
def neg(arg): return {'op':'not','arg':arg}
def both(*args): return {'op':'all','args':list(args)}
def either(*args): return {'op':'any','args':list(args)}
def ref(id, scope='current'): return {'op':'ref','refId':id,'scope':scope}
def acquire(id): return {'type':'acquireSource','sourceId':id}
def tell(actor, id): return {'type':'disclose','characterId':actor,'refId':id}
def witness(actor, id): return {'type':'witnessSource','characterId':actor,'sourceId':id}

# Transform structural identifiers, never the original passage strings.
mapped_keys = {'id','target','start','refId','sourceId','characterId','speakerId','questionId','supportedCandidateId'}
mapped_arrays = {'requires','unless','effects','sourceIds','knows','claims','relatedRefs','mentions','allowedCorroborators','contradictedBy','paragraphIds'}
def structural(value, key=None):
    if isinstance(value, list):
        if key in mapped_arrays: return [('blaise' if x == 'blaise' else 'o0.' + x) for x in value]
        return [structural(x) for x in value]
    if isinstance(value, dict):
        result = {k: structural(v, k) for k,v in value.items()}
        if result.get('op') in ('hasSource','hasDeduction','flag','ref'): result['scope'] = 'current'
        return result
    if isinstance(value, str) and key in mapped_keys: return 'blaise' if value == 'blaise' else 'o0.' + value
    return value

c = structural(old)
c.update(id='shape-of-the-water', title=old['title'], version=3,
         occasions=[{'id':'o0','label':'First visit'}, {'id':'o1','label':'After the return'}, {'id':'o2','label':'After another crossing'}])
for key in ('scenes','sources','questions','interpretationRules','hints'):
    for entity in c[key]: entity['occasionId'] = 'o0'
for char in c['characters']:
    if char['id'] == 'blaise': char['persistent'] = True
    else: char['occasionId'] = 'o0'
for s in c['scenes']:
    for ch in s['choices']:
        if ch.get('ending'): ch.pop('ending')
for occasion in ('o1','o2'):
    for source in old['sources']:
        s=deepcopy(source);s['id']=occasion+'.'+source['id'];s['occasionId']=occasion
        if s.get('speakerId'):s['speakerId']='blaise' if s['speakerId']=='blaise' else occasion+'.'+s['speakerId']
        c['sources'].append(s)
    for char in old['characters']:
        if char['id'] == 'blaise': continue
        c['characters'].append({'id':occasion+'.'+char['id'],'name':char['name'],'occasionId':occasion,
                                'initial':{'knows':[occasion+'.'+x for x in char['initial']['knows']],
                                           'believes':list(char['initial']['believes']),
                                           'claims':[occasion+'.'+x for x in char['initial']['claims']]}})
c['characters'].append({'id':'miriam_exterior','name':'Miriam Verney','persistent':True,'requiresSnapshot':True,
                        'initial':{'knows':[],'believes':[],'claims':[]}})
for id,name in [('emmy','Emmy Vane'),('ruth','Ruth Garth')]:
    c['characters'].append({'id':'o0.'+id,'name':name,'occasionId':'o0','initial':{'knows':[],'believes':[],'claims':[]}})
scenes = {s['id']:s for s in c['scenes']}
def src(id,title,text,kind='observation',speaker=None,origin=None,parents=None):
    s={'id':id,'occasionId':id.split('.')[0],'title':title,'text':text,'kind':kind,
       'provenanceId':origin or id}
    if speaker: s['speakerId']=speaker
    if parents: s['derivedFrom']=parents
    c['sources'].append(s); return id
def add(id,title,text,sources=(),variants=()):
    p=paras(text) if isinstance(text,str) else text
    s={'id':id,'occasionId':id.split('.')[0],'title':title,'paragraphs':p,'choices':[]}
    if sources: s['sourceIds']=list(sources)
    if variants: s['variants']=list(variants)
    scenes[id]=s;c['scenes'].append(s);return s
def variant(id,when,text,sources=()):
    v={'id':id,'requires':[],'when':when,'paragraphs':paras(text) if isinstance(text,str) else text}
    if sources:v['sourceIds']=list(sources)
    return v
def edge(scene,id,label,target,when=None,effects=(),actions=(),irreversible=False,enter=None,ending=False):
    ch={'id':id,'label':label,'target':target}
    if when:ch['when']=when
    if effects:ch['effects']=list(effects)
    if actions:ch['actions']=list(actions)
    if irreversible:ch['irreversible']=True
    if enter:ch['enterOccasion']=enter
    if ending:ch['ending']=True
    scenes[scene]['choices'].append(ch);return ch
def forward(a,b,label='Continue.',actions=(),effects=()):return edge(a,a+'.continue',label,b,actions=actions,effects=effects)
def branches(scene, block, branches, after, title=None):
    for suffix,label,when,effects,actions in branches:
        target=scene+'.'+suffix
        add(target,title or scenes[scene]['title'],chosen(block,label))
        edge(scene,target+'.choose',label,target,when,effects,actions)
        forward(target,after)

# Capture the small completed acts separately from the optional confidence.
src('o0.keys-return','The shoe and keys','Blaise returned with Miriam’s shoe; she found the keys beneath its insole.')
src('o0.pressed-shoe-reply','“Just the shoe”','Miriam said, “Thank you. Just the shoe,” and declined the private conversation.','statement','o0.miriam',origin='miriam-private-refusal')
scenes['o0.miriam_private']['variants'][0].setdefault('sourceIds',[]).append('o0.pressed-shoe-reply')
scenes['o0.miriam_private']['choices'][0].setdefault('actions',[]).append(acquire('o0.keys-return'))
src('o0.thursday-agreement','The Thursday lift','Miriam offered to collect Ada after choir. Ada named quarter past nine, or twenty past for the long piece.')
scenes['o0.ada_miriam'].setdefault('sourceIds',[]).append('o0.thursday-agreement')
src('o0.supper-encounter','Supper by the bath','Blaise stayed for bread, potatoes and marrow pickle. Simon called the pickle a crime and ate some.')
for s in [scenes['o0.supper']]:
    s.setdefault('sourceIds',[]).append('o0.supper-encounter')
    for v in s.get('variants',[]): v.setdefault('sourceIds',[]).append('o0.supper-encounter')

# The first evening closes without pretending the expanded case has ended.
for end in ('supper','leave'):
    forward('o0.'+end,'o0.sunday','Return to the bath on Sunday.')
add('o0.sunday','A picture with the room taken out', '''You wake with the line still easy to picture. The room around it is harder. Each time you try, you put the broken mirror back against the rabbit and have to begin again.

By morning you have stopped trying to recover it with your eyes shut. You want to see what the camera kept when you were somewhere else. Whether or not you promised to help, that is why you go back.

Ada is outside with a bottle of milk wedged between her arm and her side. She has the outer door open. The inner key turns without moving the lock.

“Don't do anything interesting,” she tells it.

You take the milk. She lifts the handle and turns the key again. Inside, the bath smells more strongly of yesterday's water. The mirror is wrapped on the benches. Somebody has put a second sheet beneath a dark patch on the paper.

A man is waiting to remove the old coin box from the lockers. He sits on the low wall and takes a sandwich from his pocket. Ada holds up one finger.

“That means wait. People think it means ten minutes.”

Simon comes down from the gallery. He has brought a small mirror of his own. It stands in a wooden support beside the tray. The broken large piece remains covered.

“My sister has the page,” he says. “The original picture as well. A few people still want to come.”

You ask which page.

He shows you the invitation on his phone. A line crosses a field so dark that you cannot find a wall in it. You remember walls. Below the picture he has promised the same horizon, wherever the visitor stands.

“Is that what I saw?” you ask.

“It's from the recording.”

“What about all the things round it?” you ask.

He looks at the image again. “Then let's put them together.”''')
sunday=scenes['o0.sunday']
private_morning=[p.replace('You take the milk. She lifts the handle and turns the key again.',
                          'You wait for her to ask whether you have eaten. She pushes the milk toward you. You take it so quickly she almost loses her grip. She lifts the handle and turns the key again.') for p in sunday['paragraphs']]
sunday['variants']=[variant('o0.sunday.after-private',flag('o0.private_finding'),private_morning)]
forward('o0.sunday','o0.emmy-arrival','Meet the visitor at the entrance.')

A=read('expansion/CYCLE-01-PART-A.md');B=read('expansion/CYCLE-01-PART-B.md')
emmy=section(A,'## C1-S03: Emmy has brought the wrong shoes','## C1-S04: Ruth\'s print')
emmy_open=part(emmy,'### Passage','#### If she received the public correction')
emmy_pub=part(emmy,'#### If she received the public correction','#### If she saw only the cancellation')
emmy_private=part(emmy,'#### If she saw only the cancellation','### Decision C1-D03')
# This explanatory paragraph describes epistemic scope in the draft; the performed words already supply it.
emmy_pub=emmy_pub.replace('She has read the cut and the request in their stated order. She has not watched the film or heard the private explanations. ','')
add('o0.emmy-arrival','The wrong shoes',emmy_open+'\n\n'+emmy_private,
    variants=[variant('o0.emmy-arrival.public',flag('o0.public_correction'),emmy_open+'\n\n'+emmy_pub)])
emmy_choices=part(emmy,'### Decision C1-D03: what Emmy is told','### Common passage')
src('o0.emmy-accident-report','The account given to Emmy','Emmy heard the binding, request, rescue cut and impact in that order. The account did not include Miriam’s private history.','statement','blaise',parents=['o0.accident-sequence'])
src('o0.simon-emmy-account','Simon’s account to Emmy','Simon described the extra cord, the inside ring and his answer to the request. When Emmy asked when Ada’s cut occurred, he placed it after the request. He did not disclose Miriam’s private history.','statement','o0.simon',origin='simon-binding-account')
branches('o0.emmy-arrival',emmy_choices,[
 ('account','Tell Emmy the established binding, request, cut and impact, while her son waits with Ada.',None,(),()),
 ('ask-simon','Ask Simon to explain the safety failure to his sister himself, without using private conversations.',None,(),())], 'o0.emmy-tea')
for id in ('account','ask-simon'):
    s=scenes['o0.emmy-arrival.'+id]
    s['paragraphs']=[p.replace(' She now knows the account because you have given it to her, not because she entered the room.','') for p in s['paragraphs']]
    report='o0.emmy-accident-report' if id=='account' else 'o0.simon-emmy-account'
    s['sourceIds']=[report]
    s['choices'][0].setdefault('actions',[]).append(tell('o0.emmy',report))
emmy_common=part(emmy,'### Common passage','### Decision C1-D04')
add('o0.emmy-tea','One thing after another',emmy_common)
forward('o0.emmy-tea','o0.ruth-print','Look at the invitation Ruth has brought.')

ruth=section(A,"## C1-S04: Ruth's print",'## C1-S05: The first comparison fails')
src('o0.received-invitation','Ruth’s printed invitation','The received page shows a level bright line in a dark field and promises “The same horizon, wherever you stand.” Ruth underlined the last three words.','document',origin='published-invitation')
src('o0.ruth-view-position','The view from Ruth’s chair','Ruth saw the line when she leaned left. It disappeared when she drew back. Moving her chair allowed her to see it without leaning.',origin='ruth-current-view-trial')
add('o0.ruth-print','The words underlined in blue',part(ruth,'### Passage','### Decision C1-D05'),['o0.received-invitation','o0.ruth-view-position'])
branches('o0.ruth-print',part(ruth,'### Decision C1-D05: the question for the inquiry','Exit:'),[
 ('conditions','Ask whether the apparatus changed, or the invitation concealed its viewing conditions.',None,(),()),
 ('same','Ask them to specify what ‘the same horizon’ would mean in a test.',None,(),())],'o0.camera-conditions')

trial=section(A,'## C1-S05: The first comparison fails')
add('o0.camera-conditions','The box has moved',part(trial,'### Passage','### Decision C1-D06'))
src('o0.position-control','One camera, several positions','With the camera fixed, changing the observer’s position changed the visible patch or hid the line. The camera kept its own view.',origin='sunday-position-trial')
src('o0.rotation-control','Arrow and line turn together','Turning the camera tilted the reference arrow and reflected line together in the image. Returning the camera restored both.',origin='sunday-camera-rotation-trial')
control=part(trial,'### Decision C1-D06: choose the first controlled change','### Common passage after either first control')
branches('o0.camera-conditions',control,[
 ('positions','Keep the camera clamped; move your own viewing position and note where the line can be seen.',None,(),()),
 ('rotation','Keep the model still; turn the camera in its clamp while leaving a reference card in the frame.',None,(),())],'o0.control-result')
scenes['o0.camera-conditions.positions']['sourceIds']=['o0.position-control']
scenes['o0.camera-conditions.rotation']['sourceIds']=['o0.rotation-control']
add('o0.control-result','What the first result keeps',part(trial,'### Common passage after either first control','### Further actions now available'))
forward('o0.control-result','o0.layout','Open the source picture and saved page.')

layout=section(B,'## C1-S06: Four versions','## C1-S07: The shallow end')
src('o0.linked-frame','The received frame in its recording','Emmy located the supplied still between the hand leaving the slit and a ripple crossing the reflected light. The tray rim, pale triangle, tilt and notch matched.','document',origin='first-empty-recording')
src('o0.editable-layout','The whole image inside the crop','The editable page rotates the whole supplied frame and crops its surroundings. Resetting the angle and opening the border restores the tray rim and pale triangle with the line.','document',origin='emmy-page-file')
src('o0.layout-approval','The saved approval messages','Simon asked Emmy to lose the grey edges, acknowledged her question about straightening, then approved the finished page. These messages do not record everything he understood.','document',origin='layout-message-thread')
add('o0.layout','Four versions',part(layout,'### Passage','### Decision C1-D07'),['o0.linked-frame','o0.editable-layout','o0.layout-approval'])
branches('o0.layout',part(layout,'### Decision C1-D07: ask about the approval','### Common passage'),[
 ('simon','Ask Simon what he understood when he approved the finished page.',None,(),()),
 ('emmy','Ask Emmy which instruction she believed she was carrying out.',None,(),())],'o0.layout-folder')
add('o0.layout-folder','What was sent',part(layout,'### Common passage','### Factual submission C1-Q01'))
c['questions'].append({'id':'o0.picture-production','occasionId':'o0','text':'How was the invitation’s level, isolated line produced?',
 'when':has('o0.editable-layout'),'candidates':[
 {'id':'whole-image','text':'A frame from the real recording was rotated as a whole and cropped.'},
 {'id':'drawn-line','text':'The bright line was drawn onto an unrelated dark photograph.','contradictedBy':['o0.linked-frame','o0.editable-layout']},
 {'id':'unaltered','text':'The invitation shows the full, unaltered recorded frame.','contradictedBy':['o0.editable-layout']},
 {'id':'camera-proves-everywhere','text':'The single camera frame establishes that every viewing position receives the same picture.'}],
 'supportedCandidateId':'whole-image','proof':{'op':'all','args':[ref('o0.received-invitation'),ref('o0.linked-frame'),ref('o0.editable-layout')]},
 'allowedCorroborators':['o0.layout-approval','o0.position-control','o0.rotation-control','o0.ruth-view-position'],
 'feedback':[{'code':'supported','text':'The selected frame, page and received invitation support the whole-image rotation and crop. The optical line remains part of the recorded scene.'},
 {'code':'unsupported','text':'That account is not established by the selected material.'},
 {'code':'premature','text':'Keep the source image, the page operation and the received result distinct. The selected set does not yet establish their complete connection.'},
 {'code':'irrelevant','text':'Something selected does not establish how this page was made. It remains in your notebook and has not been disclosed.'}],
 'effects':['o0.picture-understood'],'target':'o0.picture-finding'})
add('o0.picture-finding','What the picture promises',part(layout,'Supported-response passage:','Exit:'))
forward('o0.layout-folder','o0.layout','Look again at the actual page operations.')
forward('o0.picture-finding','o0.lesson','Go to the shallow end.')

lesson=section(B,'## C1-S07: The shallow end','## C1-S08: The question after the lesson')
add('o0.lesson','The rail within reach',part(lesson,'### Passage','### Decision C1-D08'))
branches('o0.lesson',part(lesson,"### Decision C1-D08: the lesson's audience",'### Common later passage'),[
 ('leave','Leave Ruth to her lesson and wait in the changing passage.',None,(),()),
 ('towel','Ask whether she wants you to stay only to hold the rail-side towel.',None,(),())],'o0.three-tiles')
src('o0.three-tiles-report','“Three tiles”','After the private part of the lesson, Ruth reported crossing three tiles. Blaise did not see that attempt. Miriam said she saw it too.','statement','o0.ruth',origin='ruth-private-lesson')
add('o0.three-tiles','Three tiles',part(lesson,'### Common later passage','### Optional addressed disclosure C1-D09'),['o0.three-tiles-report'])
branches('o0.three-tiles',part(lesson,'### Optional addressed disclosure C1-D09','Exit:'),[
 ('tell','Tell Miriam the established source-file result, using only the public-picture evidence.',ded('o0.picture-production'),(),()),
 ('keep','Keep the file inquiry in your notebook for now; ask about Ruth\'s next lesson.',None,(),())],'o0.teacher-question')
src('o0.picture-told-miriam','The picture finding told to Miriam','Blaise described the identified frame, whole-image rotation and crop to Miriam. She asked to inspect the comparison before making a public statement.','statement','blaise',parents=['o0.picture-production'])
scenes['o0.three-tiles.tell']['sourceIds']=['o0.picture-told-miriam']
scenes['o0.three-tiles.tell']['choices'][0]['actions']=[tell('o0.miriam','o0.picture-told-miriam')]
scenes['o0.three-tiles.tell']['paragraphs']=[p.replace(' The request remains possible; your account has informed her of the finding, not magically placed the source files in her hands.','') for p in scenes['o0.three-tiles.tell']['paragraphs']]
teacher=section(B,'## C1-S08: The question after the lesson','## C1-S09: The small mirror will do')
add('o0.teacher-question','After the lesson',part(teacher,'### Passage','### Decision C1-D10'))
branches('o0.teacher-question',part(teacher,'### Decision C1-D10: press the positive claim','### Common passage'),[
 ('particular','Ask how understanding a rule could reach the nature of one particular person.',None,(),()),
 ('love','Ask why she calls understanding love rather than comprehension.',None,(),())],'o0.teacher-reply')
add('o0.teacher-reply','The next argument',part(teacher,'### Common passage','### Exit choice C1-D11'))
branches('o0.teacher-reply',part(teacher,'### Exit choice C1-D11','Exit:'),[
 ('continue-argument','Keep her distinction in the notebook; ask for the next argument when there is time to examine it.',None,(),()),
 ('unconvinced','Say the lesson changed what she did, but leaves you unconvinced about infinite understanding.',None,(),())],'o0.sunday-late')
add('o0.sunday-late','The last light', '''Emmy closes the laptop. She sends you the folder before putting it away. Her son is waiting with the two pairs of boots, one of them dripping onto the other.

Simon holds the entrance while they go. Emmy turns back before he has let it close.

“When we were small,” she says. “The chair. I wanted them to look at the drawings. They kept talking.”

He still has his hand on the door. “I thought you wanted me to explain them.”

“I liked them.”

He looks at the boots. She waits until he looks back, then says goodbye.

Ruth has gone too. The invitation is still open on Simon's phone. You open the received frame on yours and put the two side by side. Simon asks whether the page can be used again. You tell him its words would need to describe what a visitor can actually find. He puts a blank card beside the phones.

By late afternoon the water in the open tray has gone still. Simon dismantles the small model. He does not uncover your saved glass to take its place. The larger piece is being wrapped for a glazier to collect.

For a while nobody asks you to look at a picture.''')
forward('o0.sunday-late','o0.two-breaths','Sit beside Ada while the glass is wrapped.')

FIRST=read('loop/BLAISE-FIRST-RETURN.md');R=read('loop/RETURN-INVESTIGATION-L3.md');L4=read('loop/LIVED-MIDDLE-L4.md');GOD=read('loop/BLAISE-ALLOWED.md');END=read('loop/ENDING-L3-AUDITIONS.md')
two=part(FIRST,'### Passage','Editorial record:')
two=two.replace('Miriam calls from the changing passage that she has found her keys. You get up.',
                'Miriam calls from the changing passage that she has found her keys. She appears in the front concourse with her coat over her good arm. You get up.')
src('o0.chair-contact','“There you are”','Ada steadied the chair and touched Blaise’s wrist as he stood. She said, “There you are.”',origin='sunday-blaise-chair-contact')
src('o0.miriam-chair-perception','The contact seen from the entrance','From the front concourse, Miriam saw Ada steady Blaise and touch his wrist. She could not reliably hear the words.',origin='miriam-sunday-chair-observation')
add('o0.two-breaths','Two breaths',two,['o0.chair-contact'])
forward('o0.two-breaths','o0.bearers','Fetch the two pieces of wood.',actions=[witness('o0.miriam','o0.miriam-chair-perception')])
prep=part(R,'### Passage','Acquire `o0-exterior-preparation`')
src('o0.marked-wood-preparation','The stroke beside the burn','Simon marked the long strip beside its burn and three pin holes. Miriam put that strip on the low exterior sill. Blaise saw the mark and placement.',origin='sunday-packing-preparation')
src('o0.front-departure','Miriam goes out through the front','Blaise held the front entrance. Miriam laid the long strip on the exterior sill, then crossed the road to wait beside the laundry.',origin='sunday-front-departure')
add('o0.bearers','The bearers',prep,['o0.marked-wood-preparation','o0.front-departure'])
forward('o0.bearers','o0.parcel','Return to the wrapped mirror.',actions=[witness('o0.miriam','o0.marked-wood-preparation'),witness('o0.miriam','o0.front-departure'),{'type':'snapshotCharacter','fromCharacterId':'o0.miriam','toCharacterId':'miriam_exterior'}])
cross=part(FIRST,'## Crossing','### Choice B-R01')
before,after=cross.split('The edge of the cardboard catches the jamb.',1)
add('o0.parcel','The weight of the glass',before)
src('o0.service-crossing','The parcel at the jamb','Blaise carried the covered glass toward the service yard. Its cardboard edge caught at the jamb; the next place he experienced was the front entrance.',origin='blaise-first-crossing')
src('o1.return-tableau','The entrance again','Blaise found his hand on the front entrance handle. The broken mirror, rabbit, saucepan, peas and wet sock were in the earlier arrangement. Simon repeated his sentence about the sight.',origin='blaise-first-return')
add('o1.return','The mouth before the words','The edge of the cardboard catches the jamb.'+after,['o1.return-tableau'])
edge('o0.parcel','o0.carry-through','Carry the wrapped glass through the service door.','o1.return',actions=[acquire('o0.service-crossing')],enter='o1')
branches('o1.return',part(FIRST,'### Choice B-R01: make a difference','### Common passage'),[
 ('blue','Say ‘Blue’ before anyone asks you a question.',None,(),()),
 ('handle','Remain silent and deliberately keep your hand on the entrance handle.',None,(),())],'o1.calendars')
src('o1.first-dates','Three Saturday screens','Blaise, Miriam and Simon compared their phone screens. All showed Saturday. The bath clock was one minute behind Simon’s phone.',origin='first-return-phone-comparison')
add('o1.calendars','A day with the wrong name',part(FIRST,'### Common passage','### Choice B-R02'),['o1.first-dates'])
src('o1.blaise-return-account','Blaise’s account of the crossing','Blaise reported remembering the wrapped glass, seven keys, Sunday and the change to the front entrance. He did not see the interval between the two places.','statement','blaise',parents=['o0.service-crossing','o1.return-tableau'])
branches('o1.calendars',part(FIRST,'### Choice B-R02: give an account of the return','Both routes preserve'),[
 ('describe','Describe the crossing and the vanished parcel. Distinguish what you saw from what you think it means.',None,(),()),
 ('predict','Say you believe the day has returned, and ask them to help you find something your memory can predict.',None,(),())],'o1.ada-chair')
for id in ('describe','predict'):
    s=scenes['o1.calendars.'+id];s['sourceIds']=['o1.blaise-return-account'];s['choices'][0]['actions']=[tell('o1.'+x,'o1.blaise-return-account') for x in ('ada','simon','miriam')]
ada=section(FIRST,'## Ada has not touched your wrist')
src('o1.chair-attempt','The chair caught instead','Blaise arranged the faulty chair to invite the earlier gesture. Ada caught the chair with both hands and moved it away; she did not repeat the earlier wrist contact.',origin='returned-chair-attempt')
add('o1.ada-chair','The loose leg',part(ada,'### Passage','### Choice B-R03'),['o1.chair-attempt'])
src('o1.requested-hand','A present hand','Blaise asked Ada to hold his hand. She offered it. It felt cooler than he remembered; her thumb moved once against his.',origin='requested-present-contact')
branches('o1.ada-chair',part(ada,'### Choice B-R03: what you ask of this Ada','### Common passage'),[
 ('remember','Tell her about the touch and the words ‘There you are,’ and ask whether she remembers either.',None,(),()),
 ('ask-hand','Tell her you wanted the touch to happen again, even if she had no memory of the first.',None,(),()),
 ('gone','Say you are frightened that the person you remember has gone, and you cannot tell whether Ada is her.',None,(),())],'o1.camera-offer')
scenes['o1.ada-chair.ask-hand']['sourceIds']=['o1.requested-hand']
add('o1.camera-offer','Where she will stand',part(ada,'### Common passage','Editorial consequences:'))
forward('o1.camera-offer','o1.knock','Go toward the front entrance when someone knocks.')

# The present simultaneous encounter is evidence in its own right. It does not
# give the two women independent provenance for their shared earlier accident.
knock=section(R,'## B-R04. The knock','## B-R05. What the coat does not know')
add('o1.knock','The hand at the entrance',part(knock,'### Passage','### Choice B-R04-A'))
outside_label='Ask the woman in the coat to tell you what happened outside while you were gone.'
branches('o1.knock',part(knock,"### Choice B-R04-A: Blaise's first action",'### Common passage'),[
 ('tell','Tell both women what you experienced at the service door, without naming either as a copy.',None,(),()),
 ('outside',outside_label,None,(),()),
 ('observe','Ask Ada and Simon to say what they can see, without moving either woman.',None,(),())],'o1.two-cups')
src('o1.both-hear-crossing','The account given to both women','Blaise described the covered glass catching at the service jamb and his next experience at the front entrance. Both women heard him.','statement','blaise',parents=['o1.blaise-return-account'])
scenes['o1.knock.tell']['sourceIds']=['o1.both-hear-crossing']
scenes['o1.knock.tell']['choices'][0]['actions']=[tell(x,'o1.both-hear-crossing') for x in ('o1.ada','o1.simon','o1.miriam','miriam_exterior')]
src('o1.outside-wait-account','Waiting across the road','The woman in the coat said she put down the wood, crossed the road, felt a drip and waited. She could not see into the service yard; she did not identify which door she heard.','statement','miriam_exterior',origin='miriam-exterior-wait')
scenes['o1.knock.outside']['sourceIds']=['o1.outside-wait-account']
src('o1.two-miriams','Two cups, two speakers','Two women addressed as Miriam sat on separate chairs and spoke independently. One wore her coat while a corresponding coat remained on the hook. Blaise, Ada and Simon saw the sustained co-presence.',origin='shared-current-co-presence')
add('o1.two-cups','The sleeve on the hook',part(knock,'### Common passage','Acquire `o1-two-miriams`'),['o1.two-miriams'])
forward('o1.two-cups','o1.changed-date','Compare what the phone screens show now.',actions=[witness(x,'o1.two-miriams') for x in ('o1.ada','o1.simon','o1.miriam','miriam_exterior')])
coat=section(R,'## B-R05. What the coat does not know','## B-R06. The stroke beside the burn')
coat_begin=part(coat,'### Passage',"#### If Blaise heard Miriam's private account in the first occasion")
coat_begin=coat_begin.replace('She mentions who was present only if they actually were.',
                             'She names Emmy, with the boots, and Ruth, who came for her lesson.')
coat_conf=part(coat,"#### If Blaise heard Miriam's private account in the first occasion",'This variant must be gated')
coat_conf=coat_conf.replace('The woman in the coat pauses before the conversation you had alone.',
                           'Then the woman in the coat goes back to the evening before. She pauses before the conversation you had alone.')
coat_no=part(coat,'#### If the private account was refused or never heard','#### Common')
coat_end=part(coat,'#### Common','### Choice B-R05-A')
src('o1.sunday-screens','The later Sunday screens','The three screens later showed Sunday; nobody saw the change. Simon showed network time enabled. The bath clock still lagged by one minute.',origin='later-phone-comparison')
src('o1.sunday-account','The day she remembers','The woman who had waited outside described coming back to the bath and the open model’s light. The other woman said she was trying to remember having that day.','statement','miriam_exterior',origin='miriam-sunday-history')
add('o1.changed-date','What the coat does not know',coat_begin+'\n\n'+coat_no+'\n\n'+coat_end,
 ['o1.sunday-screens','o1.sunday-account'],[variant('o1.changed-date.confidence',has('o0.present-miriam-confidence','historical'),coat_begin+'\n\n'+coat_conf+'\n\n'+coat_end,['o1.sunday-screens','o1.sunday-account'])])
coat_choices=part(coat,'### Choice B-R05-A: what to ask now','Acquire the current phone/date')
coat_choices=coat_choices.replace('The call, if made in a later scene, must actually be heard or privately reported before it becomes evidence. This choice does not invent a recipient or a response.','')
branches('o1.changed-date',coat_choices,[
 ('alone','Ask whether they want you to leave them alone together for a while.',None,(),()),
 ('names','Ask how each would like to be addressed while both are present.',None,(),()),
 ('witness','Tell them you cannot keep treating one as a witness and the other as the thing she proves.',None,(),())],'o1.wood-test')
wood=section(R,'## B-R06. The stroke beside the burn','## Editorial disposition and open seams')
src('o1.wood-prediction','Description written before the search','Before fetching the exterior strip, Blaise dictated its burn, three holes and pencil stroke. Simon also wrote Ada’s warning about old matching stock.','document',origin='dictated-wood-prediction',parents=['o0.marked-wood-preparation'])
src('o1.wood-pair','Marked and unmarked strips','The prepared marked strip remained on the exterior sill. A closely corresponding unmarked strip was found in the interior box. Burn, holes, grain and split resembled one another; old matching stock was not excluded.',origin='current-wood-comparison')
src('o1.front-trial','The observed front crossing','Blaise went out through the front with Ada, fetched the marked strip and came back. No represented return occurred during this traversal.',origin='observed-front-traversal')
add('o1.wood-test','The stroke beside the burn',part(wood,'### Passage','### Choice B-R06-A'),['o1.wood-prediction','o1.wood-pair','o1.front-trial'])
branches('o1.wood-test',part(wood,'### Choice B-R06-A: bounded material finding','Both choices acquire'),[
 ('record','Record that the prepared marked strip remained outside, and that a closely corresponding unmarked strip is now inside.',None,(),()),
 ('repeated','Say you think the strip was repeated along with the room, while recording what the pair alone cannot prove.',None,(),())],'o1.wood-result')
scenes['o1.wood-test.repeated']['choices'][0]['interpretation']={'id':'o1.repeated-strip-reading','text':'Blaise thinks the closely corresponding strip may have been repeated with the room. He did not see it come into being; old matching stock remains possible.'}
add('o1.wood-result','The words already on the paper',part(wood,'### Common passage','Transition to BLAISE-ALLOWED'))
forward('o1.wood-result','o1.middle-water','Give the questions a rest and sit beside the water.')
c['questions'].append({'id':'o1.local-continuation','occasionId':'o1','text':'What local result do the two speakers and the material comparison establish?',
 'when':has('o1.wood-pair'),'candidates':[
 {'id':'local-coexistence','text':'Two embodied speakers now coexist with different later accounts; the marked exterior strip remains alongside a closely corresponding unmarked strip.'},
 {'id':'only-recording','text':'The second Miriam has appeared only in a picture or recording.','contradictedBy':['o1.two-miriams']},
 {'id':'erased-mark','text':'The mark has vanished from the only strip now present.','contradictedBy':['o1.wood-pair']},
 {'id':'whole-world','text':'These observations establish that the whole world returned to one earlier state.'}],
 'supportedCandidateId':'local-coexistence','proof':{'op':'all','args':[ref('o1.two-miriams'),ref('o1.sunday-account'),ref('o1.wood-pair'),ref('o0.marked-wood-preparation','historical')]},
 'allowedCorroborators':['o1.wood-prediction','o1.outside-wait-account','o1.first-dates','o1.sunday-screens','o1.front-trial','o0.front-departure'],
 'feedback':[{'code':'supported','text':'Those selected encounters establish the local co-presence and material comparison. They leave the unobserved interval, the extent of the change and its cause open.'},
 {'code':'unsupported','text':'The selected observations do not establish that explanation.'},
 {'code':'premature','text':'Separate what was prepared before the crossing from what was encountered afterward. The selected set has not yet joined those observations.'},
 {'code':'irrelevant','text':'That additional item does not establish this bounded finding. Keeping it in the notebook does not disclose it to either woman.'}],
 'effects':['o1.local-finding']})

# L4 preserves optional earlier history through guards, not broad intimacy flags.
M1=section(L4,'## L4-M01. The dry side','## L4-M02. The good hand')
M2=section(L4,'## L4-M02. The good hand','## L4-M03. Not the sentence you were carrying')
M3=section(L4,'## L4-M03. Not the sentence you were carrying','## L4-M04. Who was being thanked')
M4=section(L4,'## L4-M04. Who was being thanked','## Integration ledger')
old_keys=has('o0.keys-return','historical');old_pressed=has('o0.pressed-shoe-reply','historical')
old_conf=has('o0.present-miriam-confidence','historical');old_lift=has('o0.thursday-agreement','historical')
add('o1.middle-water','The dry side',part(M1,'### Passage','### Choice L4-M01-A'))
branches('o1.middle-water',part(M1,'### Choice L4-M01-A: remembered help','### Common passage'),[
 ('remembered','Offer to fetch her shoe and keys.',old_keys,(),()),
 ('ask','Ask whether there is anything she wants brought over.',None,(),()),
 ('wait','Stay seated. Let her ask if she needs something.',None,(),())],'o1.water-hand')
hand_before=part(M1,'### Common passage','#### If Blaise actually heard the pressed first-occasion shoe reply')
hand_pressed=part(M1,'#### If Blaise actually heard the pressed first-occasion shoe reply','#### Otherwise')
hand_other=part(M1,'#### Otherwise','#### Common')
hand_after=part(M1,'#### Common','### Choice L4-M01-B')
add('o1.water-hand','The end of a different request',hand_before+'\n\n'+hand_other+'\n\n'+hand_after,
 variants=[variant('o1.water-hand.remembered',old_pressed,hand_before+'\n\n'+hand_pressed+'\n\n'+hand_after)])
private_block=part(M1,'### Choice L4-M01-B: how much of the earlier intimacy to bring here','#### If she has not already asked Blaise to leave')
branches('o1.water-hand',private_block,[
 ('permission','Ask whether she wants to hear about your earlier conversation with her.',old_keys,(),()),
 ('confidence','Tell her what the other Miriam confided about caring for her mother.',old_conf,('o1.unwelcome-confidence',),()),
 ('quiet','Ask whether she would like you to stay without talking.',None,(),())],'o1.water-leave')
scenes['o1.water-hand.confidence']['choices'][0]['target']='o1.middle-bread'
for ch in scenes['o1.water-hand']['choices']:
    if ch['target']=='o1.water-hand.confidence':ch['irreversible']=True
src('o1.mother-recollection','A remembered confidence repeated here','Blaise repeated the earlier account of Miriam caring for her mother to the Miriam beside the water. She asked him to stop. No one else heard this telling.','statement','blaise',parents=['o0.present-miriam-confidence'])
scenes['o1.water-hand.confidence']['sourceIds']=['o1.mother-recollection']
scenes['o1.water-hand.confidence']['choices'][0]['actions']=[tell('o1.miriam','o1.mother-recollection')]
src('o1.kitchen-confidence','The keys in Ada’s kitchen','Miriam told Blaise she once pretended to lose her keys because she wanted to stay in Ada’s kitchen. She asked him not to tell Ada; he agreed.','statement','o1.miriam',origin='miriam-kitchen-anecdote')
scenes['o1.water-hand.quiet']['sourceIds']=['o1.kitchen-confidence']
add('o1.water-leave','A few minutes',part(M1,'#### If she has not already asked Blaise to leave','Exit:'))
forward('o1.water-leave','o1.middle-bread','Go back toward the workshop.')

bread_first=part(M2,'### Passage','#### If Blaise stayed for the first-occasion supper')
bread_supper=part(M2,'#### If Blaise stayed for the first-occasion supper','#### Choice L4-M02-TASTE')
bread_supper=bread_supper.replace('“That wasn\'t what I asked.”','“I asked whether you liked it.”')
bread_no=part(M2,'#### Otherwise','#### Common')
add('o1.middle-bread','The good hand',bread_first+'\n\n'+bread_no,
 variants=[variant('o1.middle-bread.supper',has('o0.supper-encounter','historical'),bread_first+'\n\n'+bread_supper)])
taste_block=part(M2,'#### Choice L4-M02-TASTE: answer her now','These are present claims')
branches('o1.middle-bread',taste_block,[(s,l,has('o0.supper-encounter','historical'),(),()) for s,l in [('sweet','Too sweet for me.'),('liked','I liked it.'),('barely','I scarcely tasted it.')]],'o1.bread-thanks')
edge('o1.middle-bread','o1.bread-first-taste','Let her finish the mouthful.','o1.bread-thanks',when=neg(has('o0.supper-encounter','historical')))
thanks_begin=part(M2,'#### Common','#### If the actual first-occasion keys encounter was completed')
thanks_keys=part(M2,'#### If the actual first-occasion keys encounter was completed','##### If the pressed private conversation was actually encountered')
thanks_pressed=part(M2,'##### If the pressed private conversation was actually encountered','##### Otherwise, after the unpressed keys encounter')
thanks_unpressed=part(M2,'##### Otherwise, after the unpressed keys encounter','##### Common to the keys history')
thanks_end=part(M2,'##### Common to the keys history','#### Otherwise')
thanks_door=part(M2,'#### Otherwise\n\n“Thank you for the entrance,”','#### Common')
thanks_door='“Thank you for the entrance,” '+thanks_door
thanks_common=part(M2,'#### Common\n\n“You\'re welcome,”','### Choice L4-M02-A')
thanks_common='“You\'re welcome,” '+thanks_common
add('o1.bread-thanks','Something remembered without asking',thanks_begin+'\n\n'+thanks_door+'\n\n'+thanks_common,
 variants=[variant('o1.bread-thanks.pressed',both(old_keys,old_pressed),thanks_begin+'\n\n'+thanks_keys+'\n\n'+thanks_pressed+'\n\n'+thanks_end+'\n\n'+thanks_common),
           variant('o1.bread-thanks.keys',both(old_keys,neg(old_pressed)),thanks_begin+'\n\n'+thanks_keys+'\n\n'+thanks_unpressed+'\n\n'+thanks_end+'\n\n'+thanks_common)])
private_interval=part(M2,'### Choice L4-M02-A: the private interval','Exit:')
private_interval=private_interval.replace(' What they say is not acquired by the player.','')
private_interval=private_interval.replace(' Later you can ask about an invitation addressed to you; you cannot record an unheard permission.','')
branches('o1.bread-thanks',private_interval,[
 ('offer','Offer to ask the other Miriam whether she wants company, while saying plainly that Ada and Miriam want a private conversation.',None,('o1.company-offered',),()),
 ('decline','Say you will give her space, but ask her to make her own arrangement with the other Miriam.',None,('o1.company-not-arranged',),()),
 ('test','Ask whether they intend to discuss another crossing without you.',None,('o1.asked-private-test',),())],'o1.water-return')

water_refused=part(M3,'#### After the explicit confidence disclosure in M01','#### Otherwise')
water_refused=water_refused.replace('You say you understand. You sit where she indicated.','You say you understand.')
water_normal=part(M3,'#### Otherwise','##### After offering in M02')
water_offer=part(M3,'##### After offering in M02','##### After declining to arrange it in M02')
water_decline=part(M3,'##### After declining to arrange it in M02','##### After asking whether the conversation concerns the next test in M02')
water_test=part(M3,'##### After asking whether the conversation concerns the next test in M02','##### Common to these three replies')
water_sit=part(M3,'##### Common to these three replies','#### Common')
water_shared=part(M3,'#### Common','### Choice L4-M03-A')
add('o1.water-return','The space beside the chair',water_normal+'\n\n'+water_test+'\n\n'+water_sit+'\n\n'+water_shared,
 variants=[variant('o1.water-return.after-disclosure',flag('o1.unwelcome-confidence'),water_refused+'\n\n'+water_shared),
           variant('o1.water-return.offered',both(neg(flag('o1.unwelcome-confidence')),flag('o1.company-offered')),water_normal+'\n\n'+water_offer+'\n\n'+water_sit+'\n\n'+water_shared),
           variant('o1.water-return.not-arranged',both(neg(flag('o1.unwelcome-confidence')),flag('o1.company-not-arranged')),water_normal+'\n\n'+water_decline+'\n\n'+water_sit+'\n\n'+water_shared)])
branches('o1.water-return',part(M3,'### Choice L4-M03-A: an inference that might become a disclosure','### Common passage'),[
 ('unknown','Say you have not heard their present conversation.',None,(),()),
 ('thursday','Tell her about the earlier Thursday lift agreement, and say it might be what this is about.',old_lift,('o1.lift-told-interior',),())],'o1.name-offered')
for ch in scenes['o1.water-return']['choices']:
    if ch['target']=='o1.water-return.thursday':ch['irreversible']=True
src('o1.lift-recollection','The earlier lift told here','Blaise told the Miriam by the water about the earlier Thursday lift. He said it might be the present private conversation’s subject, but had not heard that conversation.','statement','blaise',parents=['o0.thursday-agreement'])
scenes['o1.water-return.thursday']['sourceIds']=['o1.lift-recollection']
scenes['o1.water-return.thursday']['choices'][0]['actions']=[tell('o1.miriam','o1.lift-recollection')]
name_open=part(M3,'### Common passage','#### If Blaise actually requested and received the present touch at B-R03')
name_hand=part(M3,'#### If Blaise actually requested and received the present touch at B-R03','#### Otherwise')
name_chair=part(M3,'#### Otherwise\n\nYou say she caught the chair instead.','#### Common')
name_chair='You say she caught the chair instead. '+name_chair
name_close=part(M3,'#### Common\n\nThe workshop door opens.','### Choice L4-M03-B')
name_close='The workshop door opens. '+name_close
add('o1.name-offered','What comes after the name',name_open+'\n\n'+name_chair+'\n\n'+name_close,
 variants=[variant('o1.name-offered.hand',has('o1.requested-hand'),name_open+'\n\n'+name_hand+'\n\n'+name_close)])
branches('o1.name-offered',part(M3,"### Choice L4-M03-B: the call's audience",'The call actually occurs.'),[
 ('sight','Offer to wait within sight while she speaks privately.',None,(),()),
 ('leave','Leave her to the call and return toward the concourse.',None,(),())],'o1.two-at-bench')

bench_open=part(M4,'### Passage','#### If the interior Miriam has heard the historical lift agreement in M03')
bench_lift=part(M4,'#### If the interior Miriam has heard the historical lift agreement in M03','#### If the interior Miriam has not heard that agreement')
bench_new=part(M4,'#### If the interior Miriam has not heard that agreement','This variant can use')
bench_common=part(M4,'#### Common','### Choice L4-M04-A')
src('o1.call-report','What she says about the call','The Miriam returning from the shallow end said she got through and had not told the recipient about the other woman. She did not name the recipient or repeat their reply.','statement','o1.miriam',origin='interior-private-call-report')
src('o1.private-ada-topic','What she says about Ada','The Miriam with the coat said she asked Ada about Thursday. She withheld the full private conversation and did not make an arrangement on the other woman’s behalf.','statement','miriam_exterior',origin='exterior-private-ada-report')
add('o1.two-at-bench','Who was being thanked',bench_open+'\n\n'+bench_new+'\n\n'+bench_common,['o1.call-report','o1.private-ada-topic'],
 [variant('o1.two-at-bench.old-lift',flag('o1.lift-told-interior'),bench_open+'\n\n'+bench_lift+'\n\n'+bench_common,['o1.call-report','o1.private-ada-topic'])])
m4choices=part(M4,"### Choice L4-M04-A: Blaise's intervention",'### Common passage')
thanks_choice=chosen(m4choices,'Tell them what it was like to be thanked for something from before.')
thanks_tail=thanks_choice[thanks_choice.index('In either version,')+len('In either version,'):].strip()
thanks_tail=thanks_tail[0].upper()+thanks_tail[1:]
keys_quote='“She thanked me for bringing the shoe before. I hadn\'t asked her to remember it.”'
door_quote='“She thanked me for holding the front door when she took the wood out. I\'d hardly noticed doing it.”'
add('o1.bench-thanks','The deed she remembered',door_quote+'\n\n'+thanks_tail,
 variants=[variant('o1.bench-thanks.keys',old_keys,keys_quote+'\n\n'+thanks_tail)])
edge('o1.two-at-bench','o1.explain-thanks','Tell them what it was like to be thanked for something from before.','o1.bench-thanks')
forward('o1.bench-thanks','o1.middle-close')
branches('o1.two-at-bench',m4choices,[
 ('together','Offer to leave them together.',None,(),()),
 ('afraid','Say you are afraid of leaving another person behind if you cross again.',None,(),())],'o1.middle-close')
add('o1.middle-close','The towel under the heel',part(M4,'### Common passage','Exit into further inquiry'))
forward('o1.middle-close','o1.allowed','Ask Simon and Miriam about what has been allowed.')

# The interior Miriam is the listener here. The exterior woman is elsewhere;
# her persistent state receives none of this private argument automatically.
god_entry='''Simon carries the paper and the two strips to the small table outside the workshop. The woman who identified the wood remains by the spectators' bench, with her folded coat. The other Miriam joins you at the table. She is the one whose keys you brought from beneath the insole.

Simon turns the description toward her. The result is written beneath it, with the time and the people who saw it. His finger follows the edge of the paper, stopping short of the damp part.

You had asked him to keep the account. Now you want him to stop looking at it.

It is a very small amount of paper for the way your stomach feels.

“I keep thinking I've been allowed,” '''+part(GOD,"“I keep thinking I've been allowed,”",'### Choice L1-G01')
add('o1.allowed','Another try',god_entry)
branches('o1.allowed',part(GOD,'### Choice L1-G01','### Common passage'),[
 ('gift','Apologize for making his failure answer the question. Keep the possibility of a gift open.',None,(),()),
 ('objection','Say the timing is an objection to your hope, and ask what another explanation would need to account for.',None,(),())],'o1.intention')
add('o1.intention','An intention within it',part(GOD,'### Common passage','### Choice L1-G02'))
branches('o1.intention',part(GOD,'### Choice L1-G02','### Closing passage'),[
 ('remembered','Say you will treat the remembered encounter as something that mattered, even without knowing where it belongs.',None,(),()),
 ('present','Say the present Ada is the person who can answer now; refuse to call her a replacement.',None,(),())],'o1.paper-cup')
add('o1.paper-cup','The cup on the paper',part(GOD,'### Closing passage','Editorial limits:'))
forward('o1.paper-cup','o1.keep-time','Go into the workshop to speak with Ada.')

# Selected/adapted P-002 A2/A3. A1 and the mutually exclusive B remain proposals.
P= (ROOT/'docs/coordination/protagonist/work/P-002-A.md').read_text()
music=part(P,'## A2. Keep time','### A2 choice')
music=music.replace('“Before she told you.”\n\n“I thought you remembered it. I told you.”','“When I came in again.”\n\n“I believe you remember it.”')
music=music.replace('\n\n“You did.”','')
music=music.replace('She takes another bite. You had expected corroboration to change her face. Instead it has allowed her to go on eating.',
                    'She takes another bite. You had wanted her answer to change something you could see. She goes on eating.')
music=music.replace('Simon appears at the door with a piece of wood in each hand.',
                    'Simon appears at the door carrying both pieces of wood, with the paper folded beneath them.')
src('o1.shared-music','The beat under her voice','Blaise tapped a beat while Ada sang. His hand hurried when he expected a rise she did not make; they continued together. Simon heard the ending, then left. No recording was made.',origin='ada-blaise-current-music')
add('o1.keep-time','Keep time',music,['o1.shared-music'])
music_a=part(P,'**A2a. “Tell her that for a moment you liked being the only one who remembered.”**','**A2b.')
music_b=part(P,'**A2b. “Tell her you are afraid of losing the way she has just learned to wait for your hand.”**','### Common')
add('o1.music-advantage','What he liked',music_a)
add('o1.music-loss','What she has learned to wait for',music_b)
edge('o1.keep-time','o1.admit-advantage','Tell her that for a moment you liked being the only one who remembered.','o1.music-advantage',effects=['o1.admitted-advantage'])
edge('o1.keep-time','o1.admit-new-loss','Tell her you are afraid of losing the way she has just learned to wait for your hand.','o1.music-loss')
forward('o1.music-advantage','o1.promise-private')
forward('o1.music-loss','o1.promise-private')
promise=part(section(P,'## A2. Keep time','## A3.'),'### Common')
src('o1.advance-notice-promise','A promise made to Ada','Behind the closed workshop door, Blaise promised Ada he would tell her before trying the service door. The two Miriams did not hear the conversation.','statement','blaise',origin='private-advance-notice-promise')
add('o1.promise-private','Would she get to keep it?',promise,['o1.advance-notice-promise'])
forward('o1.promise-private','o1.promise-audience','Make room when the others come to the door.',actions=[tell('o1.ada','o1.advance-notice-promise')])
a3=section(P,'## A3. A statement with an audience','## Authored later consequences for A')
audience=a3.split('### A3 choice')[0].strip()
audience=audience[:audience.index('You can leave what you said with Ada.')].strip()
audience=audience.replace('The two women have come to the workshop door.',
                         "At the spectators' bench, the woman with the peas gets up. She lifts her foot from the towel and leaves it over the rail. The other Miriam brings her folded coat. They come to the workshop door together.")
add('o1.promise-audience','Who hears the promise',audience)
src('o1.promise-public','The limited promise repeated publicly','Blaise called Simon back and told Ada and both Miriams that he had promised to tell Ada before a further crossing. He kept the rest of the private conversation to himself. The woman who had waited outside agreed to remind him if they could speak later.','statement','blaise',parents=['o1.advance-notice-promise'])
private_promise=part(a3,'**A3a. “Keep the conversation with Ada private.”**','**A3b.')
public_promise=part(a3,'**A3b. “Tell both Miriams and Simon that you have promised Ada to tell her before any further crossing; keep the rest private.”**')
public_promise=public_promise.replace('Then you tell all three what you have promised.','Then you tell them what you have promised.')
add('o1.promise-kept-private','Bread at the table',private_promise)
add('o1.promise-told','A statement with an audience',public_promise,['o1.promise-public'])
edge('o1.promise-audience','o1.keep-promise-private','Keep the conversation with Ada private.','o1.promise-kept-private')
edge('o1.promise-audience','o1.tell-promise','Tell both Miriams and Simon only that you promised Ada notice before another crossing.','o1.promise-told',irreversible=True)
forward('o1.promise-kept-private','o1.before-going')
forward('o1.promise-told','o1.before-going',actions=[tell(x,'o1.promise-public') for x in ('o1.ada','o1.simon','o1.miriam','miriam_exterior')])

# The selected ending preserves the original bounded chair corroboration:
# no A1 interrogation has been inserted earlier, so it is new here.
ending_open=part(END,'### B-E01. Before anybody goes','### Choice B-E01-A')
ending_open='''Ada fetches the shoe from beside the spectators' bench and sets it near the workshop table.

'''+ending_open
src('o1.exterior-chair-account','The contact she saw','The Miriam who waited outside said she saw the chair catch Blaise, Ada steady it and touch his wrist, and Blaise go toward Simon. She could not clearly hear the words.','statement','miriam_exterior',origin='miriam-sunday-chair-observation')
add('o1.before-going','The person at the other end of the table',ending_open,['o1.exterior-chair-account'])
branches('o1.before-going',part(END,'### Choice B-E01-A: what Blaise claims about himself','### Common passage'),[
 ('one-i','Say the memories belong to one I, even when their surroundings no longer agree.',None,(),()),
 ('another','Say another man with your memories would frighten you even if he had as much evidence as you.',None,(),()),
 ('ordinary','Ask whether everyone is making an ordinary certainty impossible by demanding proof of a soul.',None,(),())],'o1.eternity')
eternity='“I tried to work out '+part(END,'### Common passage\n\n“I tried to work out','### Choice B-E01-B')
add('o1.eternity','The afternoon she would keep',eternity)
branches('o1.eternity',part(END,'### Choice B-E01-B: what he asks of the retained witness','### Common passage'),[
 ('cup','Ask the Miriam who remembers Sunday to tell you one ordinary thing you missed.',None,(),()),
 ('voice','Ask her to stop describing the day for now. You want to hear a voice without testing it.',None,(),()),
 ('ada','Ask whether she thinks the Ada she remembers ceased to exist.',None,(),())],'o1.dressing')
dressing='Miriam by the door asks '+part(END,'### Common passage\n\nMiriam by the door asks','### B-E02. The last proposed test')
add('o1.dressing','The edge coming unstuck',dressing)
forward('o1.dressing','o1.last-test','Go with Simon to the service passage.')
last_test=part(END,'### B-E02. The last proposed test','### Choice B-E02-A')
add('o1.last-test','The last proposed test',last_test)
optional_offer=part(END,'### B-E02-B. An answer you have not heard',"Return to B-E02-A's two action choices.")
src('o1.ada-front-offer','Ada’s private invitation','At the service washbasin, Ada told Blaise she wanted to get outside and would like him to come through the front with her. The exterior Miriam did not hear this exchange.','statement','o1.ada',origin='ada-private-front-invitation')
add('o1.ada-front-offer','An answer you have not heard',optional_offer,['o1.ada-front-offer'])
add('o1.route-decision','The route you are considering','''Ada waits beside the washbasin while you tell her which route you are considering. You have already said enough to make her look at you differently. You want that look to remain possible tomorrow. You also want the door to do something nobody can yet explain.

“I haven't decided,” you say.

“Tell me when you have.”''')
forward('o1.ada-front-offer','o1.route-decision','Return to the choice of route.')
edge('o1.last-test','o1.ask-ada-first','Tell Ada you are considering crossing to find the earlier encounter, and hear her answer before deciding.','o1.ada-front-offer')
for s in ('o1.last-test','o1.route-decision'):
    edge(s,s+'.front','Leave by the front with the people who are here. Refuse another service-door crossing.','o1.refuse')
    edge(s,s+'.discuss','Ask everyone about an empty-handed service trial and what it might cost them.','o1.test-discussion')

# T-002's strongest-risk disclosure and voluntary positions are selected.
# The new open-circle and exterior-paper experiment are explicitly NOT selected.
T=(ROOT/'docs/coordination/loop-plot/work/PERFORMED-REVISIONS.md').read_text()
discussion=part(T,'## 2. LP-E04: who will still be able to answer')
discussion=part(discussion,'### Passage','### Choice LP-E04-A')
discussion=discussion.replace('The Miriam with the coat says she could carry the paper. She does not say she could carry everyone else\'s account of what happened to them.\n\n','')
add('o1.test-discussion','Who will still be able to answer',discussion)
add('o1.postpone','All through the front','''“I can do that,” says the Miriam without the coat.

The other woman turns her coat to find the neck. She has put her good arm into the wrong sleeve.

“Don't pull it,” she tells Ada. “Let me get it out.”

Simon asks whether putting off means tomorrow. You tell him you have not decided that. He leaves the screen dark and lifts the camera from its stand.

Ada goes to the service door. You tell her you are coming by the front.''')
edge('o1.test-discussion','o1.postpone-together','Ask everyone to take the front together and postpone the service-door trial.','o1.postpone',effects=['o1.postponed-together'])
forward('o1.postpone','o1.refuse','Take the front route.')
positions=part(T,'- **Ask whether they still want the described empty-handed trial, with the exterior paper as an additional check.**','### Common to the trial choice only')
add('o1.test-positions','Where each person chooses to stand',positions)
edge('o1.test-discussion','o1.ask-positions','Ask whether they still want the empty-handed trial, with each free to leave by the front.','o1.test-positions')
old_setup=part(END,'### B-E04. One more occasion','#### Choice B-E04-A')
public_tail=part(old_setup,'Ada asks whether you intend to bring her to the chair again.')
public_tail='Ada asks whether you intend to bring her to the chair again. '+public_tail
public_tail=public_tail.replace('Simon says he will stay beside the camera on the room side. The Miriam without the coat says she will stay where she can see him. She asks you to say when you are going, then changes her mind.',
                               'The Miriam without the coat asks you to say when you are going, then changes her mind.')
src('o1.public-trial-discussion','The stated risk and chosen positions','Blaise told everyone that present people might forget, remain somewhere he could not reach, or be followed by people without this conversation. Each chose a position. The exterior Miriam heard Ada say he could ask her things and tell her why, then left through the front.',origin='public-second-trial-discussion')
src('o1.exterior-second-departure','The second exterior position','After the public discussion, Blaise watched the woman put on her coat and step to the bath-side wall left of the front entrance. He returned to the service passage without her.',origin='observed-second-front-departure')
src('o1.camera-start','The camera starts','Simon showed a frame containing Blaise’s lower legs, the threshold and the outside wall. Blaise agreed; Ada and Miriam stood behind it. Simon then started recording.',origin='second-trial-camera-start')
add('o1.test-ready','The camera has started',public_tail,['o1.public-trial-discussion','o1.exterior-second-departure','o1.camera-start'])
forward('o1.test-positions','o1.test-ready','Confirm the positions and go with Miriam as far as the front.',
        actions=[witness(x,'o1.public-trial-discussion') for x in ('o1.ada','o1.simon','o1.miriam','miriam_exterior')])
# Those present heard the discussion before the exterior witness departed.
# The entry action belongs to this performed scene, not the later decision.
edge('o1.test-ready','o1.cross-empty','Cross the service threshold empty-handed, knowing the present people may become unavailable to you.','o2.return',
     irreversible=True,enter='o2')
edge('o1.test-ready','o1.stop-test','Stop the test, bring Miriam back from the front, and leave together.','o1.cancel-test')

refusal=part(END,'### B-E03. Refusal: the front entrance','### B-E04. One more occasion')
refusal_open=refusal.split('#### If Blaise refused before the second-test setup')[0].strip()
refusal_reunion=part(refusal,'#### If Blaise refused before the second-test setup','#### If Blaise canceled after the exterior departure')
refusal_reunion=refusal_reunion.replace('looks beneath the bench for her shoes, then remembers they are beside her.',
                                      'looks toward the spectators\' bench for her shoe, then sees where Ada has put it beside her.')
cancel_reunion=part(refusal,'#### If Blaise canceled after the exterior departure','#### Common')
cancel_reunion=cancel_reunion.replace('looks beneath the bench for her shoes, then remembers they are beside her.',
                                    'looks toward the spectators\' bench for her shoe, then sees where Ada has put it beside her.')
refusal_shoe=part(refusal,'#### Common','#### If Blaise previously asked for the present touch')
postponed_open=refusal_open.replace('You tell Simon you are not going through. He lifts the camera from its stand and closes the small cover over its screen. It has remained off.',
                                  'Simon carries the camera beside him. He closes the small cover over its screen. It has remained off.')
postponed_reunion=refusal_reunion.replace('The Miriam with the coat lifts it from the chair.',
                                        'Miriam has freed her arm. She holds the coat by its neck and puts it over her shoulders without trying the sleeves again.')
add('o1.refuse','The front entrance',refusal_open+'\n\n'+refusal_reunion+'\n\n'+refusal_shoe,
    variants=[variant('o1.refuse.postponed',flag('o1.postponed-together'),postponed_open+'\n\n'+postponed_reunion+'\n\n'+refusal_shoe)])
cancel_start='''You tell Simon you have changed your mind. He turns the camera off and asks whether the recording so far should be kept. You say yes. Nobody asks you to state a better reason.

Ada is rolling the tape onto itself. You tell her you have decided to take the front.

“All right.”

You wait for the happiness you thought would follow. Instead you picture your hand on the service handle. Ada finishes with the tape while you stand there. You still want to know.'''
src('o1.canceled-recording','The retained setup recording','Simon stopped the camera after Blaise canceled the crossing and agreed to keep the recording of the setup. This is not a recording of a second crossing.',kind='document',origin='second-trial-camera-start')
add('o1.cancel-test','The test stopped',cancel_start+'\n\n'+refusal_open.split('\n\n',1)[1]+'\n\n'+cancel_reunion+'\n\n'+refusal_shoe,['o1.canceled-recording'])
take_arm=part(refusal,'#### If Blaise previously asked for the present touch','#### Otherwise')
no_arm=part(refusal,'#### Otherwise','#### Common')
outside_end='The two women come through '+part(refusal,'#### Common\n\nThe two women come through','Ending observation:')
outside_end=outside_end.replace('She shifts enough to let someone pass. You shift with her.',
'''She shifts enough to let someone pass. You shift with her. Your fingers start the beat against your thigh. She hears it and gives you a sideways look.

“Later,” she says.

You stop. You want there to be a later in which she can say that again and mean she is busy.''')
add('o1.outside','Which way?',no_arm+'\n\n'+outside_end,
 variants=[variant('o1.outside.arm',has('o1.requested-hand'),take_arm+'\n\n'+outside_end)])
forward('o1.refuse','o1.outside','Step onto the pavement with them.')
forward('o1.cancel-test','o1.outside','Step onto the pavement with them.')
# A final action preserves the complete ending passage before a terminal marker.
add('o1.ending-front','The minute outside','Across the road the man finally gets the pushchair into his car. Ada moves her foot to let a woman pass, then settles it beside yours.')
edge('o1.outside','o1.stand-a-minute','Stand with them a little longer.','o1.ending-front',ending=True,irreversible=True)

repeat=part(END,'### B-E05. The sentence does not finish first','## Remaining literary and implementation work')
repeat_start=repeat.split('#### If the offer was actually encountered at B-E02-B')[0].strip()
repeat_start=repeat_start.replace('You know the sentence. You let him say it.',
                                 'You wait for the lift on sight. Before he has begun, you want him to hurry. You are listening for someone at the front entrance.')
src('o2.empty-handed-return','Another entrance','Blaise crossed the service threshold without carrying the glass and next found his hand on the front handle, with the earlier room arrangement. The woman who waited at the bath-side front wall was still there.',origin='blaise-second-return')
src('o2.exterior-public-account','The public discussion she remembers','The woman at the front recalled where she had agreed to wait and the stated uncertainty about remaining outside. She had not heard the crossing itself.','statement','miriam_exterior',origin='miriam-second-exterior-continuation')
add('o2.return','The voice and the doorway',repeat_start,['o2.empty-handed-return','o2.exterior-public-account'])
promise_public_return='''“You asked me to remind you,” she says. “To tell Ada before you tried again.”

“I told her I was going to try.”

“I heard you ask us. I didn't hear you go.”

You look into the room. Ada is helping the woman by the bench. You could tell her what you promised. You would have to begin with why.'''
promise_private_return='''You almost ask whether she remembers what you said to Ada. She had been in the other room. You can remember shutting the workshop door.

You ask nothing. Inside, Ada reaches for the saucepan while the other woman stands.'''
promise_return_close='''You tap twice against the entrance handle. The sound is thin. Ada looks up.

“What?”

“Nothing you have to do.”

You take your fingers off the metal. The door is still pulling against your hand.'''
src('o2.promise-recalled','The promise she actually heard','The exterior woman recalled Blaise’s publicly stated advance-notice promise and the public discussion. She said she had not heard him cross. She did not repeat the private music conversation.','statement','miriam_exterior',parents=['o1.promise-public'])
add('o2.promise','What she can repeat',promise_private_return+'\n\n'+promise_return_close,
 variants=[variant('o2.promise.public',has('o1.promise-public','historical'),promise_public_return+'\n\n'+promise_return_close,['o2.promise-recalled'])])
forward('o2.return','o2.promise','Ask what remains of the conversation.')
offer_reply=part(repeat,'#### If the offer was actually encountered at B-E02-B','#### Otherwise')
offer_reply=offer_reply.replace('You look past her, into the room.','You turn toward the room.')
public_reply=part(repeat,'#### Otherwise','#### Common')
repeat_end='Simon repeats his question. '+part(repeat,'#### Common\n\nSimon repeats his question.','Ending observation:')
add('o2.callback','The part she did not hear',public_reply+'\n\n'+repeat_end,
 variants=[variant('o2.callback.private-offer',has('o1.ada-front-offer','historical'),offer_reply+'\n\n'+repeat_end)])
forward('o2.promise','o2.callback','Listen to the answer from the doorway.')
add('o2.ending-return','A moment at the entrance','''For a moment you keep your hand where it is. The woman at the bench looks at you.

“Please,” Ada says.

You let the closer take the door.''')
edge('o2.callback','o2.wait','Hold the entrance for this moment.','o2.ending-return',ending=True,irreversible=True)

# Apply selected bounded prose repairs after assembly. The earlier full drafts
# remain preserved; these new passages have not yet been encountered in v2.
for s in c['scenes']:
    for collection in [s,*s.get('variants',[])]:
        if s['id'].startswith('o1.'):
            collection['paragraphs']=[p.replace('your prediction','your written description').replace('the prediction','the written description') for p in collection['paragraphs']]
for choice in scenes['o1.changed-date']['choices']:
    if choice['target']=='o1.changed-date.witness':choice['label']='Stop the questions and ask the woman by the bench what she was trying to say.'
scenes['o1.changed-date.witness']['paragraphs']=paras('''You turn toward the woman by the bench. She had been trying to say something about the telephone.

“What did you want?”

She wants to call a person who will recognize her voice. She asks you not to stand beside her while she does it.

You move away.''')
for ch in scenes['o1.return']['choices']:
    ch.setdefault('effects',[]).append('o1.said-blue' if ch['target'].endswith('.blue') else 'o1.held-handle')
cal=scenes['o1.calendars']
rest=cal['paragraphs'][1:]
cal['paragraphs']=paras('''You open your hand. The pressure remains across your palm. The door is shut now because you let it shut. You keep returning to that small delay, making it larger than the second it took.

You had already known what you meant to interrupt. The others had not. You cannot put that difference aside and try the same thing again without it.''')+rest
cal['variants']=[variant('o1.calendars.blue',flag('o1.said-blue'),paras('''You can still feel the word in your mouth. Ada has answered it. You had wanted to catch her saying something she had never said before, and now she wants you to explain yourself.

You had already known what you meant to interrupt. The others had not. You cannot put that difference aside and try the same thing again without it.''')+rest,['o1.first-dates'])]

# Registered description, not a wholly blind prediction: the exterior strip had
# already been in view at the knock. Retain the original single retrieval route.
registered=part(T,'### Passage','### Choice LP-R06-A')
old_wood=scenes['o1.wood-test']['paragraphs']
start=next(i for i,p in enumerate(old_wood) if p.startswith('At the entrance your hand stops short'))
registered=registered.replace('Ada leans over his shoulder.',
                              'Ada comes to the workbench and leans over his shoulder.')
scenes['o1.wood-test']['paragraphs']=paras(registered)+['Simon stays by the box. Ada comes with you to fetch the strip from the sill.']+old_wood[start:]
for s in c['sources']:
    if s['id']=='o1.wood-prediction':
        s['title']='Description registered before collection'
        s['text']='Blaise described the remembered burn, holes and mark before collecting the strip. He had already seen the wood outside at the knock and said he could not be certain how closely he had looked then. Simon crossed out Prediction and retained the correction and old-stock alternative.'

# Preserve every literal first-night paragraph and variant, regardless of IDs.
for previous in old['scenes']:
    current=scenes['o0.'+previous['id']]
    assert current['paragraphs']==previous['paragraphs'],previous['id']
    assert [x['paragraphs'] for x in current.get('variants',[])]==[x['paragraphs'] for x in previous.get('variants',[])],previous['id']
all_ids=[s['id'] for s in c['scenes']]
assert len(all_ids)==len(set(all_ids))
for s in c['scenes']:
    for ch in s['choices']:assert ch['target'] in scenes,(s['id'],ch['target'])
    if 'paragraphIds' not in s:s['paragraphIds']=[s['id']+'.p'+str(i+1) for i in range(len(s['paragraphs']))]
    for v in s.get('variants',[]):
        if 'paragraphIds' not in v:v['paragraphIds']=[v['id']+'.p'+str(i+1) for i in range(len(v['paragraphs']))]
    for p in s['paragraphs']+[p for v in s.get('variants',[]) for p in v['paragraphs']]:
        assert not p.startswith(('Exit:','Entry:','Editorial','###','####','**','Available only','This variant')),(s['id'],p)
        assert '—' not in p,(s['id'],p)

OUT=ROOT/'src/content/case-expanded.json'
OUT.write_text(json.dumps(c,ensure_ascii=False,indent=2)+'\n')
assert hashlib.sha256(LIVE.read_bytes()).hexdigest()==LIVE_HASH
print(json.dumps({'candidate':str(OUT.relative_to(ROOT)),'sha256':hashlib.sha256(OUT.read_bytes()).hexdigest(),
                  'scenes':len(c['scenes']),'choices':sum(len(s['choices']) for s in c['scenes']),
                  'sources':len(c['sources']),'questions':len(c['questions']),
                  'status':'UNVALIDATED authored candidate; not installed; old first-night paragraphs preserved'},indent=2))
