import { describe, expect, it } from 'vitest';
import { occasionFixture } from '../src/engine/evidence-occasion-fixture';
import { evidenceFixture } from '../src/engine/evidence-fixture';
import { ancestralOriginsV2 } from '../src/engine/evidence-occasions';
import { compileProofV2,createGameV2,validateContentV2 } from '../src/engine/evidence-v2';
import { createGame } from '../src/engine/game';
import { fixtureContent } from '../src/content/fixture';
import type { ContentV2,GameStateV2 } from '../src/engine/evidence-types';

const edited=(edit:(content:ContentV2)=>void)=>{const content=structuredClone(occasionFixture);edit(content);return validateContentV2(content);};

describe('occasion feature gate and bounded semantic validation',()=>{
  it.each([
    {name:'scene membership',edit:(c:ContentV2)=>{delete c.scenes[0].occasionId;}},
    {name:'source namespace',edit:(c:ContentV2)=>{c.sources[0].occasionId='o1';}},
    {name:'question membership',edit:(c:ContentV2)=>{c.questions[0].occasionId='missing';}},
    {name:'reading membership',edit:(c:ContentV2)=>{delete c.interpretationRules[0].occasionId;}},
    {name:'hint membership',edit:(c:ContentV2)=>{delete c.hints[0].occasionId;}},
    {name:'missing source guard scope',edit:(c:ContentV2)=>{c.interpretationRules[0].when={op:'hasSource',id:'o0.film'};}},
    {name:'missing deduction guard scope',edit:(c:ContentV2)=>{c.scenes[0].choices[0].when={op:'hasDeduction',id:'o0.finding'};}},
    {name:'missing flag guard scope',edit:(c:ContentV2)=>{c.scenes[0].choices[0].when={op:'flag',id:'o0.found'};}},
    {name:'missing proof scope',edit:(c:ContentV2)=>{c.questions[1].proof={op:'ref',refId:'o1.film'};}},
    {name:'historical proof with current source',edit:(c:ContentV2)=>{c.questions[1].proof={op:'ref',refId:'o1.film',scope:'historical'};}},
    {name:'current proof with historical source',edit:(c:ContentV2)=>{c.questions[1].proof={op:'ref',refId:'o0.film',scope:'current'};}},
    {name:'future encountered guard',edit:(c:ContentV2)=>{c.scenes[0].when={op:'hasSource',id:'o2.tableau',scope:'encountered'};}},
    {name:'old permission as current requires',edit:(c:ContentV2)=>{c.scenes.find(s=>s.id==='o1.arrival')!.choices[0].requires=['o0.found'];}},
    {name:'old permission as new effect',edit:(c:ContentV2)=>{c.scenes.find(s=>s.id==='o1.arrival')!.choices[0].effects=['o0.found'];}},
    {name:'inactive interior actor guard',edit:(c:ContentV2)=>{c.scenes.find(s=>s.id==='o1.arrival')!.choices[0].when={op:'npcKnows',characterId:'o0.miriam',refId:'o0.film'};}},
    {name:'unknown occasion guard',edit:(c:ContentV2)=>{c.scenes[0].when={op:'occasionIs',id:'missing'};}},
    {name:'implicit crossing',edit:(c:ContentV2)=>{delete c.scenes.find(s=>s.id==='o0.crossing')!.choices[0].enterOccasion;}},
    {name:'mismatched crossing',edit:(c:ContentV2)=>{c.scenes.find(s=>s.id==='o0.crossing')!.choices[0].enterOccasion='o2';}},
    {name:'skipped crossing',edit:(c:ContentV2)=>{const choice=c.scenes.find(s=>s.id==='o0.crossing')!.choices[0];choice.enterOccasion='o2';choice.target='o2.arrival';}},
    {name:'same-occasion crossing',edit:(c:ContentV2)=>{c.scenes[0].choices[0].enterOccasion='o0';}},
    {name:'backward crossing',edit:(c:ContentV2)=>{c.scenes.find(s=>s.id==='o1.arrival')!.choices[0].enterOccasion='o0';c.scenes.find(s=>s.id==='o1.arrival')!.choices[0].target='o0.arrival';}},
    {name:'question crossing',edit:(c:ContentV2)=>{c.questions[0].target='o1.arrival';}},
    {name:'historical source acquired as current',edit:(c:ContentV2)=>{c.scenes.find(s=>s.id==='o1.arrival')!.sourceIds=['o0.film'];}},
    {name:'historical disclosure',edit:(c:ContentV2)=>{c.scenes.find(s=>s.id==='o1.arrival')!.choices[0].actions=[{type:'disclose',characterId:'o1.simon',refId:'o0.film'}];}},
    {name:'future witnessing',edit:(c:ContentV2)=>{c.scenes[0].choices[0].actions=[{type:'witnessSource',characterId:'o0.miriam',sourceId:'o1.tableau'}];}},
    {name:'actor ambiguity',edit:(c:ContentV2)=>{c.characters.find(actor=>actor.id==='o0.miriam')!.persistent=true;}},
    {name:'implicit persistent actor',edit:(c:ContentV2)=>{delete c.characters[0].persistent;}},
    {name:'nonempty snapshot target',edit:(c:ContentV2)=>{c.characters.find(actor=>actor.id==='miriam_exterior')!.initial.knows=['o0.film'];}},
    {name:'future initial interior source knowledge',edit:(c:ContentV2)=>{c.characters.find(actor=>actor.id==='o0.miriam')!.initial.knows=['o2.tableau'];}},
    {name:'future initial interior deduction knowledge',edit:(c:ContentV2)=>{c.characters.find(actor=>actor.id==='o0.miriam')!.initial.knows=['o1.current-film'];}},
    {name:'future initial persistent source knowledge',edit:(c:ContentV2)=>{c.characters.find(actor=>actor.id==='blaise')!.initial.knows=['o1.tableau'];}},
    {name:'future initial persistent claims',edit:(c:ContentV2)=>{c.characters.find(actor=>actor.id==='blaise')!.initial.claims=['o1.second-disclosure'];}},
    {name:'snapshot into ordinary persistent actor',edit:(c:ContentV2)=>{c.scenes[0].choices[0].actions=[{type:'snapshotCharacter',fromCharacterId:'o0.miriam',toCharacterId:'blaise'}];}},
    {name:'snapshot from persistent actor',edit:(c:ContentV2)=>{c.scenes[0].choices[0].actions=[{type:'snapshotCharacter',fromCharacterId:'blaise',toCharacterId:'miriam_exterior'}];}},
    {name:'cross-occasion speaker',edit:(c:ContentV2)=>{c.sources.find(s=>s.id==='o1.memory-film')!.speakerId='o0.miriam';}},
    {name:'duplicate sourceKey occurrence',edit:(c:ContentV2)=>{c.sources.find(s=>s.id==='o0.ring')!.sourceKey='incident-film';}},
    {name:'missing derivation parent',edit:(c:ContentV2)=>{c.sources.find(s=>s.id==='o1.memory-film')!.derivedFrom=['missing'];}},
    {name:'duplicate derivation parent',edit:(c:ContentV2)=>{c.sources.find(s=>s.id==='o1.memory-film')!.derivedFrom=['o0.film','o0.film'];}},
    {name:'future derivation parent',edit:(c:ContentV2)=>{c.sources.find(s=>s.id==='o1.memory-film')!.derivedFrom=['o2.tableau'];}},
    {name:'self derivation',edit:(c:ContentV2)=>{c.sources.find(s=>s.id==='o1.memory-film')!.derivedFrom=['o1.memory-film'];}},
    {name:'source/source cycle',edit:(c:ContentV2)=>{c.sources.find(s=>s.id==='o1.memory-film')!.derivedFrom=['o1.memory-finding'];c.sources.find(s=>s.id==='o1.memory-finding')!.derivedFrom=['o1.memory-film'];}},
    {name:'source/question cycle',edit:(c:ContentV2)=>{c.sources.find(s=>s.id==='o1.memory-finding')!.derivedFrom=['o1.current-film'];c.questions[1].proof={op:'ref',refId:'o1.memory-finding',scope:'current'};}},
  ])('rejects $name',({edit})=>{expect(edited(edit).ok).toBe(false);});

  it('preserves scoped alternatives through nested proof expansion and deduplication',()=>{
    const witnesses=compileProofV2({op:'all',args:[{op:'ref',refId:'base',scope:'encountered'},{op:'any',args:[{op:'ref',refId:'report',scope:'current'},{op:'ref',refId:'report',scope:'historical'}]}]});
    expect(witnesses).toHaveLength(2);
    expect(witnesses.map(witness=>witness.scopes?.find(scope=>scope.refId==='report')?.scope).sort()).toEqual(['current','historical']);
    expect(witnesses.every(witness=>witness.refs.join(',')==='base,report')).toBe(true);
  });

  it('rejects direct independent retellings statically without treating separate deductions as all their possible origins',()=>{
    expect(edited(c=>{c.questions[3].proof={op:'all',independent:true,args:[{op:'ref',refId:'o0.film',scope:'historical'},{op:'ref',refId:'o1.memory-film',scope:'current'}]};}).ok).toBe(false);
    expect(validateContentV2(occasionFixture).ok).toBe(true);
  });

  it('supports at most 16 finite occasions and rejects duplicate or overlapping namespaces',()=>{
    const sixteen=structuredClone(occasionFixture);sixteen.occasions=Array.from({length:16},(_,index)=>({id:`o${index}`,label:`Visit ${index}`}));
    expect(validateContentV2(sixteen).ok).toBe(true);
    sixteen.occasions.push({id:'o16',label:'Too many'});expect(validateContentV2(sixteen).ok).toBe(false);
    expect(edited(c=>{c.occasions!.push({id:'o0',label:'Duplicate'});}).ok).toBe(false);
    expect(edited(c=>{c.occasions!.push({id:'o0.nested',label:'Ambiguous prefix'});}).ok).toBe(false);
  });

  it('raises only the opt-in aggregate flag bound while retaining 64 per occasion',()=>{
    const raw=structuredClone(occasionFixture);
    for(const occasion of raw.occasions!){
      const existing=new Set([...raw.scenes.filter(s=>s.occasionId===occasion.id).flatMap(s=>s.choices.flatMap(c=>c.effects??[])),...raw.questions.filter(q=>q.occasionId===occasion.id).flatMap(q=>q.effects??[]),...raw.interpretationRules.filter(r=>r.occasionId===occasion.id).flatMap(r=>r.effects??[])]);
      raw.scenes.find(scene=>scene.occasionId===occasion.id)!.choices.push({id:`extra-${occasion.id}`,label:'Declare bounded local flags.',target:raw.scenes.find(scene=>scene.occasionId===occasion.id)!.id,effects:Array.from({length:64-existing.size},(_,index)=>`${occasion.id}.extra-${index}`)});
    }
    expect(validateContentV2(raw).ok).toBe(true);
    raw.scenes[0].choices.at(-1)!.effects!.push('o0.one-too-many');expect(validateContentV2(raw).ok).toBe(false);
  });

  it('accepts 200 ancestry edges and rejects the next edge before gameplay',()=>{
    const raw=structuredClone(occasionFixture);
    for(let index=0;index<200;index++)raw.sources.push({id:`o0.chain-${index}`,occasionId:'o0',kind:'document',title:'Bounded ancestry',text:'Derived report.',provenanceId:'ignored-fresh-origin',derivedFrom:[index===0?'o0.film':`o0.chain-${index-1}`]});
    raw.sources.reverse();expect(validateContentV2(raw).ok).toBe(true);
    raw.sources.unshift({id:'o0.chain-200',occasionId:'o0',kind:'document',title:'Excess ancestry',text:'Derived report.',provenanceId:'ignored-fresh-origin',derivedFrom:['o0.chain-199']});
    const result=validateContentV2(raw);expect(result.ok).toBe(false);if(!result.ok)expect(result.errors.some(error=>error.includes('200 ancestry edges'))).toBe(true);
  });

  it('bounds parent lists and proof expansion and rejects cyclic raw input',()=>{
    expect(edited(c=>{c.sources[0].derivedFrom=Array.from({length:65},(_,index)=>`o0.parent-${index}`);}).ok).toBe(false);
    expect(edited(c=>{c.questions[0].proof={op:'all',args:Array.from({length:9},()=>({op:'any',args:[{op:'ref',refId:'o0.ring',scope:'current'},{op:'ref',refId:'o0.rinse',scope:'current'}]}))};}).ok).toBe(false);
    const cyclic=structuredClone(occasionFixture)as unknown as Record<string,unknown>;cyclic.self=cyclic;expect(validateContentV2(cyclic).ok).toBe(false);
  });

  it('rejects an opted-in opening whose duplicated captured prose exceeds the unchanged run budget',()=>{
    const raw=structuredClone(occasionFixture);raw.scenes[0].paragraphs=Array.from({length:200},()=> 'x'.repeat(49000));
    const checked=validateContentV2(raw);expect(checked.ok).toBe(true);if(!checked.ok)return;
    expect(()=>createGameV2(checked.value)).toThrow(/10 MB checkpoint or encountered-export limit/);
    raw.scenes[1].paragraphs=Array.from({length:200},()=> 'x'.repeat(49000));expect(validateContentV2(raw).ok).toBe(false);
  });

  it('memoizes converging ancestry rather than exponentially expanding repeated recollections',()=>{
    const raw=structuredClone(occasionFixture),sources=raw.sources;
    let previous=['o0.film','o0.ring'];
    for(let depth=0;depth<26;depth++){
      const pair=[`o0.diamond-${depth}-a`,`o0.diamond-${depth}-b`];
      for(const id of pair)sources.push({id,occasionId:'o0',kind:'document',title:'A derived recollection',text:'A report with encountered parents.',provenanceId:'ignored-fresh-origin',derivedFrom:[...previous]});
      previous=pair;
    }
    const checked=validateContentV2(raw);expect(checked.ok).toBe(true);if(!checked.ok)return;
    const state=structuredClone(createGameV2(checked.value))as GameStateV2;
    state.sources=checked.value.sources.filter(source=>source.id.startsWith('o0.diamond')||['o0.film','o0.ring'].includes(source.id)).map(source=>({...source,sceneId:'o0.arrival',revision:0,occasionLabel:'First visit'}));
    const memo=new Map<string,Set<string>>();expect([...ancestralOriginsV2(state,previous[0],memo)].sort()).toEqual(['incident-film','ring-inspection']);
    expect(memo.size).toBe(53);
  });

  it.each([
    {name:'occasion guard',edit:(c:ContentV2)=>{c.scenes[0].when={op:'occasionIs',id:'o0'};}},
    {name:'scope',edit:(c:ContentV2)=>{c.questions[0].proof={op:'ref',refId:'ring',scope:'current'};}},
    {name:'source occurrence',edit:(c:ContentV2)=>{c.sources[0].occasionId='o0';}},
    {name:'source key',edit:(c:ContentV2)=>{c.sources[0].sourceKey='key';}},
    {name:'source derivation',edit:(c:ContentV2)=>{c.sources[0].derivedFrom=['film'];}},
    {name:'persistent actor',edit:(c:ContentV2)=>{c.characters[0].persistent=true;}},
    {name:'transition',edit:(c:ContentV2)=>{c.scenes[0].choices[0].enterOccasion='o0';}},
    {name:'witness action',edit:(c:ContentV2)=>{c.scenes[0].choices[0].actions=[{type:'witnessSource',characterId:'worker',sourceId:'ring'}];}},
    {name:'snapshot action',edit:(c:ContentV2)=>{c.scenes[0].choices[0].actions=[{type:'snapshotCharacter',fromCharacterId:'worker',toCharacterId:'witness'}];}},
  ])('does not silently enable $name in old v2 bundles',({edit})=>{
    const raw=structuredClone(evidenceFixture);edit(raw);expect(validateContentV2(raw).ok).toBe(false);
  });

  it('does not invent an approved continuation for an old migration seed',()=>{
    expect(()=>createGameV2(occasionFixture,{manifestId:'not-approved',manifestHash:'0'.repeat(64),legacyState:createGame(fixtureContent),legacyStateHash:'0'.repeat(64)})).toThrow(/separately reviewed continuation/);
  });
});
