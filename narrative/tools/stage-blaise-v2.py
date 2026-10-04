"""Preserve the selected evidence mechanics, discard superseded protagonist content.
This stages a candidate only; root controls live activation and compatibility.
"""
from pathlib import Path
import json,copy
ROOT=Path(__file__).resolve().parents[2]
c=json.loads((ROOT/'narrative/expansion/rejected/case-v2-henrietta-unactivated.json').read_text())
old=json.loads((ROOT/'src/content/case.json').read_text())
O={s['id']:s for s in old['scenes']}
remove={'arrival_questions','ada_job','ada_job_date','ada_job_private'}
c['scenes']=[s for s in c['scenes'] if s['id'] not in remove]
S={s['id']:s for s in c['scenes']}
c['beliefIds']=['simon_sabotage']
c['sources']=[s for s in c['sources'] if s['id'] not in {'present-job-offer','present-job-acceptance-date'}]
for ch in c['characters']:
    if ch['id']=='henrietta':ch.update(id='blaise',name='Blaise Bloom',initial={'knows':[],'believes':[],'claims':[]})
    ch['initial']['believes']=[b for b in ch['initial']['believes'] if b!='henrietta_room_expected']
    if ch['id'] in ('ada','miriam'):ch['initial']['claims']=[]
    if ch['id']=='simon':ch['initial']['claims']=['present-sabotage-message','present-unconditioned-card']
S['arrival']['paragraphs']=copy.deepcopy(O['arrival']['paragraphs'])
S['arrival']['paragraphs'][-1:-1]=[
 '“Blaise?” Simon says. He has been waiting for you to look at him. You have been watching your mouth between the rabbit’s ears. When you turn, the face leaves the glass before you have stopped expecting it to be there.',
 'You know this room by its sounds: a wet foot leaving the tiles, a chair dragged under the gallery, the short return of a voice from the wall behind the diving board. Simon has made something here that he says can be seen without a person. You want to know what he means by that before he uses your presence to establish it.',
 'Ada shifts the saucepan across her knees. Miriam takes one finger out from under the peas and puts it back. You put your own hands in your pockets. The cold glass has not touched them, but you keep checking that they are empty.'
]
S['arrival']['choices']=copy.deepcopy(O['arrival']['choices'])
S['arrival']['sourceIds']=['present-sabotage-message']
S['concourse']['choices']=[q for q in S['concourse']['choices'] if q['id']!='hub-tell-ada-job']
for sid in ['supper','leave']:
    S[sid]['paragraphs']=copy.deepcopy(O[sid]['paragraphs'])
    if O[sid].get('variants'):
        S[sid]['variants']=copy.deepcopy(O[sid]['variants'])
        for i,v in enumerate(S[sid]['variants']):v['id']=f'{sid}.variant{i+1}'
    else:S[sid].pop('variants',None)
for s in c['scenes']:
    s['paragraphIds']=[f"{s['id']}.p{i+1}" for i in range(len(s['paragraphs']))]
    for v in s.get('variants',[]):v['paragraphIds']=[f"{v['id']}.p{i+1}" for i in range(len(v['paragraphs']))]
# Preserve literal legacy record IDs where the new source is exactly the same.
aliases={
 'present-miriam-sequence':'request-before-cut',
 'present-ada-sequence':'ada-cut',
 'present-latch-click':'latch-click',
 'present-incident-recording':'continuous-recording',
}
def remap(value):
    if isinstance(value,str):return aliases.get(value,value)
    if isinstance(value,list):return [remap(x) for x in value]
    if isinstance(value,dict):return {k:remap(v) for k,v in value.items()}
    return value
c=remap(c)
existing={source['id']:source for source in c['sources']}
legacy_meta={
 'claimed-sight':('The kept gallery note','document','gallery-empty-record-and-card',None),
 'binding-test':('The kept reconstruction note','observation','empty-cabinet-reconstruction',None),
 'simon-account':('Simon’s fuller acknowledgment','statement','simon-binding-account','simon'),
 'stripe-control':('The kept optical control','observation','open-optical-control',None),
 'bounded-finding':('The account delivered','statement','blaise-delivered-finding','blaise'),
}
for scene in c['scenes']:
    for choice in scene['choices']:
        rec=choice.get('observation')
        if not rec or rec['id'] in existing:continue
        title,kind,prov,speaker=legacy_meta[rec['id']]
        source={'id':rec['id'],'title':title,'text':rec['text'],'kind':kind,'provenanceId':prov}
        if speaker:source['speakerId']=speaker
        c['sources'].append(source);existing[source['id']]=source
# A kept reconstruction note may supply the same performed test and acknowledgment.
q=c['questions'][0]
q['effects']=['deduced_accident','proof_cut','proof_timing','proof_binding']
q['proof']={'op':'any','args':[
 {'op':'ref','refId':'continuous-recording'},
 {'op':'all','args':[
  {'op':'ref','refId':'request-before-cut'}, {'op':'ref','refId':'ada-cut'},
  {'op':'any','args':[
   {'op':'ref','refId':'binding-test'},
   {'op':'all','args':[{'op':'ref','refId':'present-empty-release-test'},{'op':'ref','refId':'present-impact-geometry'},{'op':'any','args':[{'op':'ref','refId':'present-simon-binding'},{'op':'ref','refId':'simon-account'}]}]}
  ]}
 ]}
]}
q['allowedCorroborators']=['latch-click','present-simon-attention','present-plan','present-empty-release-test','present-impact-geometry','present-simon-binding','simon-account','binding-test','request-before-cut','ada-cut','continuous-recording']
text=json.dumps(c,ensure_ascii=False,indent=2)+'\n' 
for forbidden in ['Henrietta','henrietta','present-job','ada_job','Wednesday appointments','workroom']:
    if forbidden in text:raise RuntimeError('superseded content remains: '+forbidden)
(ROOT/'src/content/case-v2.json').write_text(text)
print('Staged male candidate:',len(c['scenes']),'scenes,',len(c['sources']),'sources')
