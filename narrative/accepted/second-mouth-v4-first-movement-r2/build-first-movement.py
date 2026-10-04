"""Compile the lead-authored Second Mouth first movement, never any prior edition.

Source prose remains in the treatment/encounter files and the small connective
passages below. Exact rendered manuscript and staging IDs are emitted separately.
No author causal ledger or hidden history is compiled as player text.
"""
from pathlib import Path
import json, re, hashlib

ROOT = Path(__file__).resolve().parents[2]
HERE = Path(__file__).resolve().parent
A = (HERE / 'A-THE-SECOND-MOUTH.md').read_text()
I = (HERE / 'A-FIRST-INVESTIGATION.md').read_text()
T = (HERE / 'A-EARLY-TRANSFER.md').read_text()

def cut(s, a, b):
    start = s.index(a) + len(a)
    return s[start:s.index(b, start)].strip()

def pp(s):
    return [p.strip() for p in s.strip().split('\n\n') if p.strip()]

def block(s, a, b):
    return pp(cut(s, a, b))

def inc(s, a, b):
    start = s.index(a)
    return pp(s[start:s.index(b, start + len(a))])

def fid(x): return 'o0.' + x
def flag(x): return {'op':'flag', 'id':fid(x), 'scope':'current'}
def known(x): return {'op':'hasSource', 'id':fid(x), 'scope':'current'}
def ref(x): return {'op':'ref', 'refId':fid(x), 'scope':'current'}
def allof(*xs): return {'op':'all', 'args':list(xs)}
def notof(x): return {'op':'not', 'arg':x}
def disclose(actor, source): return {'type':'disclose','characterId':fid(actor),'refId':fid(source)}
def acquire(source): return {'type':'acquireSource','sourceId':fid(source)}
def witness(actor, source): return {'type':'witnessSource','characterId':fid(actor),'sourceId':fid(source)}

sources=[]
def source(id,title,text,kind='observation',origin=None,speaker=None,parents=None):
    s={'id':fid(id),'occasionId':'o0','title':title,'text':text,'kind':kind,'provenanceId':origin or fid(id)}
    if speaker:s['speakerId']=fid(speaker)
    if parents:s['derivedFrom']=[fid(x) for x in parents]
    sources.append(s)

