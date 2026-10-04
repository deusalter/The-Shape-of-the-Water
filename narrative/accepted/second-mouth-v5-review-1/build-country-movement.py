"""Compile the lead's second development edition from immutable version 4.

Only this new generator writes case-v5.json. It never runs or edits the frozen
first-movement generator. Country, house and small performed joins are compiled;
the later washing, endings and bodily-return audition are deliberately absent.
"""
from pathlib import Path
import hashlib
import json
import re

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
BASE_PATH = ROOT / 'src/content/case-v4.json'
BASE_SHA = '0d20a628b21556e1ef143d9ce84773205e85987e46f059694a7c71caf5b8a25c'
assert hashlib.sha256(BASE_PATH.read_bytes()).hexdigest() == BASE_SHA
content = json.loads(BASE_PATH.read_text())
original = json.loads(BASE_PATH.read_text())
content['version'] = 5
content['title'] = 'The Second Mouth · Into the country'
C = (HERE / 'LATER-COUNTRY-FIRST-VISITS.md').read_text()
H = (HERE / 'LATER-HOUSE-THE-OPEN-LEAF.md').read_text()

def fid(x): return x if x.startswith('o0.') else 'o0.' + x
def pp(s): return [p.strip() for p in s.strip().split('\n\n') if p.strip()]
def inc(text, start, end):
    a = text.index(start)
    return pp(text[a:text.index(end, a + len(start))])
def block(text, start, end):
    a = text.index(start) + len(start)
    return pp(text[a:text.index(end, a)])
def known(id): return {'op':'hasSource','id':fid(id),'scope':'current'}
def flag(id): return {'op':'flag','id':fid(id),'scope':'current'}
def notof(arg): return {'op':'not','arg':arg}
def allof(*args): return {'op':'all','args':list(args)}
def acquire(id): return {'type':'acquireSource','sourceId':fid(id)}
def disclose(actor, id): return {'type':'disclose','characterId':fid(actor),'refId':fid(id)}
def witness(actor, id): return {'type':'witnessSource','characterId':fid(actor),'sourceId':fid(id)}
def actors_hear(actors, refs):
    return [witness(actor, ref) for actor in actors for ref in refs]

new_sources = []
def source(id, title, text, kind='observation', speaker=None, origin=None, parents=None):
    s = {'id':fid(id),'occasionId':'o0','title':title,'text':text,'kind':kind,'provenanceId':fid(origin or id)}
    if speaker: s['speakerId'] = fid(speaker)
    if parents: s['derivedFrom'] = [fid(x) for x in parents]
    new_sources.append(s)
    content['sources'].append(s)

for id, name in [('alma','Alma Norton'),('basil','Basil Boffin'),('emil','Emil Ekdal'),('rene','René Lydgate')]:
    content['characters'].append({'id':fid(id),'name':name,'occasionId':'o0','initial':{'knows':[],'believes':[],'claims':[]}})

