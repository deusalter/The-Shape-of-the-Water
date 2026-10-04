import {describe,it,expect} from 'vitest';
import {occasionFixture} from '../src/engine/evidence-occasion-fixture';
import {applyCommandV2,availableChoicesV2,createGameV2,validateContentV2,exportPortableV2,importPortableV2,type ContentV2,type GameStateV2} from '../src/engine/evidence-v2';

function checked(raw:ContentV2){const result=validateContentV2(raw);if(!result.ok)throw Error(result.errors.join('\n'));return result.value;}
function choose(content:ContentV2,state:GameStateV2,choiceId:string){const result=applyCommandV2(content,state,{type:'choose',choiceId,id:`review-fix.${state.revision}`,expectedRevision:state.revision});if(!result.ok)throw Error(result.error.message);return result.state;}
const trace=(content:ContentV2,state:GameStateV2,ids:string[])=>ids.reduce((s,id)=>choose(content,s,id),state);
describe('independently reproduced occasion review defects',()=>{
  it('rejects fresh provenance assigned to another occurrence of the same declared source',()=>{
    const raw=structuredClone(occasionFixture);raw.sources.find(source=>source.id==='o1.film')!.provenanceId='invented-new-origin';
    const result=validateContentV2(raw);expect(result.ok).toBe(false);if(!result.ok)expect(result.errors.join(' ')).toContain('originating provenance');
  });
  it('rejects contradictory fixed ancestry behind a repeated sourceKey',()=>{
    const raw=structuredClone(occasionFixture);raw.sources.find(source=>source.id==='o1.film')!.derivedFrom=['o0.ring'];
    expect(validateContentV2(raw).ok).toBe(false);
  });
  it.each([true,false])('checks the selected conclusion ancestry at acquisition (same=%s)',same=>{
    const raw=structuredClone(occasionFixture);raw.sources.find(source=>source.id==='o1.film')!.derivedFrom=['o0.finding'];const content=checked(raw);
    let state=trace(content,createGameV2(content),['inspect-old-film','test-old-rinse']);
    const proof=applyCommandV2(content,state,{type:'submitDeduction',questionId:'o0.finding',candidateId:'supported',selectedRefs:same?['o0.film']:['o0.ring','o0.rinse'],id:'finding',expectedRevision:state.revision});if(!proof.ok)throw Error(proof.error.message);
    state=trace(content,proof.state,['prepare-chair','front-departure','first-crossing']);const before=JSON.stringify(state);
    expect(availableChoicesV2(content,state).some(choice=>choice.id==='inspect-current-film')).toBe(same);
    const result=applyCommandV2(content,state,{type:'choose',choiceId:'inspect-current-film',id:'repeat',expectedRevision:state.revision});expect(result.ok).toBe(same);
    expect(JSON.stringify(state)).toBe(before);
    if(!same)expect(result.state).toBe(state);
    else{
      expect(importPortableV2(content,exportPortableV2(result.state)).ok).toBe(true);
      const independent=applyCommandV2(content,result.state,{type:'submitDeduction',questionId:'o1.independent-film',candidateId:'supported',selectedRefs:['o0.film','o1.film'],id:'independent',expectedRevision:result.state.revision});
      expect(independent.ok).toBe(false);
    }
  });
  it.each([true,false])('runs current closure from historical material before destination entry (gated=%s)',gated=>{
    const raw=structuredClone(occasionFixture);
    raw.interpretationRules.push({id:'o1.on-arrival',occasionId:'o1',title:'Remember at arrival',text:'Earlier evidence is remembered.',when:{op:'hasSource',id:'o0.film',scope:'historical'},relatedRefs:['o0.film'],effects:['o1.remembered-on-arrival']});
    const destination=raw.scenes.find(scene=>scene.id==='o1.arrival')!;
    destination.variants=[{id:'o1.remembered-variant',requires:['o1.remembered-on-arrival'],paragraphs:['HISTORICAL_READING_VARIANT']}];
    if(gated)destination.requires=['o1.remembered-on-arrival'];
    const content=checked(raw),state=trace(content,createGameV2(content),['inspect-old-film','prepare-chair','front-departure']);const before=JSON.stringify(state);
    expect(availableChoicesV2(content,state).some(choice=>choice.id==='first-crossing')).toBe(true);expect(JSON.stringify(state)).toBe(before);
    const arrived=choose(content,state,'first-crossing');expect(arrived.transcript.at(-1)).toMatchObject({variantId:'o1.remembered-variant',paragraphs:['HISTORICAL_READING_VARIANT']});
    expect(arrived.transcript.slice(0,state.transcript.length)).toEqual(state.transcript);expect(importPortableV2(content,exportPortableV2(arrived)).ok).toBe(true);
  });
});