source('promise-source','The undertaking at supper','Noor asked Blaise to leave the wooden mouth open until the tree cleared the corner. He said he would.','statement',speaker='blaise')
source('closed-source','Closing the mouth','After promising to leave it open, Blaise closed the wooden mouth to begin replacing it. The cord slipped out of its shallow seat; opening the lips did not reinsert it.')
source('release-source','The witnessed release','Blaise left the mouth open. As the table seam hardened, a wedge drew the second cord free. The woman at the table then had a left hand while the hand at the tree remained visible.',origin='o0.release-mechanism')
source('two-hands','The two left hands','The woman at the table acquired a left hand while a left hand remained engaged at the tree. The rooted speaking piece answered in Dora’s voice. Both women could act and answer separately.',origin='o0.exposure')
source('detached-piece','The speaking piece off the root','When Noor briefly lifted the speaking piece out of the responsive tissue, it gave no voice. When reseated, Dora spoke through it and asked Noor to tell her before detaching it again.')
source('scar-source','The buckle mark','Both left palms bore a pale square. The woman at the table remembered the hot buckle and Blaise’s letting go of the chair. She disputed that the table seam had already opened before supper.','statement',speaker='dora-table')
source('p-cut','The direct braid','The direct braid ended at a flat division across its full thickness. A separate naturally shed end narrowed and spread before separating. At the tree Noor showed Blaise the matching flat end. Putting the cut ends together did not restore their response.',origin='o0.direct-braid-material')
source('wedge-source','The prepared release','A freshly shaved wedge retained cord fibres in its notch. The cord had a matching pinched section. The wedge’s broad end bore dents matching the raised edges of the closing table seam; that movement would pull the cord out of the mouth.',origin='o0.release-mechanism')
source('table-request','A request to inspect','The woman at the table asked Blaise to find what lay under the room and show it to her, rather than only explain it afterward.','statement',speaker='dora-table')
source('table-affection','What she would find out','The woman at the table said she knew Blaise, not all of it flatteringly, and asked to find out the rest. She did not promise him unchanged affection.','statement',speaker='dora-table')
source('table-refusal','The refused memory test','The woman at the table refused a private-memory test. She offered to discuss what happened that morning, while declining the more intimate test.','statement',speaker='dora-table')
source('root-limits','The continuing woman’s reach','The continuing Dora said she could see parts of the room, felt discomfort at the corner, and wanted time to learn where her weight went before being watched. She asked Blaise not to move merely to give her a view of him.','statement',speaker='dora-orchard')
source('confession-source','Blaise’s account of closing the mouth','Blaise said he closed the mouth for his attempted whistle repair after promising Noor he would leave it open.','statement',speaker='blaise',parents=['closed-source','promise-source'])
source('cast-source','The installed older square','An older square with a repaired notch had been inserted into a fresh receiving place beneath Dora’s former seat. The current tissue moved independently behind it. Taps from above located its narrow reach beneath that place, short of the neighboring chair.',origin='o0.cast-installation')
source('cast-removed','The occupied place released','After inspecting its position, Blaise watched Noor lift the older square out of contact and lay it on the dry ledge. The prepared fold was no longer contacting the occupied place.')
source('cup-mark','The marked cup','Blaise turned a cup’s chip away from the lamp and drew a charcoal line under its handle. The cup stood inside the unoccupied niche; charcoal remained on his finger outside.')
source('cup-return','The empty niche returned','Noor put the old lining into contact around the unoccupied niche. The cup returned to its former orientation, its chip toward the lamp and its charcoal line absent. Blaise’s hand and charcoal-stained finger remained outside the niche; no person was in its reach.')
source('cup-declined','The test declined','Blaise declined to operate the empty-place return. Noor left its lining out of contact. The charcoal line remained on the cup; no current return of the cup was witnessed.')
source('report-source','The finding told at the window','Blaise told both women that the inspected cast and interrupted paths supported a prepared local restoration, and that Noor had lifted the cast out of contact. He did not identify a preparer.','statement',speaker='blaise',parents=['p-cut','wedge-source','cast-source','cast-removed'])
source('painting-difference','The unfinished picture','The woman at the table remembered intending to add someone to the blue room painting. The continuing woman said she liked the cut-off chair leg as it was. The actual dried painting could be inspected by either woman.')
source('new-pressure','A newly controlled reach','With her permission, Noor opened a fresh fold between the window and a responsive groove. Dora deliberately moved pressure across the wall and followed it into a new area. This was a new connection, not a repair joining the table woman to the root.')
source('rain-claim','Rain beyond the ridge','The continuing Dora said there was rain beyond the ridge while trying her new reach. Blaise could see a dry white ridge from the window. The distant rain had not yet been independently inspected.','statement',speaker='dora-orchard')
source('dora-wants-reach','A chosen new capacity','The continuing Dora wanted to keep trying the new reach and asked Blaise to hold the connection while she learned.','statement',speaker='dora-orchard')
source('nature-claim','Noor’s claim about Nature','Noor argued for an existence that depends on no further existence, with bodies and thinking expressing it. She denied that the finite wall was God. She acknowledged that asserting unlimited existence had not yet earned that premise.','statement',speaker='noor')
source('warrant-objection','Blaise’s objection about knowledge','Blaise asked whether necessary relations known under spatial and temporal conditions establish knowledge of reality independently of those conditions. Noor defended understanding beyond mere succession but acknowledged that she owed him the further argument.','statement',speaker='blaise')
source('joint-reach','The women’s present cooperation','The woman from the table knelt near the lower edge of the groove and offered her knuckles. The continuing woman brought the pressure to meet them. One tried a movement and the other made room. No private memories were exchanged.')

