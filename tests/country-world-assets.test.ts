import {readFileSync} from 'node:fs';
import {describe,expect,it} from 'vitest';
import content from '../src/content/case-v5.json';
import staging from '../narrative/rebuild/STAGING-V5.json';
import {profileFor,hasStaging,sceneProfiles,targetsFor,nearestTarget} from '../src/world/country/profiles';
import {walkable,walkPath,moveWithinArea} from '../src/world/country/navigation';
const data=readFileSync('public/world/country/first-country-locations.glb');
const model=JSON.parse(data.subarray(20,20+data.readUInt32LE(12)).toString('utf8')) as {nodes:{name?:string}[];images?:unknown[];textures?:unknown[]};
const names=new Set(model.nodes.map(node=>node.name));
describe('country authored staging and original asset joins',()=>{
 it('covers only all exact new compiled scenes, choices and current variants',()=>{
  const newIds=new Set(staging.newScenes.map(scene=>scene.sceneId));
  for(const scene of content.scenes){
   if(!newIds.has(scene.id)){expect(hasStaging(scene.id)).toBe(false);continue;}
   const profile=profileFor(scene.id,`${scene.id}.base`);expect(profile,scene.id).toBeDefined();
   const area=staging.newScenes.find(entry=>entry.sceneId===scene.id)!.area;
   const groups:Record<string,string>={'orchard-roof':'OrchardWedding','orchard-cradle':'OrchardWedding','orchard-root':'OrchardWedding','orchard-path':'OrchardWedding',theatre:'DryTheatre','theatre-floor':'DryTheatre','theatre-stage':'DryTheatre','theatre-door':'DryTheatre',house:'LowHouse'};
   expect(profile!.geometryGroup,scene.id).toBe(groups[area]);
   expect(Object.keys(profile!.actions).sort()).toEqual(scene.choices.map(choice=>choice.id).sort());
   for(const variant of scene.variants??[])expect(profileFor(scene.id,variant.id),variant.id).toBeDefined();
  }
  expect(profileFor('future-country')).toBeUndefined();expect(profileFor('o0.house-window','unencountered')).toBeUndefined();
 });
 it('is self contained and gives every staged actor/prop/action an actual model and bounded route',()=>{
  expect(data.subarray(0,4).toString()).toBe('glTF');expect(data.readUInt32LE(8)).toBe(data.length);
  expect(model.images??[]).toHaveLength(0);expect(model.textures??[]).toHaveLength(0);
  expect(names.has('Blaise')).toBe(true);
  for(const profile of Object.values(sceneProfiles)){
   expect(names.has(profile.geometryGroup)).toBe(true);expect(walkable(profile.navigation,profile.spawn),profile.id).toBe(true);
   for(const actor of profile.actors)expect(names.has(actor.model),actor.model).toBe(true);
   for(const part of Object.keys(profile.partVisibility??{}))expect(names.has(part),part).toBe(true);
   for(const anchor of Object.values(profile.actions)){
    expect(names.has(anchor.object),anchor.object).toBe(true);expect(walkable(profile.navigation,anchor),profile.id).toBe(true);
    expect(walkPath(profile.navigation,profile.spawn,anchor).length,`${profile.id}:${anchor.object}`).toBeGreaterThan(0);
   }
  }
 });
 it('keeps rooted Dora distant during cradle conversation and reports beside the actual root',()=>{
  const distant=profileFor('o0.cradle-account')!,report=profileFor('o0.orchard-report')!;
  const root=distant.actors.find(actor=>actor.model==='DoraRoot')!;
  expect(Math.hypot(distant.spawn.x-root.x,distant.spawn.z-root.z)).toBeGreaterThan(10);
  expect(Math.hypot(report.spawn.x-root.x,report.spawn.z-root.z)).toBeLessThan(2);
  expect(distant.actors.some(actor=>['TableDora','Noor','Emil','Rene'].includes(actor.model))).toBe(false);
  expect(profileFor('o0.cradle-loan')!.actors.find(actor=>actor.model==='BranchCradle')?.carried).toBe(true);
  expect(report.actors.some(actor=>actor.model==='CradleRubbing')).toBe(true);
  expect(profileFor('o0.orchard-report','o0.orchard-report-with-cradle')!.actors.some(actor=>actor.model==='CradleRubbing')).toBe(false);
 });
 it('turns the same source floor and leaves it local; omits later assertions of an unperformed reinstall',()=>{
  const source=(id:string)=>profileFor(id)!.actors.find(actor=>actor.model==='SourceFloorPanel');
  expect(source('o0.dry-rehearsal')?.pitch).toBe(-Math.PI/2);expect(source('o0.source-floor')?.y).toBe(1.1);
  expect(source('o0.panel-arrangement')?.y).toBe(.3);expect(source('o0.pipe-discovery')).toBeUndefined();
  expect(profileFor('o0.dry-house-departure')!.actors.some(actor=>actor.model==='CountryBluePicture')).toBe(true);
  for(const id of ['o0.house-window','o0.emil-account','o0.leaf-return']){
   expect(profileFor(id)!.actors.map(actor=>actor.model)).toEqual(['Emil']);
   expect(profileFor(id,undefined,['o0.cradle-loan','o0.pipe-loan'])!.actors.map(actor=>actor.model)).toEqual(['Emil']);
  }
  expect(profileFor('o0.house-door')!.actors.some(actor=>actor.model==='Rene')).toBe(true);
  expect(profileFor('o0.rene-arrival')!.actors.some(actor=>actor.model==='ReneSeated')).toBe(true);
 });
 it('never grants actions from walking, labels, hidden choices, or out-of-bounds destinations',()=>{
  const stage=profileFor('o0.cradle-account')!,choice={id:'o0.borrow-cradle',label:'Current offered text'};
  expect(targetsFor(stage,[])).toEqual([]);expect(targetsFor(stage,[{id:'secret',label:'Borrow cradle'}])).toEqual([]);
  expect(nearestTarget(stage,[choice],stage.spawn)?.label).toBe(choice.label);
  expect(nearestTarget(stage,[choice],{x:-8,z:-6})).toBeNull();expect(walkPath(stage.navigation,stage.spawn,{x:20,z:0})).toEqual([]);
  expect(moveWithinArea(stage.navigation,stage.spawn,{x:0,z:100}).z).toBeLessThanOrEqual(stage.navigation.bounds.maxZ);
 });
});
