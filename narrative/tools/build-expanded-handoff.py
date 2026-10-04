"""Derive a review manuscript, scene/staging index and honest word counts.

Author-side files only. Coordinates/rendering belong to root. This is not an
engine adapter and must not be imported as player-visible hidden content.
"""
raise SystemExit('Bath candidate is archived after owner rejection. See narrative/archived/bath-candidate-2026-10-04/ARCHIVE-STATUS.json. New world foundation pending reference research.')
from pathlib import Path
import hashlib
import json
import re

ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'narrative/loop'
case=ROOT/'src/content/case-expanded.json'
c=json.loads(case.read_text())
sha=hashlib.sha256(case.read_bytes()).hexdigest()
route=json.loads((OUT/'EXPANDED-ROUTE-CHECK.json').read_text())
assert route['caseSha256']==sha and route['status']=='PASS'
wc=lambda s:len(re.findall(r'\b\w+(?:[’\'-]\w+)*\b',s))
dump=lambda p,v:p.write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n')

# Exact all-variant reading copy; mutually exclusive text remains labeled.
lines=['# Expanded candidate manuscript', '',
       f'Content `{c["id"]}`, version {c["version"]}, file SHA-256 `{sha}`.', '',
       'Lead-selected integration candidate. This all-variant manuscript is not one played route. '
       'The JSON is authoritative; captured actual routes are in `expanded-readings/`. '
       'No human timing, owner approval or full-game completion is claimed.','']
for s in c['scenes']:
    lines += [f'## {s["id"]}: {s["title"]}', '', '\n\n'.join(s['paragraphs']),'']
    for v in s.get('variants',[]):
        lines += [f'### Alternative {v["id"]}', '',
                  'Guard: `'+json.dumps(v.get('when',{'requires':v.get('requires',[]),'unless':v.get('unless',[])}),ensure_ascii=False,separators=(',',':'))+'`','',
                  '\n\n'.join(v['paragraphs']),'']
    if s.get('sourceIds'):lines += ['Encountered sources: '+', '.join('`'+x+'`' for x in s['sourceIds'])+'.','']
    if s['choices']:
        lines += ['### Actions','']
        for ch in s['choices']:
            labels=[]
            if ch.get('irreversible'):labels.append('confirmation')
            if ch.get('ending'):labels.append('ending')
            if ch.get('enterOccasion'):labels.append('enters '+ch['enterOccasion'])
            lines += [f'- `{ch["id"]}`: {ch["label"]} → `{ch["target"]}`'+(' ['+', '.join(labels)+']' if labels else '')]
        lines.append('')
(OUT/'MANUSCRIPT-EXPANDED-CANDIDATE.md').write_text('\n'.join(lines))

all_paras=[p for s in c['scenes'] for item in [s,*s.get('variants',[])] for p in item['paragraphs']]
counts={
 'caseSha256':sha,'status':'Actual passage counts; no timing test',
 'method':'Words use Unicode word boundaries with internal apostrophes/hyphens. Stored totals include mutually exclusive alternatives. Actual route counts below come from captured engine passage records; choice labels, notebook text, research, pauses and other routes are excluded.',
 'basePassageWords':sum(wc(p) for s in c['scenes'] for p in s['paragraphs']),
 'storedAllVariantPassageWords':sum(wc(p) for p in all_paras),
 'uniqueParagraphWords':sum(wc(p) for p in set(all_paras)),
 'choiceLabelWords':sum(wc(ch['label']) for s in c['scenes'] for ch in s['choices']),
 'executedRoutes':route['routes'],
 'readingOnlyMinuteAssumptions':[{'wordsPerMinute':rate,'shortestCheckedRouteMinutes':round(min(r['passageWords'] for r in route['routes'])/rate,1),'longestCheckedRouteMinutes':round(max(r['passageWords'] for r in route['routes'])/rate,1)} for rate in [150,200,250]],
 'target':'4–6 hours first playthrough, unverified and not met by the current reading-only estimates. Interaction time has not been measured or invented to close the gap.',
 'limits':['Four authored routes, not maximum/minimum proofs or exhaustive reachability.','Repeated encountered hubs count as encountered text, not new authored material.','No simultaneous sum of exclusive alternatives or replayed whole routes as first-play duration.','No human playtest.']}