scenes=[]
staging=[]
def choice(id,label,target,requires=None,unless=None,effects=None,actions=None,when=None,irreversible=False,relationships=None):
    c={'id':fid(id),'label':label,'target':fid(target)}
    if requires:c['requires']=[fid(x) for x in requires]
    if unless:c['unless']=[fid(x) for x in unless]
    if effects:c['effects']=[fid(x) for x in effects]
    if actions:c['actions']=actions
    if when:c['when']=when
    if irreversible:c['irreversible']=True
    if relationships:c['relationships']=relationships
    return c
def scene(id,title,paragraphs,choices,src=None,variants=None,ending=False,area='room',stage='after'):
    s={'id':fid(id),'occasionId':'o0','title':title,'paragraphs':paragraphs,'choices':choices}
    if src:s['sourceIds']=[fid(x) for x in src]
    if variants:s['variants']=variants
    scenes.append(s);staging.append({'sceneId':fid(id),'area':area,'stage':stage,'choiceIds':[c['id'] for c in choices],'variantIds':[v['id'] for v in variants or []]})
def back(id,label='Return to the room.',effects=None):return choice(id,label,'room-hub',effects=effects)
def variant(id,paragraphs,requires=None,when=None,src=None):
    v={'id':fid(id),'requires':[fid(x) for x in requires or []],'paragraphs':paragraphs}
    if when:v['when']=when
    if src:v['sourceIds']=[fid(x) for x in src]
    return v

opening=cut(A,'## Opening audition: the difficult note','## Fixed history and causal requirements')
scene('supper','The difficult note',pp(cut(opening,'', 'You tried it after the last turn.')),[choice('hear-noor','Listen to Noor while she checks the connection.','promise')],stage='before')
scene('promise','Three screws',inc(opening,'You tried it after the last turn.','**Choice: Leave the mouth alone'),[
    choice('keep-promise','Leave the mouth open as promised; ask Dora to help you later.','leave-mouth',effects=['kept']),
    choice('break-promise','Close the mouth while Noor looks away, breaking your promise to wait.','close-mouth',effects=['closed'])
],src=['promise-source'],stage='before')
leave=cut(opening,'**Choice: Leave the mouth alone and ask Dora to help you find the missing movement after supper.**','**Choice: Wait until Noor looks through the window, then close the mouth and start unscrewing it.**')
scene('leave-mouth','Waiting',pp(cut(leave,'','Noor bends to look.')),[choice('watch-release','Look beneath the table.','exposure-kept')],stage='before')
common=inc(opening,'“Nobody,” Noor says.','**Follow-up: Take the root with Noor')
expose_kept=inc(leave,'Noor bends to look.','**The branches meet at the moving tree.**')
expose_choices=[choice('hold-root-kept','Take the root with Noor and hold the tree beside the window.','catch-tree'),choice('rope-kept','Fetch the soft rope and ask the woman at the table to help.','fetch-rope')]
kept_common=[p for p in common if not p.startswith('You remember the mouth under your hand.')]
scene('exposure-kept','Two hands',expose_kept+kept_common,expose_choices,src=['release-source','two-hands'])
touch=cut(opening,'**Choice: Wait until Noor looks through the window, then close the mouth and start unscrewing it.**','**Follow-up: Take the root with Noor')
scene('close-mouth','Under the chair',pp(cut(touch,'','Dora picks up her spoon.')),[choice('look-after-touch','Look toward Dora.','exposure-touched')],src=['closed-source'],stage='before')
scene('exposure-touched','Two hands',inc(touch,'Dora picks up her spoon.','“Nobody,” Noor says.')+common,[
    choice('hold-root-touched','Take the root with Noor and hold the tree beside the window.','catch-tree'),
    choice('rope-touched','Fetch the soft rope and ask the woman at the table to help.','fetch-rope')
],src=['two-hands'])
volunteer=inc(opening,'The woman at the table stands.','##') if False else pp('''The woman at the table stands. You have not asked her yet.

“Where do you keep the rope?”

She puts a hand on your shoulder to get past you. It is warm. There is a little dampness in the palm.

The voice in the tree says your name.

You do not turn around quickly enough for either of them.''')
scene('catch-tree','The root',volunteer+pp('''You get your forearm beneath the root beside Noor's. The tree's movement drags both your elbows across the sill. The woman finds the rope in the cupboard and brings it over.

“Round the root,” Noor says. “That thick part. Leave the wrist clear.”

The woman feeds the soft rope beneath the root. You take its end and pass it through the opening in the sill. Noor keeps the speaking piece seated while the knot takes the weight.

When you ease your arm out, a shallow mark remains on it. The tree is held close enough to the window to speak without anyone being pulled after it.'''),[choice('root-secured','Check how both women are doing.','sill',effects=['secured'])])
scene('fetch-rope','The cupboard',volunteer+pp('''You open the cupboard and find the soft rope behind a bag of dried fruit. The woman takes one end while you carry the coil to Noor.

Noor has one knee against the sill. She points with her chin at the thick part of the root, clear of the wrist. You feed the rope underneath. The woman passes the other end through the opening in the sill and helps you draw it close.

The root settles into the loop. Noor waits until the knot takes its weight before bringing her knee down. She keeps one hand at the speaking piece.

“That's enough. Don't pull it any tighter.”'''),[choice('rope-secured','Check how both women are doing.','sill',effects=['secured'])])
scene('sill','At the sill',block(I,'## At the sill','Available actions:'),[choice('sill-investigate','Look at the connections before deciding what happened.','room-hub',effects=['at_sill'])],src=['detached-piece','scar-source'])

