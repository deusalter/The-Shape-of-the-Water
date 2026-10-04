"""Lead-authored first-night v2 integration. Does not alter the archived v1 case.
The loop occasion transition is intentionally outside this candidate until its contract exists.
"""
from pathlib import Path
import copy, json
raise SystemExit("SUPERSEDED: Henrietta/workroom candidate must not be regenerated. See male-protagonist correction.")
ROOT=Path(__file__).resolve().parents[2]
c=json.loads((ROOT/'src/content/case.json').read_text())
c['schemaVersion']=2
c['version']=2
c['sources']=[]
c['beliefIds']=['simon_sabotage','henrietta_room_expected']
c['questions']=[]
c['interpretationRules']=[]
c['hints']=[]
S={s['id']:s for s in c['scenes']}
for s in c['scenes']:
    s['paragraphIds']=[f"{s['id']}.p{i+1}" for i in range(len(s['paragraphs']))]
    for i,v in enumerate(s.get('variants',[])):
        v['id']=f"{s['id']}.variant{i+1}"
        v['paragraphIds']=[f"{v['id']}.p{j+1}" for j in range(len(v['paragraphs']))]

def src(id,title,text,kind,prov,speaker=None,claims=None):
    d={'id':id,'title':title,'text':text,'kind':kind,'provenanceId':prov}
    if speaker:d['speakerId']=speaker
    if claims:d['claimIds']=claims
    c['sources'].append(d)
    return id

def attach(scene,*ids):
    S[scene]['sourceIds']=list(ids)
    for v in S[scene].get('variants',[]):v['sourceIds']=list(ids)

def cond(op,id):return {'op':op,'id':id}
def knows(character,ref):return {'op':'npcKnows','characterId':character,'refId':ref}
def allof(*args):return {'op':'all','args':list(args)}
def anyof(*args):return {'op':'any','args':list(args)}
def disclose(character,ref):return {'type':'disclose','characterId':character,'refId':ref}
def newscene(id,title,paragraphs,choices,sourceids=None,**extra):
    d={'id':id,'title':title,'paragraphs':paragraphs,'paragraphIds':[f'{id}.p{i+1}' for i in range(len(paragraphs))],'choices':choices,**extra}
    if sourceids:d['sourceIds']=sourceids
    S[id]=d;c['scenes'].append(d);return d

job=src('present-job-offer','The Tuesday offer','I accepted a job repairing work clothing at an out-of-town laundry. I start on Tuesday. Before that offer I had agreed to use the bath’s upstairs room for winter alterations, with first appointments on Wednesday. Ada has cleared the room. I have not yet released that arrangement.','document','henrietta-job-and-appointments')
jobdate=src('present-job-acceptance-date','When I accepted','I accepted the new job on Monday morning, before lending Simon the fitting mirror. I delayed telling Ada while her arrangements for Wednesday remained active.','statement','henrietta-account','henrietta')
sabotage=src('present-sabotage-message','The message to twelve visitors','Simon’s phone shows a photograph of the broken mirror and his message: “The experiment was deliberately destroyed.” Twelve people have read it.','statement','simon-visitors-message','simon',['simon_sabotage'])
miriam=src('present-miriam-sequence','Miriam’s sequence','Miriam says she pulled the release, heard its click, pushed a door that stayed shut, and said “Let me out” twice. She heard Ada answer before the cord parted and the door opened.','statement','miriam-first-person-account','miriam')
ada=src('present-ada-sequence','Ada’s account of the cut','Ada acknowledges cutting the exterior cord. She says she heard Miriam ask to leave and saw the door strain against the cord. She kept the two cut ends.','statement','ada-first-person-account','ada')
latch=src('present-latch-click','The release after the cut','At the damaged cabinet I pulled the brass ring. The latch withdrew and the door moved a little. This was after the cord had been cut.','observation','cabinet-after-event-inspection')
release=src('present-empty-release-test','The empty binding test','With nobody inside, a padded reconstruction showed that the exterior cord held the door shut after the inside latch withdrew. Slackening the cord allowed the door to open as far as the padded chair.','observation','empty-cabinet-reconstruction')
geometry=src('present-impact-geometry','The mirror’s outward swing','The mirror is bolted to the inside of an outward-opening door. The concrete pier is in its arc. The dent on the mirror frame aligns with the pale chip above the old felt pad; the padded chair stops the reconstructed swing before that point.','observation','empty-cabinet-reconstruction')
ack=src('present-simon-binding','Simon’s acknowledgment','Simon acknowledges adding the exterior binding after Miriam went inside, to close the seam against light.','statement','simon-binding-account','simon')
attention=src('present-simon-attention','Simon’s account of his attention','Simon says he mistook the first request to leave for an objection to the sight. He cannot measure now whether he considered the cord’s effect on the whole door for an instant or not at all.','statement','simon-binding-account','simon')
film=src('present-incident-recording','The continuous incident recording','The uncut phone clip shows Simon bind the cabinet door. Later Miriam says “Let me out” twice, Simon says “One minute,” Ada cuts the cord, and the opening door strikes the pier. The recording does not show Miriam inside or diagnose her distress.','document','continuous-incident-recording')
emptyclip=src('present-empty-optical-clip','The earlier empty recording','Simon’s earlier clip shows a stripe recorded by a camera inside the empty cabinet while he walks outside. This is a separate recording from the continuous incident clip.','document','empty-optical-recording')
card=src('present-unconditioned-card','Simon’s printed claim','The card calls the effect “An unconditioned sight.” This is Simon’s description, not a finding established by the earlier empty recording.','statement','simon-display-card','simon')
control=src('present-optical-control','The open optical control','An empty open model produces the stripe on a camera. Covering the light slit removes it; uncovering restores it. Moving water disturbs it. This tests an optical event without enclosing a person.','observation','open-optical-control')
private=src('present-miriam-confidence','Miriam’s private account','Miriam described caring for her mother over two winters, the teaspoons and the barley-water saucepan whose lemon remained in later soup. She said understanding sometimes reduced her anger; help from a neighbour also mattered. This conversation was private.','statement','miriam-private-care-account','miriam')
source_plan=src('present-plan','The unfinished check','The plan shows the door, the inside pull and the pier, but no exterior binding. Ada pencilled “Check swing before glass goes on.” There is no tick beside it.','document','printed-cabinet-plan')

