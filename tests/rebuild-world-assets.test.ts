import {readFileSync} from 'node:fs';
import {describe,expect,it} from 'vitest';
import {profileFor,sceneProfiles,targetsFor} from '../src/world/rebuild/profiles';
import content from '../src/content/case-v4.json';
import {walkable} from '../src/world/rebuild/navigation';
const data=readFileSync('public/world/rebuild/second-mouth-supper.glb');
const model=JSON.parse(data.subarray(20,20+data.readUInt32LE(12)).toString('utf8')) as {nodes:{name?:string}[];images?:unknown[];textures?:unknown[]};
const names=new Set(model.nodes.map(node=>node.name));
describe('selected A bounded scene/model joins',()=>{
  it('stages every actual first-movement scene, variant, and authored action id',()=>{
    for(const scene of content.scenes){
      const profile=profileFor(scene.id,`${scene.id}.base`);expect(profile,scene.id).toBeDefined();
      for(const choice of scene.choices)expect(profile!.actions[choice.id],choice.id).toBeDefined();
      for(const variant of scene.variants??[])expect(profileFor(scene.id,variant.id),variant.id).toBeDefined();
    }
  });
  it('loads an actual self-contained GLB with every staged group and actor',()=>{
    expect(data.subarray(0,4).toString()).toBe('glTF');expect(data.readUInt32LE(8)).toBe(data.length);
    expect(model.images??[]).toHaveLength(0);expect(model.textures??[]).toHaveLength(0);
    expect(names.has('Blaise')).toBe(true);expect(names.has('RootHand')).toBe(true);
    for(const profile of Object.values(sceneProfiles)){
      expect(names.has(profile.geometryGroup)).toBe(true);expect(walkable(profile.navigation,profile.spawn)).toBe(true);
      for(const actor of profile.actors)expect(names.has(actor.model)).toBe(true);
      for(const part of Object.keys(profile.partVisibility??{}))expect(names.has(part)).toBe(true);
      for(const anchor of Object.values(profile.actions)){expect(names.has(anchor.object),anchor.object).toBe(true);expect(walkable(profile.navigation,anchor)).toBe(true);}
    }
  });
  it('stages the observed hand anomaly without labeling a body as real or a copy',()=>{
    const before=profileFor('o0.supper','o0.supper.base')!;
    const after=profileFor('o0.exposure-kept','o0.exposure-kept.base')!;
    expect(before.partVisibility?.Dora_LeftHand).toBe(false);expect(after.partVisibility?.Dora_LeftHand).toBe(true);
    expect(before.actors.some(actor=>actor.model==='Dora')).toBe(true);expect(after.actors.some(actor=>actor.model==='Dora')).toBe(true);
    expect(before.geometryGroup).toBe('SupperRoom');expect(after.geometryGroup).toBe('SupperRoom');
    expect(names.has('RootHand')).toBe(true);
    expect(targetsFor(after,[])).toEqual([]);
  });
  it('preserves the occupied cast until actual removal, including optional pre-removal cup tests',()=>{
    expect(profileFor('o0.cast-inspection')!.actors.find(actor=>actor.model==='DoraPlaceCast')?.y).toBe(0);
    expect(profileFor('o0.cast-removal')!.actors.find(actor=>actor.model==='DoraPlaceCast')?.y).toBe(-1.05);
    for(const id of ['o0.niche','o0.return-test','o0.return-declined']){
      expect(profileFor(id,`${id}.base`,[])!.actors.find(actor=>actor.model==='DoraPlaceCast')?.y).toBe(0);
      expect(profileFor(id,`${id}.base`,['o0.cast-removed'])!.actors.find(actor=>actor.model==='DoraPlaceCast')?.y).toBe(-1.05);
      expect(profileFor(id,`${id}.base`,['o0.cast-source'])!.actors.find(actor=>actor.model==='DoraPlaceCast')?.y).toBe(0);
    }
  });
  it('keeps the upstairs Doras and rooted speaking piece out of lower conversation',()=>{
    const lower=profileFor('o0.lower-passage','o0.lower-passage.base')!;
    expect(lower.geometryGroup).toBe('LowerPassage');expect(lower.actors.filter(actor=>actor.model.startsWith('Noor')||actor.model.startsWith('Dora')).map(actor=>actor.model)).toEqual(['NoorLower','DoraPlaceCast']);
    expect(lower.actors.some(actor=>['Dora','DoraStanding','SpeakingPiece'].includes(actor.model))).toBe(false);
    expect(profileFor('o0.lower-passage','unencountered-variant')).toBeUndefined();
    expect(profileFor('whole-country')).toBeUndefined();
  });
});