hub_choices=[
 choice('inspect-p','Inspect the direct braid behind the wall panel.','direct-braid',unless=['p_seen']),
 choice('inspect-wedge','Examine the loose cord and wedge.','wedge',unless=['q_seen']),
 choice('talk-table','Speak with the woman at the table.','table-conversation',unless=['table_talked']),
 choice('talk-root','Speak with the continuing woman at the root.','root-conversation',unless=['root_talked']),
 choice('go-below','Ask Noor to show you the underside of the room.','lower-passage',requires=['p_seen','q_seen'],unless=['cast_seen']),
 choice('remove-cast-later','Ask both women before having Noor take the occupied cast out of contact.','cast-removal',requires=['cast_seen'],when=notof(known('cast-removed'))),
 choice('organize-finding','Consider what was prepared at Dora’s place.','claim',requires=['p_seen','q_seen','cast_seen'],when=known('cast-removed')),
 choice('revisit-braid','Look again at the interrupted direct braid.','braid-revisit',requires=['p_seen'],unless=['p_revisited'])
]
scene('room-hub','The room',pp('''The rope creaks against Noor's folded coat. The woman at the table has chosen a different chair. Outside, the hand at the root adjusts its grip.

You have room to look before touching anything else.'''),hub_choices,variants=[variant('hub-after-inspection',pp('''The wedge lies where you left it. Beyond the window the tree has begun to lean into its next movement. Noor watches the rope, waiting for you to say where you want to look next.'''),requires=['p_seen','q_seen'])])
scene('direct-braid','The direct braid',block(I,'## The direct braid','Source delivered:'),[back('p-back',effects=['p_seen'])],src=['p-cut'])
scene('wedge','The prepared pull',block(I,'On the kept-promise route the player saw the release. On the covert route this is a fresh inspection of its aftermath, not a memory of watching it happen.','Source delivered:'),[back('q-back',effects=['q_seen'])],src=['wedge-source'])
scene('braid-revisit','The ends',pp('''The flat ends are where you left them. You hold them in the same position as before. They still do not answer each other.

The woman at the table watches you through the gap beneath the sill. You realize you have been hoping the second look would make them join.

You set them down without binding them.'''),[back('p-revisit-back',effects=['p_revisited'])])