c['characters']=[
 {'id':'henrietta','name':'Henrietta Bloom','initial':{'knows':[job,jobdate],'believes':[],'claims':[]}},
 {'id':'ada','name':'Ada March','initial':{'knows':[ada,source_plan],'believes':['henrietta_room_expected'],'claims':[ada]}},
 {'id':'simon','name':'Simon Vane','initial':{'knows':[ack,attention,sabotage,emptyclip,card],'believes':['simon_sabotage'],'claims':[ack,attention,sabotage,card]}},
 {'id':'miriam','name':'Miriam Verney','initial':{'knows':[miriam,private],'believes':[],'claims':[miriam]}}
]
attach('arrival',job,jobdate,sabotage)
attach('bench',miriam)
attach('workshop',ada,source_plan)
attach('cabinet',latch)
attach('gallery',emptyclip,card)
attach('release',release,geometry,ack)
attach('recording',film)
attach('simon_account',ack,attention)
attach('miriam_account',miriam)
attach('optics',control)
S['miriam_private']['sourceIds']=[private]
for v in S['miriam_private'].get('variants',[]):v['sourceIds']=[]

# Preserve the exact original arrival tableau, then make Henrietta's prior conduct knowable.
oldarrivalchoices=S['arrival']['choices']
intro=[
 'You meant to tell Ada on Monday. Then Simon needed the mirror and there was a job you could do without saying anything difficult. You helped him carry it down the stairs, your hands in the places where your hands always went. On the landing he asked whether you would need it back for the new room at the bath. You said you would need it back.',
 'Your new job starts on Tuesday. Repairs and alterations, work that arrives in numbered sacks instead of in the arms of somebody who wants to stay while you do it. Thirty-four hours a week. A wage at the end of the month whether anyone likes the shape of their calves. You have read the offer often enough that the page opens at the fold through the starting date.',
 'Ada cleared the upstairs room for you. She put the old benches on end, repaired the fluorescent strip and found a table that does not rock. You had agreed to see the first customers on Wednesday. Their times are in a message you have not answered since the other offer arrived.',
 'You accepted on Monday morning. Monday afternoon was about the mirror. Tuesday Ada was busy. By Friday, telling her would also mean explaining the days in which you had not told her.',
 'The fitting mirror should have your pin cushion hanging from its top. You took it off before lending it and put it somewhere sensible. You cannot remember where.',
 '“Henrietta,” Ada says. “Don’t stand in the glass.”',
 'You look down. One bright piece lies an inch from the side of your shoe. You step around it, toward the bench.'
]
S['arrival']['paragraphs'][-1:]=intro
S['arrival']['paragraphIds']=[f'arrival.p{i+1}' for i in range(len(S['arrival']['paragraphs']))]
S['arrival']['choices']=[
 {'id':'arrival-tell-ada-job','label':'Ask Ada aside and tell her about Tuesday’s job and the room you cannot take.','target':'ada_job','effects':['ada_job_told'],'actions':[disclose('ada',job),{'type':'setBelief','characterId':'ada','beliefId':'henrietta_room_expected','value':False}],'irreversible':True},
 {'id':'arrival-delay-job','label':'Deal with the broken mirror first. Keep the new job to yourself for now.','target':'arrival_questions','effects':['job_delayed'],'relationship':{'id':'job-delayed','text':'I delayed telling Ada that I had accepted another job while her Wednesday arrangements remained active.'}}
]
newscene('arrival_questions','The people beside the glass',[
 'You put the folded offer back in your coat. Ada has the saucepan across her knees. Simon is waiting for you to ask which part of his account comes next. Miriam has shifted the bag of peas to the other side of her hand.',
 'You can establish what happened to the mirror, ask what the sight established, and decide what account to give the people expecting to come tomorrow.'
],oldarrivalchoices)
newscene('ada_job','The room upstairs',[
 'You ask Ada to come as far as the workshop arch. She sets the saucepan on the bucket and follows. You stand beside the running laundry fan, where Simon and Miriam can see you but cannot make out quiet words.',
 '“I’ve taken the other job,” you say. “The laundry one. I start on Tuesday.”',
 'Ada looks toward the ceiling. You can tell exactly which room she is putting above it.',
 '“So you won’t want the table.”',
 '“No.”',
 '“Good table.”',
 '“I know.”',
 'She rubs the place on her palm where the saucepan handle has left a red line. “Is it proper hours?” You tell her. “They pay when there’s nothing waiting?” You tell her that too. She nods. You had rehearsed how to answer a different set of questions.',
 '“I can write to the Wednesday people,” you say.',
 '“You’ll have to. I don’t know what you told them.”',
 'You remind her that she has their names. “I know who they are,” she says. “I don’t know what you said you would do.”',
 'You want to explain that nothing has been measured, pinned or cut yet. The appointments are still only appointments. She has spent an evening moving benches so you can be ready for people whose names she knows.',
 '“Did you get the offer today?”',
 'You could give her the dates. You could also answer the practical questions and keep the date of your acceptance to yourself. Either way, she now has to find another use for the cleared room.',
 'Beyond the arch, Simon asks whether you need him. Ada tells him this is not about his cabinet. He goes back to the glass. Miriam looks over once, then returns her attention to the cold bag in her hand.'
],[
 {'id':'ada-job-give-date','label':'Tell Ada you accepted on Monday, before lending the mirror.','target':'ada_job_date','actions':[disclose('ada',jobdate)],'effects':['ada_job_date_told'],'irreversible':True},
 {'id':'ada-job-keep-date','label':'Keep the acceptance date private; undertake to cancel the Wednesday appointments yourself.','target':'ada_job_private','effects':['cancel_appointments_promised'],'relationship':{'id':'job-date-private','text':'I told Ada I could not take the winter room and undertook to cancel the appointments, but did not tell her when I accepted the new job.'}}
])
newscene('ada_job_date','Monday morning',[
 '“Monday,” you say. “Before we carried the mirror.”',
 'Ada moves one hand to the edge of the cupboard behind her. She does not lean on it.',
 '“I was in here that evening,” she says. “With the benches.”',
 '“I know.”',
 '“You sent me the width of the machine.”',
 'You did. You had the number on a scrap beside the telephone, and sending it took less effort than writing the other message.',
 '“I thought I’d tell you when I came.”',
 '“You did come.”',
 'There is a loose corner on the notice by her shoulder. You want to press it flat. You leave it alone.',
 'You say you will contact the Wednesday people tonight. Ada says one of them will probably be pleased: the woman has asked twice whether she could have a later time. The news gives you an absurd little relief. Ada has other things to do with it.',
 '“I’m glad you got work you can count on,” she says. “I’d have liked my evening.”',
 '“I can put the benches back.”',
 '“Leave the table. Someone will use it.” She takes her hand off the cupboard. “Come and look at what he’s done before I clear it away.”'
],[{'id':'ada-job-date-return','label':'Undertake to contact the Wednesday people tonight, then return to the mirror.','target':'concourse','effects':['cancel_appointments_promised'],'relationship':{'id':'ada-job-date','text':'I told Ada when I accepted the job. She welcomed the work and said she would have liked the evening she spent preparing my room. I promised to contact the Wednesday appointments tonight.'}}])
newscene('ada_job_private','The names to contact',[
 '“I don’t want to go through the dates here,” you say. “I’ll speak to the Wednesday people. You won’t have to.”',
 'Ada waits, as if there might be another sentence. You do not give her one.',
 '“Their numbers are in the message,” she says.',
 '“I’ve got it.”',
 '“All right.”',
 'You ask whether she wants help putting the benches back. She says to leave the table. Someone can use it. When you thank her for clearing the room, she puts the saucepan into your hands so she can pick up the cloth beneath it.',
 '“Don’t thank me as if you came and did some sewing,” she says. “You haven’t.”',
 'You carry the saucepan back to the bucket. Simon asks whether everything is all right. Ada says you have your own things to finish. You do not know whether she intends that as protection or an answer.'
],[{'id':'ada-job-private-return','label':'Put the saucepan down and return to the case.','target':'concourse'}])
S['concourse']['choices'].append({'id':'hub-tell-ada-job','label':'Ask Ada aside about Tuesday’s job and the winter room.','target':'ada_job','when':{'op':'not','arg':knows('ada',job)},'effects':['ada_job_told'],'actions':[disclose('ada',job),{'type':'setBelief','characterId':'ada','beliefId':'henrietta_room_expected','value':False}],'irreversible':True})