dump(OUT/'EXPANDED-WORD-COUNTS.json',counts)

# Semantic staging at the current passage's settled point. Narrative-internal
# movements are recorded separately below; no renderer movement grants evidence.
anchors={'entrance':'frontInterior','street-front':'frontExterior','street-opposite':'laundryWaiting',
 'concourse':'gathering','spectators-bench':'bench','shallow-water':'waterChairs',
 'workshop':'workshop','workshop-doorway':'workshopDoorway','gallery':'gallery','cabinet':'cabinet',
 'service-passage':'serviceInterior','service-yard':'yard','changing-passage':'changingPassage'}
def actor(id,area,pose='standing',note=None):
    v={'id':id,'area':area,'pose':pose}
    if note:v['note']=note
    return v
def setup(area,actors=(),privacy=None,note=None):
    v={'focusArea':area,'actors':list(actors)}
    if privacy:v['audienceLimit']=privacy
    if note:v['note']=note
    return v
stages={}
def group(prefix,area,actors=(),privacy=None,note=None):
    for s in c['scenes']:
        if s['id']==prefix or s['id'].startswith(prefix+'.'):
            stages[s['id']]=setup(area,actors,privacy,note)
def at(occ,name,area,pose='standing',note=None):return actor(occ+'.'+name,area,pose,note)

# Frozen first-night bodies are namespaced only. Root may keep their existing
# visual offsets, but should preserve the explicitly different private audiences.
old_areas={'arrival':'entrance','bench':'spectators-bench','workshop':'workshop','cabinet':'cabinet',
 'gallery':'gallery','concourse':'concourse','release':'cabinet','recording':'gallery',
 'simon_account':'gallery','miriam_account':'spectators-bench','ada_miriam':'workshop','simon_ada':'gallery',
 'miriam_private':'spectators-bench','shared':'concourse','optics':'cabinet','report':'concourse',
 'public_account':'concourse','private_account':'concourse','continuation':'concourse','supper':'concourse',
 'leave':'entrance','finding_notebook':'concourse'}
for key,area in old_areas.items():
    names= {'arrival':['ada','simon','miriam'],'bench':['ada','miriam'],'workshop':['ada'],
            'gallery':['simon','miriam'],'release':['ada','simon'],'recording':['simon'],
            'simon_account':['simon'],'miriam_account':['miriam'],'ada_miriam':['ada','miriam'],
            'simon_ada':['simon','ada'],'miriam_private':['miriam'],'shared':['ada','simon','miriam'],
            'optics':['ada','simon','miriam'],'report':['ada','simon','miriam'],
            'public_account':['ada','simon','miriam'],'private_account':['ada','simon','miriam'],
            'continuation':['ada','simon','miriam'],'supper':['ada','simon','miriam']}.get(key,[])
    placements=[at('o0',n,area) for n in names]
    if key=='arrival':placements=[at('o0','ada','concourse','seated','On the upturned bucket with the saucepan.'),at('o0','simon','cabinet'),at('o0','miriam','spectators-bench','seated')]
    stages['o0.'+key]=setup(area,placements,'Use only the actual spoken audience in the preserved passage. Private conversations do not broadcast across the room.', 'Original first-night prose is unchanged. Existing per-scene visual refinements may be retained.')