source('rain-present','Rain at the leaf roof','Blaise and the continuing Dora reached rain beyond the ridge. Rain fell on Blaise and into the leaf roof and trough.',origin='rain-trial')
source('rain-strip-test','The responsive strip and the water','With Dora’s agreement, Blaise lifted the leaf edge so its stream missed the responsive strip. Dora reported that the effect stopped there. Lowering the edge restored the stream and her report; she then directed water toward the ditch.',origin='rain-trial')
source('cradle-marks','Two grooves on the cradle','The sling had been threaded through narrow holes. A fresh short groove with caught fibres crossed the wood between them; another groove was darker and worn smooth.',origin='cradle-material')
source('alma-account','Alma’s bounded account','Alma said René borrowed the cradle to hold a weight under the supper window while he used both hands. When she brought cakes, he said something had to answer through the room before he let go. She saw his back, not a blade or a cut. She identified the older groove as her own and the short fresh groove as absent before the loan.','statement','alma',origin='alma-memory')
source('cradle-rubbing','The checked rubbing and note','Blaise made a rubbing of both cradle grooves and the fresh splinter. Alma read the separate written account and made him add that she had not seen René cut anything. The cradle stayed with Alma.','document',parents=['cradle-marks','alma-account'])
source('cradle-loan','The borrowed cradle','After Blaise helped move both tables, Alma lent him the cradle for comparison. He promised to return it and to tell her if the evidence did not support the suspicion about René.')
source('country-mechanism-report','The physical account repeated','Blaise described the interrupted supporting paths and the installed older square, without naming a cutter or telling a listener that he had closed the mouth.','statement','blaise',parents=['p-cut','wedge-source','cast-source'])
source('orchard-tool-report','The account told to the root','Blaise described the grooves and repeated Alma’s account to the continuing Dora after returning to the root. He preserved her limit: she had not seen a blade or a cut.','statement','blaise',parents=['cradle-marks','alma-account'])
source('floor-source','The missing square in the scenery','Basil’s scenery used part of the former supper-room floor. A square was missing beneath Dora’s former place, with a repair left beside the cut and a saw overrun at one corner. Blaise did not have the removed square with him to perform a fit.',origin='source-floor-material')
source('basil-account','Basil’s account of taking the square','Basil said he held the panel while René removed the square, preserving its repair on the taken piece. He warned René not to put old material against an occupied place. He remembered an answer like “nobody left in it” but was unsure of the words.','statement','basil',origin='basil-memory')
source('floor-tracing','A tracing for a later comparison','Blaise and Dora traced the hole; Basil added the saw overrun. Blaise wrote Basil’s account separately. No direct fit with the removed square had been performed.','document',parents=['floor-source','basil-account'])
source('panel-arranged','The comparison arranged','After Blaise helped replace the scenery, Basil left the old floor on dry blocks beside the door and agreed to bring it for a direct comparison. It had not been delivered or fitted.')
source('pipe-sound','A double tone through the split pipe','Blaise’s single whistle made a second tone in the split pipe. Changing the pipe’s angle cleared the lower sound. The new tone came from the pipe; the missing cheek movement had not returned.',origin='pipe-acoustic-trial')
source('pipe-rehearsed','The part Blaise asked for','Blaise asked for the part, rehearsed the storm entrance with Basil and borrowed the pipe. He agreed to bring it before the washing came down. Dora watched the rehearsal.')
source('whistle-invitation','An invitation to return with the whistle','Blaise declined the pipe part and asked Basil to listen after he had recovered his bodily double whistle. Basil agreed; he offered the chair before the washing came down. Blaise did not promise timely recovery.','statement','basil')
source('house-report','What Blaise told Emil','Blaise described the cut direct braid, prepared older square and wedge positioned to release the remaining cord. He said the square was out of contact and both women continued. He did not include a private admission of closing the mouth.','statement','blaise',parents=['p-cut','wedge-source','cast-source','cast-removed'])
source('emil-cut-account','Emil’s eyewitness account','Emil said he travelled with René on the low carrier with his leaf’s outer strip kept active. From beneath the supper window he watched René hold the braid against a frame, wait for an answer from inside, and cut it. He did not see the installed square or wedge.','statement','emil',origin='emil-cut-memory')
source('emil-consent-account','What Emil asked to preserve','Emil said he asked René to keep the return and knew which braid was meant. René said the cut would keep the tree there while Dora could still answer through the room. Emil knew she wanted to go.','statement','emil',origin='emil-cut-memory')
source('emil-written','The account Emil checked','Emil read Blaise’s written account of his sight of the cut and its limits. He required “agreed to the replacement” to be corrected to “asked him to keep the return.” He permitted Blaise to show the checked account to both women. They had not yet received it.','document',parents=['emil-cut-account','emil-consent-account'])
source('emil-oral-offer','Emil’s offer to speak','Emil offered to repeat his account to the women, at the window or through a responsive speaking arrangement that could receive their answers. This conversation had not happened.','statement','emil',origin='emil-cut-memory')
source('emil-leaf-return','The flake and the active outer strip','Emil kept his hand on the low leaf while its mound sank and rose. A removed flake reappeared on the leaf’s edge while the loose flake remained in a dish beyond the small fold. A living band continued through the window to the plant roots; his fingers opened as the mound rose.',origin='emil-leaf-event')
source('emil-outside-account','Emil’s account of continuing','Emil said the outside band remained active while part of his bodily support returned. He could stop the return for a while, but said its answer then diminished; he declined to repeat that particular trial for Blaise.','statement','emil',origin='emil-support-account')
source('emil-earlier-control','The earlier control trial, as reported','Emil said a proposed new support could be felt when René pulled it, but did not follow Emil’s own attempt to close it. Blaise saw the drawing and crossed-out hand, but did not witness that earlier trial.','statement','emil',origin='emil-support-account')
source('emil-control-condition','A condition for a changed support','Emil said he wanted a new support he could intentionally modulate or stop, as his current support answered him. He did not insist on remaining exactly as he was.','statement','emil',origin='emil-support-account')
source('emil-relationship','The former marriage','Emil told Blaise that he and René used to be married and made things together. He described René arriving with the useful part of an answer and pressing him to agree. Noor and the women were absent.','statement','emil')
source('rene-arrival-account','René’s first reply','After Blaise said he had found the cast, René said he should have returned before supper. He claimed there had been no safe point to leave the lower return. Emil answered that there had been one and he had been there. This exchange did not confess every preparation.','statement','rene')