table=cut(I,'## The woman at the table','## At the root')
scene('table-conversation','The unfinished room',pp(cut(table,'','Choice: Ask what she wants')),[
 choice('table-want','Ask what she wants you to do now.','table-want',effects=['table_talked']),
 choice('table-affection-choice','Say you are afraid of expecting her to owe you Dora’s affection.','table-affection',effects=['table_talked']),
 choice('table-memory-test','Ask for one private memory; stop if she refuses.','table-refusal',effects=['table_talked'])
])
scene('table-want','Show me',block(table,'Choice: Ask what she wants you to do now.','Choice: Say you are afraid'),[back('table-want-back')],src=['table-request'])
scene('table-affection','Some of it',block(table,'Choice: Say you are afraid of speaking to her as though she owes you Dora\'s affection.','Choice: Ask for one memory'),[back('table-affection-back')],src=['table-affection'])
scene('table-refusal','No',block(table,'Choice: Ask for one memory only the two of you would know, then stop if she refuses.','All three leave'),[back('table-refusal-back')],src=['table-refusal'])
root_text=block(I,'## At the root','If the player privately admits')
scene('root-conversation','Where the weight goes',root_text,[
 back('root-back',effects=['root_talked']),
 choice('private-confession','Tell her quietly that you closed the mouth after promising to wait.','private-confession',requires=['closed'],effects=['root_talked','private_confession'],actions=[acquire('confession-source'),disclose('dora-orchard','confession-source')])
],src=['root-limits'])
scene('private-confession','The whistle',pp('''You wait until Noor is beside the table, speaking to the other woman. You keep your voice low, close to the rooted speaking piece.''')+block(I,'“I closed it,” you say. “After I told Noor I would leave it.”','## Down the side steps') if False else pp('''You wait until Noor is beside the table, speaking to the other woman. You keep your voice low, close to the rooted speaking piece.

“I closed it,” you say. “After I told Noor I would leave it.”

The root keeps moving.

“For the whistle?”

“Yes.”

“I used to like that.”

You wait for something else. Nothing comes. After a while she asks you to fetch Noor.'''),[back('confession-back')])
scene('lower-passage','The side steps',block(I,'## Down the side steps','## Beneath Dora\'s place'),[choice('look-under-place','Inspect the underside of Dora’s former place.','cast-inspection')],area='lower',stage='lower')
cast_paras=block(I,'## Beneath Dora\'s place','Choice: Ask both women before')
scene('cast-inspection','The old square',cast_paras,[
 choice('isolate-occupied-cast','Ask both women before having Noor lift the occupied cast out of contact.','cast-removal',effects=['cast_seen']),
 choice('niche-before-removal','Leave the occupied cast in place for now; inspect the empty niche first.','niche',effects=['cast_seen'])
],src=['cast-source'],area='lower',stage='lower')
scene('cast-removal','Out of contact',block(I,'## Removing the occupied cast','The next exchange will not silently repeat'),[
 choice('look-niche','Inspect the unoccupied return niche.','niche',when=notof(known('cup-mark'))),
 back('removed-after-test','Return to the room and consider the finding.')
],src=['cast-removed'],area='lower',stage='lower')
scene('niche','An empty place',block(I,'## The empty-place return','Choice: Return the empty niche'),[
 choice('operate-empty-return','Operate the return around the empty cup niche.','return-test'),
 choice('decline-empty-return','Decline the test and leave the charcoal mark on the cup.','return-declined')
],src=['cup-mark'],area='lower',stage='lower')
scene('return-test','The cup',block(I,'Choice: Return the empty niche and inspect the cup.','Choice: Decline the test.'),[back('test-back',effects=['saw_test'])],src=['cup-return'],area='lower',stage='lower')
scene('return-declined','The mark stays',block(I,'Choice: Decline the test. Inspect the niche\'s boundary and the prepared cast without operating it.','The mechanical finding remains possible'),[back('decline-test-back',effects=['declined_test'])],src=['cup-declined'],area='lower',stage='lower')
scene('claim','What was prepared',pp('''You have the cut ends, the released cord, the shaped wedge and the older square's position. The women wait in the room, one at the table and the other speaking through the root.

Before you give them an account, you can set out which observations support it. What you found beneath the chair cannot by itself tell you who put the old square there.'''),[back('claim-back','Look through the room again.')])
scene('finding-private','A prepared return',pp('''The older square was positioned to reinstate an earlier local arrangement. The direct braid was cut, and the remaining cord had a prepared release. Those interventions belong in the same account.

That account does not give you the preparer's name. It does distinguish a prepared act from a tree that happened to move too far.

You can tell both women what the physical observations support.'''),[choice('tell-finding','Tell both women the supported finding and that the cast is now out of contact.','report',actions=[acquire('report-source'),disclose('dora-table','report-source'),disclose('dora-orchard','report-source'),disclose('noor','report-source')])])
report=block(I,'## Returning to the room with the finding','If Blaise has publicly disclosed')
scene('report','Somebody made that place',report,[
 choice('report-confess','Also tell them that your closing the mouth dislodged the remaining cord.','public-confession',requires=['closed'],unless=['public_confession'],effects=['public_confession'],actions=[acquire('confession-source'),disclose('dora-table','confession-source'),disclose('dora-orchard','confession-source'),disclose('noor','confession-source')]),
 choice('report-go-transfer','Ask what support the continuing woman wants now.','transfer')
])
scene('public-confession','What you touched',pp('''You tell them when you closed the mouth and what you wanted to repair. You name the promise before anyone else has to.

Noor rubs the side of her face with the heel of her hand.

“I asked you for a few minutes.”

“I know.”

The woman at the table looks down at her left hand. She asks whether that means you put her there.

“No,” Noor says. “The old square was already fitted underneath. He didn't make that by touching the mouth.”

“I wanted him to answer.”

You say you did not put the old square there. You also say that your closing the mouth interrupted the remaining path before the delayed pull.

The voice at the root asks whether the cut can be repaired today. Noor says it cannot. You are still standing where everyone can see you.'''),[choice('confessed-go-transfer','Stay and help with the new connection.','transfer')])