group('o0.sunday','entrance',[at('o0','ada','entrance'),at('o0','simon','cabinet')],note='Begins at front doors and moves into bath. Miriam, Emmy and Ruth have not arrived in this Sunday sequence yet.')
group('o0.emmy-arrival','entrance',[at('o0',n,'entrance') for n in ['ada','simon','emmy']],note='Emmy’s unnamed son is a background person. Ada takes him toward the ball during the private factual account; do not turn his presence into hearing it.')
group('o0.emmy-tea','workshop',[at('o0',n,'workshop') for n in ['ada','simon','emmy']],note='Ada and the boy leave to retrieve the ball. Only the witnessed segment is heard by Blaise.')
for key in ['ruth-print','camera-conditions','control-result']:
    group('o0.'+key,'cabinet',[at('o0',n,'cabinet','seated' if n=='ruth' else 'standing') for n in ['ada','simon','miriam','emmy','ruth']],note='Open optical model near cabinet, not confinement. Ruth goes to change during the controls; do not keep her in later dialogue as a witness.')
for key in ['layout','layout-folder','picture-finding']:
    group('o0.'+key,'workshop',[at('o0',n,'workshop') for n in ['simon','emmy']],note='Laptop comparison; Ada is within call from coin-box work, not automatically a recipient of every private reply. Miriam goes to prepare the lesson.')
group('o0.lesson','shallow-water',[at('o0','miriam','shallow-water','standing','In shallow water, taped fingers kept clear.'),at('o0','ruth','shallow-water','standing','At the rail; neither bath depth nor body dimensions are forensic measurements.'),at('o0','simon','shallow-water','seated','Leaves with chair when Ruth asks.')])
for key in ['lesson.leave','lesson.towel']:
    stages['o0.'+key]=setup('changing-passage',[at('o0','miriam','shallow-water'),at('o0','ruth','shallow-water')],'Blaise cannot see the final swimming attempt. Sounds do not reveal their cause or exact distance.')
for key in ['three-tiles','teacher-question','teacher-reply']:
    group('o0.'+key,'shallow-water',[at('o0','miriam','shallow-water')],'Only Miriam receives the optional file finding. Ruth gives her three-tiles report before leaving; private lesson is not retroactively visible.')
group('o0.sunday-late','concourse',[at('o0','simon','entrance'),at('o0','ada','shallow-water')],note='Emmy/son and Ruth have actually left by the end of this passage. Miriam dries her hair off to the changing passage.')
group('o0.two-breaths','shallow-water',[at('o0','ada','shallow-water','seated'),at('o0','miriam','entrance')],'Miriam sees the chair/contact from the concourse but cannot reliably hear the exact words. Do not place her beside the chairs.')
group('o0.bearers','entrance',[at('o0','simon','service-passage'),at('o0','miriam','street-opposite')],note='Performs wood pickup in workshop, marked-strip preparation, front-sill placement and Miriam crossing the road. Only one Miriam is visible. Snapshot occurs on the onward action after this witnessed departure.')
group('o0.parcel','service-passage',[at('o0','simon','service-passage'),at('o0','ada','concourse'),at('o0','miriam','street-opposite')],'Exterior Miriam cannot see service yard or hear an exact crossing account. Her separate persistent runtime target remains unexposed before the co-presence scene.', 'Choice o0.carry-through is ordinary, with no spoiler confirmation. Free walking is not an unauthored trial.')

for occ in ['o1','o2']:
    group(occ+'.return','entrance',[at(occ,'ada','concourse','seated','Bucket and saucepan.'),at(occ,'simon','cabinet'),at(occ,'miriam','spectators-bench','seated')],note='Exact anchor after phone is turned facedown. Rabbit, glass, peas and wet sock repeat. No current message/photo source is visible.')
