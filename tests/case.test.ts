import { describe,expect,it } from 'vitest';
import data from '../src/content/case.json';
import { availableChoices,createGame,serializePlayerExport,validateContent,validateState } from '../src/engine/game';
import { move } from './helpers';
const result=validateContent(data);if(!result.ok)throw new Error(result.errors.join('\n'));const content=result.value;
describe('provisional authored case routes',()=>{
  it('completes after both interpersonal failures and preserves original evidence through reinterpretation/revisit',()=>{
    let state=createGame(content);
    const route=['arrival-cabinet','cabinet-infer','hub-test','release-record','hub-bench','bench-panic','miriam-account-record','hub-workshop','workshop-record','hub-gallery','gallery-accuse','simon-account-record','hub-shared','shared-optics','optics-narrow','cabinet-revise','hub-report','report-public','public-next','continue-stay'];
    let original:unknown,firstCabinet:unknown;
    route.forEach(id=>{state=move(state,id,content);if(id==='cabinet-infer'){original=state.observations.find(record=>record.id==='latch-click');firstCabinet=state.transcript.find(entry=>entry.kind==='passage'&&entry.sceneId==='cabinet');}});
    expect(state.ended).toBe(true);expect(state.currentScene).toBe('supper');expect(state.flags).toEqual(expect.arrayContaining(['pressed_miriam','shamed_simon','public_correction']));
    expect(state.observations.find(record=>record.id==='latch-click')).toBe(original);expect(state.transcript.find(entry=>entry.kind==='passage'&&entry.sceneId==='cabinet')).toBe(firstCabinet);
    expect(state.interpretations.map(record=>record.id)).toEqual(expect.arrayContaining(['early-exit','revised-exit']));
    const cabinetVisits=state.transcript.filter(entry=>entry.kind==='passage'&&entry.sceneId==='cabinet');expect(cabinetVisits.length).toBeGreaterThan(1);expect(cabinetVisits[0]).not.toEqual(cabinetVisits.at(-1));
    expect(validateState(content,JSON.parse(JSON.stringify(state))).ok).toBe(true);
  });
  it('completes the alternate recording route without requiring interpersonal agreement',()=>{
    let state=createGame(content);
    for(const id of ['arrival-cabinet','cabinet-cautious','hub-gallery','gallery-recording','recording-keep','hub-shared','shared-optics','optics-measure','cabinet-report','report-private','private-next','continue-leave'])state=move(state,id,content);
    expect(state.ended).toBe(true);expect(state.currentScene).toBe('leave');expect(state.flags).toEqual(expect.arrayContaining(['heard_recording','proof_cut','proof_timing','proof_binding','private_finding']));
    expect(state.flags).not.toContain('heard_ada');expect(validateState(content,state).ok).toBe(true);
  });
  it('initial transcript and export contain no ending, unreached record or conditional future paragraph',()=>{
    const state=createGame(content),text=serializePlayerExport(state);
    const ending=content.scenes.find(scene=>scene.id==='supper')!;
    for(const paragraph of ending.paragraphs)expect(text).not.toContain(paragraph);
    for(const variant of ending.variants??[])for(const paragraph of variant.paragraphs)expect(text).not.toContain(paragraph);
    expect(state.observations).toEqual([]);expect(state.interpretations).toEqual([]);expect(state.relationships).toEqual([]);
    const future=content.scenes.find(scene=>scene.id==='report')!.choices[0].label;expect(availableChoices(content,state).map(choice=>choice.label)).not.toContain(future);
  });
});