transfer=cut(T,'## Scene','## The argument begins during the work')
scene('transfer','A new reach',pp(cut(transfer,'','**Choice: Ask the continuing Dora')),[
 choice('offer-new-reach','Ask whether she wants the new connection and offer to hold it while she learns.','reach-offer',effects=['holding']),
 choice('offer-old-body','Ask whether she wants her former body reconstructed; say you want her back at the table.','reach-reconstruction',effects=['holding']),
 choice('ask-handover','Say the feeling frightens you and ask Noor to take your place.','reach-handover',effects=['handed_over'])
],src=['painting-difference','new-pressure','rain-claim'])
scene('reach-offer','Keep trying',block(transfer,'**Choice: Ask the continuing Dora whether she wants to keep this new connection, and offer to hold it while she learns.**','**Choice: Ask whether she wants her former body reconstructed'),[choice('offer-to-argument','Keep the connection steady and speak to Noor.','god-argument')],src=['dora-wants-reach'])
scene('reach-reconstruction','Let me finish',block(transfer,'**Choice: Ask whether she wants her former body reconstructed instead. Say that you want to bring her back to the table.**','**Choice: Tell her you are frightened'),[choice('reconstruction-to-argument','Give her time to try and speak to Noor.','god-argument')],src=['dora-wants-reach'])
scene('reach-handover','The hand beside yours',block(transfer,'**Choice: Tell her you are frightened by the feeling in your wrist and ask Noor to take your place.**','\n\n##') if False else pp(cut(transfer,'**Choice: Tell her you are frightened by the feeling in your wrist and ask Noor to take your place.**', 'Noor\'s sleeve is slipping'))+pp('''Noor's sleeve is slipping down toward the damp fold. You roll it up for her. Neither of you mentions your hand.'''),[choice('handover-to-argument','Stay beside Noor and speak to her.','god-argument')])
argument=inc(T,'“I used to think,” you say,','## Consequence and remaining work')
scene('god-argument','What exists underneath',pp('''You keep your palm beside Noor's working hand. Dora's pressure moves underneath it as she tries the reach again.''')+argument,[choice('after-argument','Let the women try the lower reach together.','invitations',effects=['transferred'])],src=['nature-claim','warrant-objection','joint-reach'],variants=[variant('argument-handover',pp('''Noor holds the wall. You stand beside her, with your hand clear of the damp fold. Dora's pressure moves beneath Noor's palm as she tries the reach again.''')+argument,requires=['handed_over'])])
invitations=block(I,'## Two invitations','Choice: Accompany the continuing Dora')
scene('invitations','Two invitations',invitations,[
 choice('choose-orchard','Ask to accompany the continuing Dora into the orchard, with Noor guiding the other woman to the old rooms.','orchard-agreement',irreversible=True),
 choice('choose-dry','Ask to accompany the woman at the table to the old rooms, with Noor traveling beside the orchard.','dry-agreement',irreversible=True)
])
scene('orchard-agreement','Which way first',pp('''Noor asks the woman at the table whether she wants to take the dry way with her.

“As long as you show me where it comes from.”

Noor says she will. At the window she asks the continuing woman whether she wants Blaise beside the tree.

“He can come. Tell him not to walk where the new skin shines.”

“I'm here,” you say.

“Then you've heard.”'''),[choice('leave-for-orchard','Go out beside the moving tree.','orchard-departure')])
scene('dry-agreement','Which way first',pp('''The woman at the table agrees to take the dry way with you. She asks Noor to show you where the larger casts were carried.

Noor tells her, then goes to the window and asks the continuing woman if she wants company.

“Yes. Bring your stones.”

“I haven't got the tall one.”

“Find another.”

Noor puts the stones back into the pockets of her coat.'''),[choice('leave-for-dry','Take the lamp and follow the woman toward the old rooms.','dry-departure')])
scene('orchard-departure','Into the moving country',block(I,'## Orchard departure','## Dry-country departure'),[],ending=True,area='orchard-threshold',stage='departure-orchard')
scene('dry-departure','The things that were left',block(I,'## Dry-country departure','Author handoff:'),[],ending=True,area='dry-threshold',stage='departure-dry')
for s in scenes:
    for c in s['choices']:
        if c['target'] in [fid('orchard-departure'),fid('dry-departure')]:
            c['ending'] = True