group('o1.calendars','spectators-bench',[at('o1',n,'spectators-bench') for n in ['ada','simon','miriam']])
group('o1.ada-chair','workshop',[at('o1','ada','workshop')],'Blaise and Ada hear the chosen reply; exterior witness is still outside. Requested hand is optional.')
group('o1.camera-offer','workshop',[at('o1','ada','workshop'),at('o1','simon','workshop-doorway')],note='Faulty chair turned to wall. Spare camera only offered, not recording.')
group('o1.knock','entrance',[at('o1','ada','spectators-bench'),at('o1','simon','entrance'),at('o1','miriam','spectators-bench','seated'),actor('miriam_exterior','entrance','seated','From the exterior into a sound chair on the mat during this passage.')],note='First visible co-presence. Use identical Miriam geometry/materials, independent placements. Camera off on mat. Exterior marked strip already visible on sill, limiting later prediction.')
for key in ['two-cups','changed-date']:
    group('o1.'+key,'spectators-bench',[at('o1',n,'spectators-bench') for n in ['ada','simon','miriam']]+[actor('miriam_exterior','spectators-bench','seated','Independent chair; coat taken off/folded in changed-date.')],note='Two independently responding bodies/cups/coats, no ghost palette. Three phone date screens change without an observed transition.')
stages['o1.changed-date.alone']=setup('workshop',[at('o1','simon','workshop'),at('o1','ada','spectators-bench'),at('o1','miriam','spectators-bench'),actor('miriam_exterior','spectators-bench')],'Women ask for private interval; Ada sits by window. Blaise and Simon cannot hear it.')
for key in ['wood-test','wood-result']:
    group('o1.'+key,'workshop',[at('o1','ada','workshop'),at('o1','simon','workshop'),actor('miriam_exterior','workshop')],note='Includes performed front retrieval with Ada while Simon stays by box, then all compare. Exterior woman identifies wood and leaves. No circle or carried-paper test.')
for key in ['middle-water','water-hand','water-leave','water-return','name-offered']:
    group('o1.'+key,'shallow-water',[at('o1','miriam','shallow-water','seated')],'Only the interior Miriam hears the chosen old-confidence/lift disclosure or gives the new kitchen anecdote. Ada/exterior Miriam private in workshop when the passage says so.')
for key in ['middle-bread','bread-thanks']:
    group('o1.'+key,'workshop',[actor('miriam_exterior','workshop')],'Exterior Miriam speaks to Blaise. Later she asks Ada for a private interval; player departs before its contents. No synchronized knowledge with the woman at the water.')
stages['o1.name-offered.sight']=setup('changing-passage',[at('o1','miriam','shallow-water')],'Blaise moves until the call is private. He sees some movement, not the recipient or reply.')
stages['o1.name-offered.leave']=setup('concourse',[at('o1','miriam','shallow-water')],'Blaise leaves the call. No secretly acquired recipient, number or reply.')
for key in ['two-at-bench','bench-thanks','middle-close']:
    group('o1.'+key,'spectators-bench',[at('o1','miriam','spectators-bench','seated'),actor('miriam_exterior','spectators-bench','seated')],note='Coat, shoe and towel distinguish actual positions. Ada returns with towel in middle-close and removes the sound chair. The wet sock remains worn.')
for key in ['allowed','intention','paper-cup']:
    group('o1.'+key,'workshop-doorway',[at('o1','simon','workshop-doorway'),at('o1','miriam','workshop-doorway'),actor('miriam_exterior','spectators-bench','seated')],'God/intellectual-love conversation includes interior Miriam only. Exterior woman at bench is not automatically a listener.', 'Small table outside workshop. Simon carries existing strips/description. Ada passes with bucket and enters workshop.')
group('o1.keep-time','workshop',[at('o1','ada','workshop'),at('o1','simon','concourse')],'Simon hears only the end of the music, then takes strips and paper out through the closed workshop door. Private admission has not begun while he is present.')
for key in ['music-advantage','music-loss','promise-private']:
    group('o1.'+key,'workshop',[at('o1','ada','workshop')],'Closed-door private conversation. Neither Miriam nor Simon hears the confession, God question or original promise.')
for key in ['promise-audience','promise-kept-private']:
    group('o1.'+key,'workshop',[at('o1','ada','workshop'),at('o1','miriam','workshop'),actor('miriam_exterior','workshop')],'Women have entered for cheese/cloth, not heard the preceding private conversation.')