new_scenes = []
staging = []
def choice(id, label, target, effects=None, actions=None, when=None, ending=False, irreversible=False):
    c = {'id':fid(id),'label':label,'target':fid(target)}
    if effects: c['effects'] = [fid(x) for x in effects]
    if actions: c['actions'] = actions
    if when: c['when'] = when
    if ending: c['ending'] = True
    if irreversible: c['irreversible'] = True
    return c
def variant(id, paragraphs, when):
    return {'id':fid(id),'requires':[],'paragraphs':paragraphs,'when':when}
def scene(id, title, paragraphs, choices, src=None, area='orchard', actors=None, props=None, variants=None):
    s = {'id':fid(id),'occasionId':'o0','title':title,'paragraphs':paragraphs,'choices':choices}
    if src: s['sourceIds'] = [fid(x) for x in src]
    if variants: s['variants'] = variants
    content['scenes'].append(s)
    new_scenes.append(s)
    staging.append({'sceneId':fid(id),'area':area,'actors':actors or [],'props':props or [],'choiceIds':[c['id'] for c in choices],'variantIds':[v['id'] for v in variants or []]})

by_id = {s['id']:s for s in content['scenes']}
for id, departure, onward, label, routeflag in [
    ('leave-for-orchard','orchard-departure','orchard-roof','Walk beside the root toward the leaf roof.','country_orchard'),
    ('leave-for-dry','dry-departure','dry-rehearsal','Follow the sound into the shed-room theatre.','country_dry')
]:
    old_choice = next(c for s in content['scenes'] for c in s['choices'] if c['id'] == fid(id))
    old_choice.pop('ending',None)
    old_choice['effects'] = old_choice.get('effects',[]) + [fid(routeflag)]
    by_id[fid(departure)]['choices'] = [choice('continue-'+departure,label,onward)]