question={
 'id':fid('preparation-question'),'occasionId':'o0','text':'What was prepared at Dora’s place?',
 'when':allof(known('p-cut'),known('cast-source'),known('cast-removed'),{'op':'any','args':[known('wedge-source'),known('release-source')]},notof({'op':'hasDeduction','id':fid('preparation-question'),'scope':'current'})),
 'candidates':[
  {'id':fid('prepared-return'),'text':'An earlier local arrangement was positioned to return after both supporting connections were interrupted.'},
  {'id':fid('tree-alone'),'text':'The tree pulled an intact body apart by itself; nothing had been prepared in the room.','contradictedBy':[fid('cast-source'),fid('wedge-source')]},
  {'id':fid('blaise-created-cast'),'text':'Closing Blaise’s mouth alone created the older arrangement beneath the chair.','contradictedBy':[fid('cast-source')]},
  {'id':fid('never-alive'),'text':'The cut establishes that one of the two women has never been alive.'}
 ],
 'supportedCandidateId':fid('prepared-return'),
 'proof':{'op':'all','independent':True,'args':[ref('p-cut'),{'op':'any','args':[ref('wedge-source'),ref('release-source')]},ref('cast-source')]},
 'allowedCorroborators':[fid(x) for x in ['wedge-source','release-source','two-hands','cup-return','cast-removed','closed-source']],
 'feedback':[
  {'code':'supported','text':'The selected observations support a prepared local restoration after the two interruptions. They do not identify the preparer.'},
  {'code':'premature','text':'The selected material leaves part of that physical sequence unsupported.'},
  {'code':'irrelevant','text':'Some selected material does not bear on this particular physical finding.'},
  {'code':'contradictory','text':'One of the selected observations conflicts with that account.'},
  {'code':'unsupported','text':'The selected material does not support that conclusion.'}
 ],
 'effects':[fid('finding')],'target':fid('finding-private')
}
readings=[
 {'id':fid('closure-reading'),'occasionId':'o0','title':'Your interruption and the preparation','text':'Closing the mouth interrupted a remaining path before the prepared pull. That gives Blaise a particular responsibility; it does not make him the maker of the older square or erase the prior cut.','when':allof(known('closed-source'),{'op':'hasDeduction','id':fid('preparation-question'),'scope':'current'}),'relatedRefs':[fid('closed-source'),fid('preparation-question')]},
 {'id':fid('refusal-reading'),'occasionId':'o0','title':'A refusal to be tested','text':'Her refusal left the physical inquiry available. A private memory could have mattered to Blaise without being something she owed him as evidence.','when':known('table-refusal'),'relatedRefs':[fid('table-refusal')]},
 {'id':fid('rain-reading'),'occasionId':'o0','title':'A new reach and a reported rain','text':'Dora deliberately controlled pressure in the new wall. Her further claim about rain is still a report; the dry view from the window does not by itself establish or refute weather beyond the ridge.','when':allof(known('new-pressure'),known('rain-claim')),'relatedRefs':[fid('new-pressure'),fid('rain-claim')]}
]
content={'schemaVersion':2,'id':'shape-of-the-water','title':'The Second Mouth · First movement','version':4,'start':fid('supper'),
 'occasions':[{'id':'o0','label':'The opening exchange'}],
 'beliefIds':[],
 'characters':[{'id':fid(c),'name':n,'occasionId':'o0','initial':{'knows':[],'believes':[],'claims':[]}} for c,n in [('blaise','Blaise Bloom'),('noor','Noor Brangwen'),('dora-table','Dora at the table'),('dora-orchard','Dora in the orchard')]],
 'sources':sources,'questions':[question],'interpretationRules':readings,
 'hints':[{'id':fid('organize-hint'),'occasionId':'o0','label':'Review the three physical preparations','questionId':fid('preparation-question'),'when':allof(known('p-cut'),known('wedge-source'),known('cast-source')),'mentions':[fid('p-cut'),fid('wedge-source'),fid('cast-source')],'text':'The direct braid, the prepared release and the inserted older square answer different parts of the same question. Select support for the interruption and for what was positioned to return.','reveals':False}],
 'scenes':scenes}