# The factual finding is submitted from selected sources. Possession/progression flags alone do not accept it.
qid='accident-sequence'
proof={'op':'any','args':[{'op':'ref','refId':film},{'op':'all','args':[{'op':'ref','refId':x} for x in [miriam,ada,release,geometry,ack]]}]}
c['questions'].append({
 'id':qid,'text':'What sequence explains the binding, cut and broken mirror?',
 'when':anyof(cond('hasSource',miriam),cond('hasSource',ada),cond('hasSource',film)),
 'candidates':[
  {'id':'rescue-then-impact','text':'Simon’s added binding obstructed the exit. Miriam asked to leave before Ada cut it; the freed door then struck the pier.'},
  {'id':'cut-before-request','text':'Ada cut the cord before Miriam asked to leave, and the later request explains none of the intervention.','contradictedBy':[miriam,ada,film]},
  {'id':'latch-proves-exit','text':'The moving latch shows that Miriam had a usable exit while the exterior binding was intact.','contradictedBy':[release,film]},
  {'id':'proven-intended-injury','text':'The physical sequence proves Simon intended to injure Miriam.'}
 ],
 'supportedCandidateId':'rescue-then-impact','proof':proof,'allowedCorroborators':[latch,attention,source_plan],
 'feedback':[
  {'code':'premature','text':'The click belongs to the latch. To explain the usable exit and the later cut, your selected account still needs more than that one moving part.','when':cond('hasSource',latch),'mentions':[latch]},
  {'code':'contradictory','text':'Miriam’s account places her request before Ada’s cut. Keep the order she reports visible while you compare this candidate.','when':cond('hasSource',miriam),'mentions':[miriam]},
  {'code':'irrelevant','text':'The selected material includes something that does not help establish this sequence. It remains in your notebook; submitting it here has not told the people in the room.'},
  {'code':'unsupported','text':'That claim reaches beyond what your selected sources establish. You can keep the question open and examine another part of the account.'},
  {'code':'supported','text':'Your selected sources support the binding, request, cut and impact in that order. The finding is in your notebook. Choosing who hears it is a separate action.'}
 ],'effects':['deduced_accident'],'target':'finding_notebook'
})
newscene('finding_notebook','The account in your notebook',[
 'You put the sequence together beside the sources you used. The added cord held the door after the latch withdrew. Miriam asked to leave; Ada cut the cord; the freed door struck the pier.',
 'The account does not tell you everything Simon meant, or why the sight frightened Miriam. You have not used a private conversation to supply either answer.',
 'Ada is rinsing the saucepan. Simon looks up when you stop writing. He asks whether you have something to tell them. You can gather them now or finish another conversation first.'
],[
 {'id':'finding-share','label':'Bring the three people together and give them the supported sequence.','target':'shared','actions':[disclose(x,qid) for x in ['ada','simon','miriam']]+[{'type':'setBelief','characterId':'simon','beliefId':'simon_sabotage','value':False}]},
 {'id':'finding-keep','label':'Keep the finding in the notebook for now and return to the room.','target':'concourse'}
])
for s in c['scenes']:
    for q in s['choices']:
        if q['target'] in ('shared','report'):
            q['when']=allof(q.get('when',{'op':'always'}),cond('hasDeduction',qid))
        if q['id']=='hub-shared':
            q['label']='Bring the three people together and give them the supported sequence.'
            q['actions']=[disclose(x,qid) for x in ['ada','simon','miriam']]+[{'type':'setBelief','characterId':'simon','beliefId':'simon_sabotage','value':False}]