scene('orchard-roof','Forty cakes',inc(C,'The first drop goes straight down','At the lower edge of the roof'),[
    choice('follow-rain-strip','Look at the living strip beneath the leaf roof, and ask Dora before testing it.','rain-strip',actions=actors_hear(['alma','dora-orchard'],['rain-present']))
],src=['rain-present'],area='orchard-roof',actors=['blaise','alma','dora-orchard'],props=['cakes','yellow-dress','leaf-roof','rain-bowl','root-piece'])
scene('rain-strip','Toward the ditch',inc(C,'At the lower edge of the roof','There used to be a cradle here'),[
    choice('ask-about-cradle','Ask Alma where she keeps the branch cradle.','cradle-account',actions=actors_hear(['alma','dora-orchard'],['rain-strip-test']))
],src=['rain-strip-test'],area='orchard-roof',actors=['blaise','alma','dora-orchard'],props=['rain-strip','yellow-dress','cakes','root-piece'])
cradle_paras = inc(C,'There used to be a cradle here','**Choice: Make a rubbing')
scene('cradle-account','The short groove',cradle_paras,[
    choice('make-cradle-rubbing','Make a rubbing and leave the cradle for Alma. Help move the tables.','cradle-rubbing',actions=actors_hear(['alma'],['cradle-marks','alma-account'])+[disclose('alma','country-mechanism-report')]),
    choice('borrow-cradle','Ask to borrow the cradle after helping with the tables; promise to return it.','cradle-loan',actions=actors_hear(['alma'],['cradle-marks','alma-account'])+[disclose('alma','country-mechanism-report')])
],src=['cradle-marks','alma-account','country-mechanism-report'],area='orchard-cradle',actors=['blaise','alma'],props=['cradle','grooves','distant-root'])
scene('cradle-rubbing','The paper from the cakes',block(C,'**Choice: Make a rubbing and leave the cradle for Alma. Help move the tables before going.**','**Choice: Ask to borrow the cradle'),[
    choice('rubbing-to-root','Return to Dora and tell her Alma’s account, including what Alma did not see.','orchard-report',effects=['made_cradle_rubbing'],actions=actors_hear(['alma'],['cradle-rubbing']))
],src=['cradle-rubbing'],area='orchard-cradle',actors=['blaise','alma'],props=['cradle','rubbing','tables'])
scene('cradle-loan','A promise about the frame',block(C,'**Choice: Ask to borrow the cradle for the comparison, after helping with the tables. Promise to return it.**','When you get back to the root'),[
    choice('loan-to-root','Carry the cradle back to Dora and tell her Alma’s account with its limits.','orchard-report',effects=['borrowed_cradle'],actions=actors_hear(['alma'],['cradle-loan']))
],src=['cradle-loan'],area='orchard-cradle',actors=['blaise','alma'],props=['carried-cradle','tables'])
report_tail = inc(C,'Alma has folded two cakes','The scene establishes current rain')
report_common = pp('''When you get back to the root, Dora asks what kept you. You repeat Alma's account: René asked for the cradle, waited for an answer through the room, and returned it altered. Alma saw his back, not a blade or a cut. You describe the two grooves.''')
scene('orchard-report','What she did not see',report_common+pp('''You describe the rubbing. Dora cannot borrow your eyes to read its marks. The actual cradle has stayed beneath Alma's table.''')+report_tail,[
    choice('tell-orchard-departure','Tell Dora you mean to visit the low house.','orchard-house-departure',actions=[disclose('dora-orchard','orchard-tool-report')])
],src=['orchard-tool-report'],area='orchard-root',actors=['blaise','dora-orchard','alma'],props=['root-piece','cakes','rubbing'],variants=[
    variant('orchard-report-with-cradle',report_common+pp('''You offer the cradle's crosspiece to the active tissue. Dora feels the fresh groove and the wider smooth one. You keep its weight in your hands until she has finished; she cannot see the fibres merely because you can.''')+report_tail,known('cradle-loan'))
])
orchard_departure = pp('''“I'm going to the low house,” you tell Dora. “To ask what he was keeping there.”

“I'll stay by this,” she says. The strip lifts another small sheet of water toward the ditch. “Tell me when you come back.”

Alma puts the bowl where Dora can fill it without wetting the dress. You leave the rooted speaking piece seated. Its voice grows harder to hear under the rain as you take the path between the split trees.''')
scene('orchard-house-departure','The low house',orchard_departure,[choice('orchard-reach-house','Walk to the house beyond the split trees.','house-window')],area='orchard-path',actors=['blaise'],props=['cakes'],variants=[
    variant('orchard-departure-with-frame',orchard_departure+pp('''You carry the cradle by its broad edge, away from the fresh groove. Alma's two cakes are wrapped beside the handle.'''),known('cradle-loan'))
])