group('o1.promise-told','workshop',[at('o1',n,'workshop') for n in ['ada','simon','miriam']]+[actor('miriam_exterior','workshop')],'Simon is called back. Only the limited advance-notice promise is stated to everyone.')
for key in ['before-going','eternity','dressing']:
    group('o1.'+key,'workshop',[at('o1','ada','workshop'),at('o1','simon','workshop'),at('o1','miriam','workshop','seated','Near door; peas/damp sock.'),actor('miriam_exterior','workshop','seated','Near sink; coat on chair.')],note='Separate opposite ends of table, separate hands. Historical chair observation is heard here, no unheard words. No actor is labeled original/copy.')
for key in ['last-test','ada-front-offer','route-decision']:
    group('o1.'+key,'service-passage',[at('o1','ada','service-passage'),at('o1','simon','service-passage'),at('o1','miriam','workshop'),actor('miriam_exterior','workshop')],'Exterior witness does not hear optional private Ada invitation by washbasin.', 'Camera off; lower-leg framing/recording permission not yet given. Door open with block, yard visible; no automatic walking trigger.')
for key in ['test-discussion','test-positions','postpone']:
    group('o1.'+key,'service-passage',[at('o1',n,'service-passage') for n in ['ada','simon','miriam']]+[actor('miriam_exterior','service-passage')],note='All hear strongest availability risk and choose positions. Postpone takes front without a service trial; coat wrong-sleeve/off-camera movement survives into refusal variant.')
group('o1.test-ready','service-passage',[at('o1',n,'service-passage') for n in ['ada','simon','miriam']]+[actor('miriam_exterior','street-front','standing','Bath-side wall left of entrance, a different position from first wait across road.')],'Exterior woman hears public Ada answer before departure; she cannot hear final decision or crossing after Blaise returns inside.', 'Perform front escort and return, camera framing permission/start, then offer confirmed crossing or cancellation. Freeze on this settled arrangement without executing either action.')
for key in ['refuse','cancel-test']:
    group('o1.'+key,'entrance',[at('o1',n,'entrance') for n in ['ada','simon','miriam']]+[actor('miriam_exterior','entrance')],note='Passage performs workshop reunion then front crossing. Cancellation actually fetches exterior witness first. Postponed refusal preserves carried camera/coat; ordinary refusal takes coat from chair. Both women depart.')
for key in ['outside','ending-front']:
    group('o1.'+key,'street-front',[at('o1',n,'street-front') for n in ['ada','simon','miriam']]+[actor('miriam_exterior','street-front')],note='Both Miriams, present Ada, Simon and Blaise together on bath-side pavement. Laundry is opposite. Two strips carried separately. No o2 and no everyone-outside service experiment.')
for key in ['return','promise']:
    stages['o2.'+key]=setup('entrance',[at('o2','ada','spectators-bench'),at('o2','simon','concourse'),at('o2','miriam','spectators-bench'),actor('miriam_exterior','street-front')],'Exterior witness recalls only actual prior public words; renewed interior actors have not heard prior music or confidences.', 'Begin with anchor, then open front to meet retained witness in actual agreed bath-side position. Empty hands, no retained paper/clip acquired.')
for key in ['callback','ending-return']:
    group('o2.'+key,'entrance',[at('o2','ada','spectators-bench'),at('o2','simon','entrance'),at('o2','miriam','spectators-bench'),actor('miriam_exterior','entrance')],note='Exterior woman asks to enter; present bench woman says wait. Distinct models remain. Door closes in final short passage; this is no service crossing or mechanism proof.')