out=ROOT/'src/content/case-v4.json'
out.write_text(json.dumps(content,ensure_ascii=False,indent=2)+'\n')
(HERE/'STAGING-V4.json').write_text(json.dumps({'contentId':content['id'],'version':4,'scenes':staging},ensure_ascii=False,indent=2)+'\n')
man=['# The Second Mouth: first-movement compiled manuscript','Development version 4. This is a bounded opening investigation, not the completed long-form game. All choices/variants below are authored; a single route reads only the material it encounters.']
for s in scenes:
    man += ['## '+s['id']+' | '+s['title'],*s['paragraphs']]
    for v in s.get('variants',[]):man += ['### Variant '+v['id'],*v['paragraphs']]
    if s['choices']:man += ['\n'.join('- '+c['label']+' → '+c['target'] for c in s['choices'])]
(HERE/'MANUSCRIPT-V4.md').write_text('\n\n'.join(man)+'\n')
result={'sha256':hashlib.sha256(out.read_bytes()).hexdigest(),'scenes':len(scenes),'choices':sum(len(s['choices']) for s in scenes),'sources':len(sources),'basePassageWords':sum(len(re.findall(r"\b[\w’'-]+\b",p)) for s in scenes for p in s['paragraphs']),'status':'Emitted development candidate; validation and actual route checks still required.'}
(HERE/'BUILD-V4.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(result))