scene('dry-rehearsal','The storm comes early',inc(C,'The country below supper is full of doors','On trestles, with the unpainted side upward'),[
    choice('inspect-source-floor','Look at the old floor exposed behind Basil’s scenery.','source-floor')
],area='theatre',actors=['blaise','dora-table','basil'],props=['painting','seed-tray','mountain-panel'])
floor_paras=inc(C,'On trestles, with the unpainted side upward','**Choice: Trace the hole')
scene('source-floor','The missing square',floor_paras,[
    choice('trace-floor','Trace the hole for a later comparison; leave the scenery here.','floor-tracing',actions=actors_hear(['basil','dora-table'],['floor-source','basil-account'])+[disclose('basil','country-mechanism-report')]),
    choice('arrange-panel','Ask Basil to bring the panel for comparison after helping replace his scenery.','panel-arrangement',actions=actors_hear(['basil','dora-table'],['floor-source','basil-account'])+[disclose('basil','country-mechanism-report')])
],src=['floor-source','basil-account','country-mechanism-report'],area='theatre-floor',actors=['blaise','dora-table','basil'],props=['floor-panel','repair-edge','saw-overrun','painting'])
scene('floor-tracing','A shape on paper',block(C,'**Choice: Trace the hole and its repair for a later comparison. Leave Basil\'s scenery here.**','**Choice: Ask Basil to bring the panel'),[
    choice('tracing-to-pipe','Help Basil finish putting the brushes away.','pipe-discovery',effects=['made_floor_tracing'],actions=actors_hear(['basil','dora-table'],['floor-tracing']))
],src=['floor-tracing'],area='theatre-floor',actors=['blaise','dora-table','basil'],props=['floor-panel','tracing','painting'])
panel_arrangement = block(C,'**Choice: Ask Basil to bring the panel for a direct comparison, after helping him replace the scenery.**','While he puts his brushes away')
panel_arrangement[-1] = 'You help put it on the trestles. He makes you clean the charcoal from your hands before touching the white paint. He leaves the old floor on dry blocks beside the door and says he will bring it for the comparison.'
scene('panel-arrangement','The sea can be a noise',panel_arrangement,[
    choice('panel-to-pipe','Help Basil finish putting the brushes away.','pipe-discovery',effects=['arranged_panel'],actions=actors_hear(['basil','dora-table'],['panel-arranged']))
],src=['panel-arranged'],area='theatre',actors=['blaise','dora-table','basil'],props=['floor-on-blocks','replacement-scenery','painting'])
scene('pipe-discovery','The second sound',inc(C,'While he puts his brushes away','**Choice: Ask for the part.'),[
    choice('accept-pipe-part','Ask for the part, borrow the pipe and rehearse the entrance with Basil.','pipe-rehearsal',actions=actors_hear(['basil','dora-table'],['pipe-sound'])),
    choice('prefer-bodily-whistle','Decline the pipe part; ask Basil to listen when you recover your own whistle.','whistle-invitation',actions=actors_hear(['basil','dora-table'],['pipe-sound']))
],src=['pipe-sound'],area='theatre',actors=['blaise','dora-table','basil'],props=['split-pipe','painting'])
scene('pipe-rehearsal','Let me finish',block(C,'**Choice: Ask for the part. Borrow the pipe and try the entrance with Basil now.**','**Choice: Decline the pipe part.'),[
    choice('rehearsal-next','Put the borrowed pipe in your pocket and ask where René took the strips.','dry-house-lead',effects=['borrowed_pipe','promised_performance'],actions=actors_hear(['basil','dora-table'],['pipe-rehearsed']))
],src=['pipe-rehearsed'],area='theatre-stage',actors=['blaise','dora-table','basil'],props=['split-pipe','stage-chair','mountain-panel','painting'])
scene('whistle-invitation','When I can',block(C,'**Choice: Decline the pipe part. Ask Basil to listen when you have recovered your own double whistle.**','*The first route establishes'),[
    choice('invitation-next','Ask where René took the strips.','dry-house-lead',effects=['invited_whistle'],actions=actors_hear(['basil','dora-table'],['whistle-invitation']))
],src=['whistle-invitation'],area='theatre',actors=['blaise','dora-table','basil'],props=['pipe-with-basil','painting'])
dry_lead=inc(C,'He tells you René also took three clean strips','This route establishes a material provenance hypothesis')
# The source audition's departure initially takes the picture toward the curtain.
# The following performed join lets Dora choose to remain; it does not make
# Blaise carry either her picture or the distant cast to the house.
scene('dry-house-lead','A wall for the blue room',dry_lead,[choice('tell-dry-departure','Tell Dora you mean to visit the low house.','dry-house-departure')],area='theatre-door',actors=['blaise','dora-table','basil'],props=['painting','seed-tray'])
scene('dry-house-departure','Stay with the picture',pp('''“I'm going to the low house,” you tell Dora. “He may be there.”

She looks at the painting in her hands, then at the wall Basil has cleared beside the platform.

“I'll put this up first. Tell me what you find.”

“Do you want me to wait?”

“No. I want to try it higher.”

She carries it back across the room. Basil holds it still while she raises the picture. You leave with the lamp. The source floor stays here; the square taken from it is still on the supper room's dry ledge.'''),[
    choice('dry-reach-house','Walk to the house beyond the split trees.','house-window')
],area='theatre-door',actors=['blaise','dora-table','basil'],props=['painting-on-wall','lamp-with-blaise'])

