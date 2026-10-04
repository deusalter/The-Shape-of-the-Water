import { describe,it,expect } from 'vitest';
import { installedCase,replayContext,migrationInstalled } from '../src/content/load-evidence';
import { createGameV2,applyCommandV2,availableChoicesV2,confirmationForV2,exportPortableV2,importPortableV2,type GameStateV2,type CommandV2 } from '../src/engine/evidence-v2';
import { createGame } from '../src/engine/game';
import { stateHash } from '../src/engine/hash';
import { move } from './helpers';

if(!installedCase.ok)throw Error(installedCase.errors.join('\n'));
const content=installedCase.value;
function choose(state:GameStateV2,choiceId:string){
  const option=availableChoicesV2(content,state).find(item=>item.id===choiceId);
  const command:CommandV2={type:'choose',choiceId,id:`installed.${state.revision}.${choiceId}`,expectedRevision:state.revision};
  if(option?.ending||option?.irreversible)command.confirmation=confirmationForV2(state,command);
  const next=applyCommandV2(content,state,command);if(!next.ok)throw Error(`${choiceId}: ${next.error.message}`);return next.state;
}
function submit(state:GameStateV2,refs:string[]){const next=applyCommandV2(content,state,{type:'submitDeduction',id:`installed.proof.${state.revision}`,expectedRevision:state.revision,questionId:'accident-sequence',candidateId:'rescue-then-impact',selectedRefs:refs});if(!next.ok)throw Error(next.error.message);return next.state;}
function finish(state:GameStateV2,privateAccount=false){for(const id of ['finding-share','shared-optics','optics-narrow','cabinet-report',privateAccount?'report-private':'report-public',privateAccount?'private-next':'public-next','continue-supper-only'])state=choose(state,id);return state;}
describe('installed male case and reviewed compatibility',()=>{
  it.each(['physical','recording'] as const)('completes %s support with explicit submission and portable replay',route=>{
    let state=createGameV2(content);const prefix=structuredClone(state.transcript);
    for(const id of route==='physical'?['arrival-miriam','bench-record','hub-workshop','workshop-to-test']:['arrival-ada','workshop-record','hub-gallery','gallery-recording'])state=choose(state,id);
    expect(state.deductions).toEqual([]);
    state=submit(state,route==='physical'?['request-before-cut','ada-cut','present-empty-release-test','present-impact-geometry','present-simon-binding']:['continuous-recording']);
    expect(state.npcState.every(npc=>!npc.knows.includes('accident-sequence'))).toBe(true);
    state=finish(state,route==='recording');expect(state.ended).toBe(true);expect(state.transcript.slice(0,prefix.length)).toEqual(prefix);
    const loaded=importPortableV2(content,exportPortableV2(state),replayContext);expect(loaded.ok&&loaded.value).toEqual(state);
  });
  it('installs exact legacy hashes and preserves prior seen text without fabricating new support or intimacy',()=>{
    expect(migrationInstalled).toBe(true);
    const manifest=Object.values(replayContext.manifests)[0],legacy=replayContext.legacyBundles[manifest.fromHash];
    for(const route of [[],['arrival-miriam','bench-panic','miriam-account-record','hub-miriam-private','miriam-private-listen'],['arrival-ada','workshop-record','hub-gallery','gallery-recording','recording-keep']]){
      let old=createGame(legacy);for(const id of route)old=move(old,id,legacy);
      const state=createGameV2(content,{manifestId:manifest.id,manifestHash:stateHash(manifest),legacyState:old,legacyStateHash:stateHash(old)},replayContext);
      expect(state.transcript).toEqual(old.transcript);expect(state.deductions).toEqual([]);
      expect(state.sources.some(source=>source.id==='present-miriam-confidence')).toBe(false);
      expect(state.sources.every(source=>old.observations.some(observation=>observation.id===source.id&&observation.text===source.text))).toBe(true);
      const loaded=importPortableV2(content,exportPortableV2(state),replayContext);expect(loaded.ok&&loaded.value).toEqual(state);
      if(route.includes('recording-keep'))expect(finish(submit(state,['continuous-recording'])).ended).toBe(true);
    }
  });
});