# Reporting prose names the actual submitted proof, not other material merely visited.
# The film-path variant uses an explicit question-derived flag set only through a future scoped submission;
# here both report variants instead ask the player to name the sources in the immutable finding.
for paragraphs in [S['report']['paragraphs']]+[v['paragraphs'] for v in S['report'].get('variants',[])]:
    for i,p in enumerate(paragraphs):
        if p.startswith('You identify the basis:'):
            paragraphs[i]='You name the sources you selected for the finding, in the order recorded in your notebook. They support the binding, the request to leave, the cut and the door’s impact. You do not add another source merely because it would make the account sound more complete.'
        elif 'empty reconstruction' in p and 'you examined' in p:
            paragraphs[i]='You name the sources you selected for the finding, in the order recorded in your notebook. They support the binding, the request to leave, the cut and the door’s impact. You do not add another source merely because it would make the account sound more complete.'

c['interpretationRules']=[{
 'id':'latch-read-again','title':'Reconsider the working latch',
 'text':'The observed click can remain exactly as it was while its meaning changes: a withdrawing latch did not establish that the exterior binding permitted the whole door to open.',
 'when':allof(cond('hasSource',latch),anyof(cond('hasSource',release),cond('hasSource',film))),
 'relatedRefs':[latch]
}]
c['hints']=[{
 'id':'accident-known-order','label':'Review the kind of evidence this question needs','questionId':qid,
 'when':anyof(cond('hasSource',miriam),cond('hasSource',ada),cond('hasSource',film)),
 'mentions':[],'text':'An account of the order and an account of how the door was held answer different parts of the question. Select a set that supports the full sequence, then decide whether any extra item helps that same factual claim.','reveals':False
}]
# Make each ending acknowledge Henrietta's present disclosure state without altering its prior seen text.
for sid in ['supper','leave']:
    s=S[sid];oldvars=copy.deepcopy(s.get('variants',[]));groups=[{'id':sid+'.base','requires':[],'paragraphs':s['paragraphs']}]+oldvars
    s['variants']=[]
    for g in groups:
        for label,known,p in [
          ('job-known',True,'The Wednesday names are still in your phone. Ada knows she will not be opening the room for your work. Contacting the people you expected there remains yours to do.'),
          ('job-private',False,'The Wednesday names are still in your phone. Ada has not been told that you will be elsewhere on Tuesday. She is putting things away for a room you have already decided not to use.')]:
            condition=knows('ada',job)
            if not known:condition={'op':'not','arg':condition}
            ps=copy.deepcopy(g['paragraphs'])+[p]
            v={'id':g['id']+'.'+label,'requires':g.get('requires',[]),'when':condition,'paragraphs':ps,'paragraphIds':[f"{g['id']}.{label}.p{i+1}" for i in range(len(ps))]}
            s['variants'].append(v)
# Canonical original IDs retained. Derived block IDs are deterministic within this candidate.
for s in c['scenes']:
    s['paragraphIds']=[f"{s['id']}.p{i+1}" for i in range(len(s['paragraphs']))]
    for v in s.get('variants',[]):v['paragraphIds']=[f"{v['id']}.p{i+1}" for i in range(len(v['paragraphs']))]
(ROOT/'src/content/case-v2.json').write_text(json.dumps(c,ensure_ascii=False,indent=2)+'\n')
print('Wrote candidate',len(c['scenes']),'scenes,',len(c['sources']),'sources,',len(c['questions']),'question(s)')
