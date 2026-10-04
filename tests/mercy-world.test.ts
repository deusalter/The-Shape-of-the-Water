import {describe,expect,it} from 'vitest';
import * as THREE from 'three';
import manifest from '../src/world/mercy/staging.json';
import {profileFor,sceneProfiles,targetsFor,nearestTarget,hasStaging} from '../src/world/mercy/profiles';
import {walkable,walkPath,moveWithinArea} from '../src/world/mercy/navigation';
import {buildEnvironment,figure,release} from '../src/world/mercy/geometry';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
describe('Mercy current-scene staging and bounded exploration',()=>{
 it('covers every declared current scene and variant; rejects unknown passages and variants',()=>{
  for(const entry of manifest.scenes){expect(hasStaging(entry.sceneId),entry.sceneId).toBe(true);for(const variant of ('variantIds' in entry?entry.variantIds:[]) as string[])expect(hasStaging(entry.sceneId,variant)).toBe(true);}
  expect(hasStaging('o0.supper')).toBe(false);expect(hasStaging('future-city')).toBe(false);expect(hasStaging(manifest.scenes[0].sceneId,'hidden-variant')).toBe(false);
 });
 it('keeps every spawn and currently offered action reachable around physical geometry',()=>{
  for(const stage of Object.values(sceneProfiles)){expect(walkable(stage.navigation,stage.spawn),stage.id).toBe(true);
   const choices=stage.choiceIds.map(id=>({id,label:`Visible ${id}`}));for(const target of targetsFor(stage,choices)){expect(walkable(stage.navigation,target),`${stage.id}/${target.choiceId}`).toBe(true);expect(walkPath(stage.navigation,stage.spawn,target).length,stage.id).toBeGreaterThan(0);}
  }
 });
 it('does not expose an action through labels, hidden choices, historical notebook entries, or distant proximity',()=>{
  const stage=Object.values(sceneProfiles).find(p=>p.choiceIds.length)!;const id=stage.choiceIds[0];const target=targetsFor(stage,[{id,label:'Currently offered prose'}])[0];
  expect(targetsFor(stage,[])).toEqual([]);expect(targetsFor(stage,[{id:'unoffered.secret',label:'Currently offered prose'}])).toEqual([]);
  expect(nearestTarget(stage,[{id,label:'Currently offered prose'}],target)?.choiceId).toBe(id);expect(nearestTarget(stage,[{id,label:'Currently offered prose'}],{x:7,z:7})).toBeNull();
  expect(profileFor(stage.id,undefined,['Julian-return','secret-departure'])).toEqual(profileFor(stage.id));
 });
 it('prevents tunnelling through obstacles and refuses invalid destinations',()=>{
  const area={bounds:{minX:-4,maxX:4,minZ:-4,maxZ:4},obstacles:[{minX:-.2,maxX:.2,minZ:-2,maxZ:2}]};
  expect(moveWithinArea(area,{x:-2,z:0},{x:4,z:0}).x).toBeLessThan(-.2);expect(walkPath(area,{x:-2,z:0},{x:2,z:0}).length).toBeGreaterThan(1);expect(walkPath(area,{x:-2,z:0},{x:6,z:0})).toEqual([]);expect(moveWithinArea(area,{x:-2,z:0},{x:Infinity,z:0})).toEqual({x:-2,z:0});
 });
 it('builds original actual 3D geometry for all locations, with no faces, portraits or fetched textures',()=>{
  const groups=new Map(Object.values(sceneProfiles).map(profile=>[profile.location,profile]));
  for(const profile of groups.values()){const root=buildEnvironment(profile);const bounds=new THREE.Box3().setFromObject(root);expect(bounds.max.x-bounds.min.x).toBeGreaterThan(15);expect(bounds.max.z-bounds.min.z).toBeGreaterThan(15);root.traverse(object=>{if(object instanceof THREE.Mesh){const materials=Array.isArray(object.material)?object.material:[object.material];for(const material of materials)expect((material as THREE.MeshStandardMaterial).map??null).toBeNull();}});for(const actor of profile.actors){const node=root.getObjectByName(actor.name);expect(node?.userData.faceless).toBe(true);}release(root);}
  for(const name of ['Blaise','Julian','Erasmus','Vera'] as const){const person=figure(name);expect(person.getObjectByName(`${name}_Head`)).toBeDefined();expect(person.getObjectByName('Eye')).toBeUndefined();expect(person.userData.faceless).toBe(true);release(person);}
 });
 it('preserves actual departure absences and the final restored presence',()=>{
  for(const id of ['a0.after-door','a1.empty-theatre','a2.reading','a2.forward','a2.new-morning','a2.letter']){const stage=profileFor(id);if(!stage)return;expect(stage.actors.some(a=>a.name==='Julian'),id).toBe(false);expect(stage.props.includes('horse'),id).toBe(false);expect(stage.props.includes('painted-door'),id).toBe(false);}
  const morning=profileFor('a3.good-morning');if(morning){expect(morning.actors.some(a=>a.name==='Julian')).toBe(true);expect(morning.props).toContain('horse');}
  const market=profileFor('a1.rain-market');if(market){const julian=market.actors.find(a=>a.name==='Julian');expect(julian).toBeDefined();expect(julian!.z).toBeLessThan(-6);expect(julian!.y).toBeGreaterThan(.5);}
 });
 it('keeps the rain suspended in depth and reproducible across visits',()=>{
  const profile=Object.values(sceneProfiles).find(p=>p.location==='market');if(!profile)return;
  const first=buildEnvironment(profile),second=buildEnvironment(profile);const a=first.getObjectByName('Stationary rain') as THREE.LineSegments,b=second.getObjectByName('Stationary rain') as THREE.LineSegments;expect(a).toBeDefined();const positions=a.geometry.getAttribute('position');expect(positions.count).toBeGreaterThan(1000);expect(Array.from(positions.array)).toEqual(Array.from(b.geometry.getAttribute('position').array));const bounds=new THREE.Box3().setFromObject(a);expect(bounds.max.z-bounds.min.z).toBeGreaterThan(2);release(first);release(second);
 });
 it('joins exact writer choices and variants when canonical staging is available',()=>{
  if(!('source' in manifest))return;
  if('contentSha256' in manifest&&manifest.contentSha256){const bytes=readFileSync('src/content/case-v7.json');expect(createHash('sha256').update(bytes).digest('hex')).toBe(manifest.contentSha256);const content=JSON.parse(bytes.toString());expect(manifest.scenes.map(s=>s.sceneId).sort()).toEqual(content.scenes.map((s:{id:string})=>s.id).sort());}
  expect(createHash('sha256').update(readFileSync(String(manifest.source))).digest('hex')).toBe(('sourceSha256' in manifest?manifest.sourceSha256:undefined));
  for(const stage of manifest.scenes){const module=JSON.parse(readFileSync((stage as unknown as {sourceFile:string}).sourceFile,'utf8'));const scene=module.scenes.find((s:{id:string})=>s.id===stage.sceneId);const authoredStage=module.staging.find((s:{sceneId:string})=>s.sceneId===stage.sceneId);expect(stage.actors).toEqual(authoredStage.actors);expect(stage.props).toEqual(authoredStage.props);expect(stage.location).toEqual(authoredStage.location);expect([...profileFor(stage.sceneId)!.choiceIds].sort()).toEqual(scene.choices.map((c:{id:string})=>c.id).sort());for(const variant of scene.variants??[])expect(profileFor(scene.id,variant.id)).toBeDefined();}
 });
});