house_window = inc(H,'The smaller roof has settled','You tell him about the supper room.')
house_with_cradle = list(house_window)
pot_index = next(i for i,p in enumerate(house_with_cradle) if p.startswith('You hold the pot'))
house_with_cradle.insert(pot_index,'You set the borrowed cradle and wrapped cakes beneath the roof overhang, beside the step, before reaching for the pot. The frame stays clear of the doorway.')
house_with_lamp = list(house_window)
house_with_lamp.insert(pot_index,'You put the lamp beneath the roof overhang, clear of the slow door, before taking the pot.')
scene('house-window','Two roofs',house_window,[
    choice('tell-emil-mechanism','Tell Emil about the cut braid, placed square and prepared release.','emil-account',actions=[acquire('house-report'),disclose('emil','house-report')])
],area='house',actors=['blaise','emil'],props=['window-plant','open-leaf','dishes','two-chairs'],variants=[variant('house-window-with-cradle',house_with_cradle,known('cradle-loan')),variant('house-window-with-lamp',house_with_lamp,flag('country_dry'))])
account_intro=pp('''You tell Emil that the direct braid had been cut. An older square was placed beneath Dora's occupied seat, and a wedge was positioned to draw the remaining cord out of the mouth. Noor has lifted the square clear. Both women are continuing in separate places.''')
scene('emil-account','What he saw',account_intro+inc(H,'Emil lets you finish.','## What he agreed to'),[
    choice('write-emil-account','Write his account and ask him to check the exact words.','account-written',actions=actors_hear(['emil'],['emil-cut-account','emil-consent-account'])),
    choice('keep-emil-oral','Keep it oral for now; ask whether he will repeat it to the women.','account-oral',actions=actors_hear(['emil'],['emil-cut-account','emil-consent-account']))
],src=['emil-cut-account','emil-consent-account'],area='house',actors=['blaise','emil'],props=['open-leaf','flake-dish','window-plant'])
scene('account-written','The sentence he changes',block(H,'**Choice: Write his account. Ask him to read the exact words before you take them away.**','**Choice: Keep the conversation oral'),[
    choice('written-to-leaf','Put away the checked account and ask Emil about the answering leaf.','leaf-return',effects=['emil_account_written'],actions=actors_hear(['emil'],['emil-written']))
],src=['emil-written'],area='house',actors=['blaise','emil'],props=['written-account','open-leaf','flake-dish'])
scene('account-oral','He will say it himself',block(H,'**Choice: Keep the conversation oral for now. Ask whether he will repeat it to the women whose bodies were involved.**','*The written route produces'),[
    choice('oral-to-leaf','Ask Emil about the answering leaf.','leaf-return',effects=['emil_account_oral'],actions=actors_hear(['emil'],['emil-oral-offer']))
],src=['emil-oral-offer'],area='house',actors=['blaise','emil'],props=['open-leaf','flake-dish'])
scene('leaf-return','Burnt fruit',inc(H,'Emil lifts his wrist.','## The control he wants'),[
    choice('ask-emil-drawing','Ask about the drawing beneath his bowl.','emil-control',actions=actors_hear(['emil'],['emil-leaf-return','emil-outside-account']))
],src=['emil-leaf-return','emil-outside-account'],area='house',actors=['blaise','emil'],props=['open-leaf','window-band','two-flakes','fruit-jar'])
scene('emil-control','Where he can stop it',inc(H,'There is a drawing under his bowl.','Someone is trying the door.'),[
    choice('wait-house-door','Stay beside Emil as the door begins to open.','house-door',actions=actors_hear(['emil'],['emil-earlier-control','emil-control-condition','emil-relationship']))
],src=['emil-earlier-control','emil-control-condition','emil-relationship'],area='house',actors=['blaise','emil'],props=['drawing','open-leaf','fruit-jar'])
scene('house-door','The clean strips',inc(H,'Someone is trying the door.','You say you found the cast.'),[
    choice('tell-rene-cast','Tell René you found the installed cast.','rene-arrival',ending=True,actions=[acquire('rene-arrival-account')]+actors_hear(['emil','rene'],['rene-arrival-account']))
],area='house',actors=['blaise','emil','rene'],props=['clean-strips','open-leaf','flake-dish'])
scene('rene-arrival','The chair he takes',inc(H,'You say you found the cast.','## Where the investigation goes next'),[],src=['rene-arrival-account'],area='house',actors=['blaise','emil','rene'],props=['rene-seated','clean-strips','fruit-jar'])

