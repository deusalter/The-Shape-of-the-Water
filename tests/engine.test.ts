import { describe, expect, it } from 'vitest';
import { createHash } from 'node:crypto';
import { fixtureContent } from '../src/content/fixture';
import { applyChoice, availableChoices, confirmationFor, contentHash, createGame, currentPassage, serializePlayerExport, validateContent, validateState, type Content } from '../src/engine/game';
import { canonicalJSON, sha256 } from '../src/engine/hash';

import { move } from './helpers';
describe('deterministic engine and disclosure',()=>{
  it('matches independent SHA-256, including Unicode and canonical key ordering',()=>{
    for(const text of ['', 'abc', 'The cup is blue. 茶 🫖', 'a'.repeat(10000)]) expect(sha256(text)).toBe(createHash('sha256').update(text).digest('hex'));
    expect(canonicalJSON({b:[2,1],a:3})).toBe(canonicalJSON({a:3,b:[2,1]}));
  });
  it('proves observation, choice, reinterpretation, consequence and changed revisit without rewriting old text',()=>{
    const opening=createGame(fixtureContent), observed=move(opening,'cup'), rebuffed=move(observed,'accuse');
    expect(rebuffed.relationships[0].text).toContain('declined to help');
    let state=move(rebuffed,'return-worker');state=move(state,'inspect-drain');state=move(state,'return-sink');
    expect(currentPassage(state).paragraphs.join(' ')).toContain('rinse water');
    const originalObservation=state.observations[0], originalPassage=state.transcript[0];
    state=move(state,'propose-rinse');expect(state.interpretations).toHaveLength(1);expect(state.observations[0]).toBe(originalObservation);expect(state.transcript[0]).toBe(originalPassage);
    expect(originalPassage.kind==='passage'&&originalPassage.paragraphs.join(' ')).toContain('dry ring');
    expect(Object.isFrozen(state.observations[0])).toBe(true);
    state=move(state,'finish-fixture');expect(state.ended).toBe(true);expect(availableChoices(fixtureContent,state)).toEqual([]);
    expect(validateState(fixtureContent,JSON.parse(JSON.stringify(state)))).toEqual({ok:true,value:state});
  });
  it.each(['ask-gently','accuse'])('the actual alternate interpersonal path %s permits completion',choice=>{
    let state=createGame(fixtureContent);for(const id of ['cup',choice,'return-worker','inspect-drain','return-sink','propose-rinse','finish-fixture']) state=move(state,id);
    expect(state.ended).toBe(true);
  });
  it('never exports unseen scene paragraphs, variants, labels or records',()=>{
    const hidden:Content=structuredClone(fixtureContent);
    hidden.scenes.find(s=>s.id==='finish')!.paragraphs=['NEVER_SEEN_ENDING_29'];
    hidden.scenes.find(s=>s.id==='worker')!.variants![0].paragraphs=['UNHEARD_VARIANT_48'];
    hidden.scenes[0].choices.find(c=>c.id==='propose-rinse')!.label='UNAVAILABLE_LABEL_17';
    hidden.scenes[0].choices.find(c=>c.id==='propose-rinse')!.interpretation!.text='UNEARNED_READING_18';
    const valid=validateContent(hidden);if(!valid.ok)throw new Error(valid.errors.join(';'));
    let state=createGame(valid.value);state=move(state,'cup',valid.value);state=move(state,'accuse',valid.value);
    const exported=serializePlayerExport(state);
    for(const marker of ['NEVER_SEEN_ENDING_29','UNHEARD_VARIANT_48','UNAVAILABLE_LABEL_17','UNEARNED_READING_18']) expect(exported).not.toContain(marker);
    expect(exported).toContain('Look for yourself');expect(exported).toContain('Accuse the worker');
    expect(availableChoices(valid.value,createGame(valid.value)).map(c=>c.label)).not.toContain('UNAVAILABLE_LABEL_17');
  });
  it('replays the same command sequence exactly and deduplicates old delivery before stale checks',()=>{
    const initial=createGame(fixtureContent), command={id:'same',choiceId:'cup',expectedRevision:0};
    const result=applyChoice(fixtureContent,initial,command);expect(result.ok).toBe(true);if(!result.ok)return;
    expect(applyChoice(fixtureContent,initial,command)).toEqual(result);
    expect(applyChoice(fixtureContent,result.state,{...command,choiceId:'accuse'})).toEqual({ok:true,state:result.state,duplicate:true});
    const stale=applyChoice(fixtureContent,result.state,{id:'new',choiceId:'accuse',expectedRevision:0});expect(stale.ok).toBe(false);if(!stale.ok)expect(stale.error.code).toBe('stale-command');expect(stale.state).toBe(result.state);
  });
  it('requires a payload- and state-bound receipt for irreversible endings',()=>{
    let state=createGame(fixtureContent);for(const id of ['cup','inspect-drain','return-sink','propose-rinse'])state=move(state,id);
    const command={id:'end',choiceId:'finish-fixture',expectedRevision:state.revision};
    expect(applyChoice(fixtureContent,state,command).ok).toBe(false);
    const confirmation=confirmationFor(state,command);
    expect(applyChoice(fixtureContent,state,{...command,id:'changed',confirmation}).ok).toBe(false);
    expect(applyChoice(fixtureContent,state,{...command,confirmation}).ok).toBe(true);
    const changed=move(state,'inspect-drain');expect(applyChoice(fixtureContent,changed,{...command,expectedRevision:changed.revision,confirmation}).ok).toBe(false);
  });
  it('rejects altered seen text, invented observations, extra fields and exact-hash mismatches',()=>{
    const state=move(createGame(fixtureContent),'cup');
    const altered=JSON.parse(JSON.stringify(state));altered.transcript[0].paragraphs[0]='Invented';expect(validateState(fixtureContent,altered).ok).toBe(false);
    const injected=JSON.parse(JSON.stringify(state));injected.observations.push({id:'secret',text:'Hidden answer',sceneId:'finish',revision:1});expect(validateState(fixtureContent,injected).ok).toBe(false);
    expect(validateState(fixtureContent,{...state,hiddenTruth:'extra'}).ok).toBe(false);
    const changed=structuredClone(fixtureContent);changed.scenes[0].paragraphs[0]+=' Changed wording.';expect(contentHash(changed)).not.toBe(state.contentHash);expect(validateState(changed,state).ok).toBe(false);
    const forgedReceipt=JSON.parse(JSON.stringify(state));forgedReceipt.transcript[1].confirmation={stateHash:'unverified',actionHash:'unverified',acknowledged:true,hidden:'UNSEEN_FICTION'};expect(validateState(fixtureContent,forgedReceipt).ok).toBe(false);
  });
  it('validates unknown fields, missing links, impossible start gates and inconsistent repeated records',()=>{
    expect(validateContent({...fixtureContent,hiddenNotes:'unexpected'}).ok).toBe(false);
    const missing=structuredClone(fixtureContent);missing.scenes[0].choices[0].target='absent';expect(validateContent(missing).ok).toBe(false);
    const locked=structuredClone(fixtureContent);locked.scenes[0].requires=['water'];expect(validateContent(locked).ok).toBe(false);
    const records=structuredClone(fixtureContent);records.scenes[0].choices[1].observation={id:'ring',text:'Different fact'};expect(validateContent(records).ok).toBe(false);
  });
});