assert set(stages)=={s['id'] for s in c['scenes']},set(s['id'] for s in c['scenes'])-set(stages)
dump(OUT/'EXPANDED-STAGING.json',{
 'caseSha256':sha,'status':'Author staging requirements; root owns coordinate mapping and actual 3D/browser verification',
 'semanticAreaToRootAnchor':anchors,
 'newAnchorNeeds':['workshopDoorway: small table immediately outside enclosed workshop, off walking path','changingPassage: out of direct view of private shallow-end lesson/call'],
 'globalRules':['Use identical Miriam base geometry/materials; distinguish current position, movement and coat without fake/original or ghost coding.',
 'Scenes describe settled positions plus performed transitions. A renderer cannot decide what a person heard by distance alone or grant source knowledge.',
 'Do not reveal exterior Miriam before o1.knock; o0.bearers shows only the one departing woman. Hide unencountered Emmy and Ruth until their actual arrival.',
 'Front street and opposite laundry have no sightline into west service yard. Second exterior position is bath-side, not beneath opposite laundry.',
 'Both service crossings are authored choices, not consequences of ordinary avatar motion. First no spoiler modal; second current confirmation required.',
 'Interior figures use current occasion IDs; exterior actor persists. Names and exact mesh identity never merge knowledge.',
 'Do not show the film, page, mark, private call recipient or phone message as examined solely because a prop is rendered. Source acquisition is authored.',
 'No geometry dimension, pixel image or visual hidden-object change is a new forensic observation unless prose/engine explicitly acquires it.'],
 'scenes':[{'sceneId':s['id'],'occasionId':s['occasionId'],**stages[s['id']]} for s in c['scenes']]})

inputs=['narrative/tools/build-expanded-case.py','narrative/tools/check-expanded-case.mjs','narrative/loop/CROSS-TEAM-SELECTION-L5.md',
 'narrative/loop/BLAISE-FIRST-RETURN.md','narrative/loop/RETURN-INVESTIGATION-L3.md','narrative/loop/LIVED-MIDDLE-L4.md','narrative/loop/BLAISE-ALLOWED.md','narrative/loop/ENDING-L3-AUDITIONS.md',
 'narrative/expansion/CYCLE-01-PART-A.md','narrative/expansion/CYCLE-01-PART-B.md','docs/coordination/protagonist/work/P-002-A.md','docs/coordination/loop-plot/work/PERFORMED-REVISIONS.md']
dump(OUT/'EXPANDED-IDENTITY.json',{'date':'2026-10-04','contentId':c['id'],'version':c['version'],'schemaVersion':c['schemaVersion'],
 'file':'src/content/case-expanded.json','sha256':sha,'status':'Lead-selected candidate for integration; no owner approval or complete-game claim',
 'scenes':len(c['scenes']),'choices':sum(len(s['choices']) for s in c['scenes']),'sources':len(c['sources']),'questions':len(c['questions']),'occasions':c['occasions'],
 'liveFirstNightPreservedSha256':hashlib.sha256((ROOT/'src/content/case-v2.json').read_bytes()).hexdigest(),
 'legacyPreservedSha256':hashlib.sha256((ROOT/'src/content/case.json').read_bytes()).hexdigest(),
 'sourceInputs':[{'path':f,'sha256':hashlib.sha256((ROOT/f).read_bytes()).hexdigest()} for f in inputs],
 'generated':['narrative/loop/MANUSCRIPT-EXPANDED-CANDIDATE.md','narrative/loop/EXPANDED-STAGING.json','narrative/loop/EXPANDED-WORD-COUNTS.json'],
 'routeReport':'narrative/loop/EXPANDED-ROUTE-CHECK.json','reviewScope':'Prior primary/source criticism applies to inspected scene hashes. Blind07 packet is older46bc1403. Neither is whole-candidate approval.'})
print(json.dumps({'caseSha256':sha,'sceneStagingRecords':len(stages),'basePassageWords':counts['basePassageWords'],'storedAllVariantPassageWords':counts['storedAllVariantPassageWords'],'actualRouteWords':[r['passageWords'] for r in route['routes']]},indent=2))