def reading(id,title,text,refs):
    content['interpretationRules'].append({'id':fid(id),'occasionId':'o0','title':title,'text':text,'when':allof(*[known(r) for r in refs]),'relatedRefs':[fid(r) for r in refs]})
reading('rain-reconsidered','Beyond the white ridge','The rain Dora reported can now be compared with rain I encountered and the effect of diverting the stream from her responsive strip. This gives me a particular connection to test again.',['rain-claim','rain-present','rain-strip-test'])
reading('floor-to-cast','A square to compare','The source floor and the installed square both have an old repair and a cut edge to inspect. Remembering the notch gives me a reason to put the material together; it has not performed the fit.',['cast-source','floor-source'])
reading('emil-and-cut','The name beside the frame','Emil says he watched René make the cut after waiting for an answer from the room. His account names a person at the physical interruption I inspected. He also says he asked for the return to be kept.',['p-cut','emil-cut-account','emil-consent-account'])

# Preserve all frozen first-movement paragraphs/variants. Only the two former
# chapter departures cease to be terminal, and receive performed onward choices.
for old in original['scenes']:
    new = next(s for s in content['scenes'] if s['id']==old['id'])
    assert new['paragraphs']==old['paragraphs'],old['id']
    assert new.get('variants')==old.get('variants'),old['id']
for s in new_scenes:
    for p in s['paragraphs'] + [p for v in s.get('variants',[]) for p in v['paragraphs']]:
        assert not p.startswith(('**Choice:','*The ','*Both ','Present:','Source delivered:')), (s['id'],p)
        assert '—' not in p,(s['id'],p)
        assert 'on either route' not in p.lower(),(s['id'],p)

out = ROOT / 'src/content/case-v5.json'
out.write_text(json.dumps(content,ensure_ascii=False,indent=2)+'\n')
sha = hashlib.sha256(out.read_bytes()).hexdigest()
(HERE/'STAGING-V5.json').write_text(json.dumps({'status':'New country/house entries only; frozen v4 profiles still stage unchanged first passages. End-of-passage positions; audience is separately authored in runtime actions.','contentSha256':sha,'newScenes':staging,'routeLimits':{'orchardPrivate':'Blaise and Alma speak at distant cradle tables while Dora stays at the trough under rain. Only explicit orchard-report gives her this account.','dry':'Only table Dora, Basil and Blaise attend. Noor and orchard Dora hear none of it.','house':'Only Emil and Blaise until house-door. Rene does not hear preceding private testimony or former-marriage confidence.'}},ensure_ascii=False,indent=2)+'\n')
manuscript=['# Version 5: Into the country','Compiled development text. Alternative passages and author state IDs are shown for review; this is not a single route.']
for s in content['scenes']:
    manuscript += ['## '+s['id']+' · '+s['title'],*s['paragraphs']]
    for v in s.get('variants',[]):manuscript += ['### Variant '+v['id'],*v['paragraphs']]
    if s['choices']:manuscript += ['Choices:']+[f"- {c['id']}: {c['label']} → {c['target']}" for c in s['choices']]
(HERE/'MANUSCRIPT-V5.md').write_text('\n\n'.join(manuscript)+'\n')
meta={'status':'Lead candidate for validation; not installed or owner-approved. First country journey and house boundary, not full game.','contentSha256':sha,'baseSha256':BASE_SHA,'sceneCount':len(content['scenes']),'newSceneCount':len(new_scenes),'choiceCount':sum(len(s['choices']) for s in content['scenes']),'sourceCount':len(content['sources']),'questionCount':len(content['questions']),'rawStoredBaseParagraphWords':sum(len(re.findall(r"\b\w+(?:['’]\w+)*\b",p)) for s in content['scenes'] for p in s['paragraphs']),'newSceneIds':[s['id'] for s in new_scenes],'notIncluded':['Washing/Ethics V encounter','First deliberate bodily return audition','Either whole-game ending','Physical tool/panel fit and full culprit confrontation']}
(HERE/'BUILD-V5.json').write_text(json.dumps(meta,ensure_ascii=False,indent=2)+'\n')
print(json.dumps(meta,ensure_ascii=False,indent=2))
