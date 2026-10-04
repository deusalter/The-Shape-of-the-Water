import {describe,expect,it} from 'vitest';
import * as THREE from 'three';
import {createRenderScheduler} from '../src/world/mercy/renderScheduler';
import {physicalStageKey} from '../src/world/mercy/physicalStage';
import {nearestPreparedTarget,nearestTarget,sceneProfiles,targetsFor} from '../src/world/mercy/profiles';
import {buildEnvironment,release} from '../src/world/mercy/geometry';

function fixture(tick:(dt:number)=>boolean){
 let now=0,id=0;
 const queued=new Map<number,(time:number)=>void>(),cancelled:number[]=[],steps:number[]=[];
 const scheduler=createRenderScheduler({now:()=>now,request:callback=>{queued.set(++id,callback);return id;},cancel:id=>{cancelled.push(id);queued.delete(id);}},dt=>{steps.push(dt);return tick(dt);});
 return {scheduler,queued,cancelled,steps,advance(ms=16){now+=ms;const pending=[...queued];queued.clear();for(const [,callback] of pending)callback(now);},elapse(ms:number){now+=ms;}};
}

describe('Mercy renderer demand and staging',()=>{
 it('coalesces idle wakes, stops at rest, and wakes again after input',()=>{
  const f=fixture(()=>false);
  f.scheduler.wake();f.scheduler.wake();expect(f.queued.size).toBe(1);
  f.advance();expect(f.steps).toEqual([.016]);expect(f.queued.size).toBe(0);
  f.advance(5000);expect(f.steps).toHaveLength(1);
  f.scheduler.wake();f.advance();expect(f.steps).toEqual([.016,.016]);expect(f.queued.size).toBe(0);
 });
 it('runs while movement or camera settling asks for frames and caps long frame gaps',()=>{
  let remaining=3;const f=fixture(()=>--remaining>0);
  f.scheduler.wake();f.advance(1000);expect(f.steps[0]).toBe(.05);expect(f.queued.size).toBe(1);
  f.advance();f.advance();expect(f.steps).toHaveLength(3);expect(f.queued.size).toBe(0);
 });
 it('cancels hidden/offscreen work, retains updates, resumes without elapsed movement, and disposes',()=>{
  const f=fixture(()=>true);f.scheduler.wake();f.advance();
  f.scheduler.setActive(false);expect(f.queued.size).toBe(0);expect(f.cancelled).toHaveLength(1);
  f.scheduler.wake();f.elapse(10000);expect(f.queued.size).toBe(0);
  f.scheduler.setActive(true);f.advance();expect(f.steps).toEqual([.016,.016]);
  f.scheduler.dispose();expect(f.queued.size).toBe(0);
  f.scheduler.wake();f.scheduler.setActive(true);f.advance();expect(f.steps).toHaveLength(2);
 });
 it('retains a wake from inside a render callback and ignores canceled late callbacks',()=>{
  let count=0;const f=fixture(()=>{if(++count===1)f.scheduler.wake();return false;});
  f.scheduler.wake();f.advance();expect(f.queued.size).toBe(1);f.advance();expect(count).toBe(2);
  f.scheduler.wake();const stale=[...f.queued.values()][0];f.scheduler.dispose();stale(200);expect(count).toBe(2);
 });
 it('never reuses cast, props, location or gathered residents under an identical physical key',()=>{
  const p=Object.values(sceneProfiles)[0],key=physicalStageKey(p);
  expect(physicalStageKey({...p,id:'another-scene',variantId:'other',choiceIds:['other']})).toBe(key);
  expect(physicalStageKey({...p,props:[...p.props,'letter']})).not.toBe(key);
  expect(physicalStageKey({...p,actors:[...p.actors,{name:'Vera',x:1,z:1}]})).not.toBe(key);
  expect(physicalStageKey({...p,actors:p.actors.map(a=>({...a,yaw:(a.yaw??0)+1}))})).not.toBe(key);
  expect(physicalStageKey({...p,location:'edge'})).not.toBe(key);
  const table={...p,location:'patron' as const};
  expect(physicalStageKey({...table,id:'a0.table'})).not.toBe(physicalStageKey({...table,id:'a2.table'}));
 });
 it('matches old proximity semantics including strict radius, ties and unoffered choices',()=>{
  for(const p of Object.values(sceneProfiles)){
   const choices=[...p.choiceIds.map(id=>({id,label:`Visible ${id}`})),{id:'unoffered',label:'hidden'}],targets=targetsFor(p,choices);
   for(const point of [p.spawn,...targets,{x:0,z:-2},{x:7,z:7}])expect(nearestPreparedTarget(targets,point)).toEqual(nearestTarget(p,choices,point));
  }
  const a={x:0,z:0,choiceId:'a',label:'A',shortLabel:'A'},b={...a,choiceId:'b'};
  expect(nearestPreparedTarget([a,b],{x:1.65,z:0})).toBeNull();expect(nearestPreparedTarget([a,b],a)).toBe(a);
 });
 it('disposes each shared geometry/material once when releasing a live environment',()=>{
  const environment=buildEnvironment(Object.values(sceneProfiles)[0]);
  const geometries=new Set<THREE.BufferGeometry>(),materials=new Set<THREE.Material>();
  environment.traverse(o=>{if(o instanceof THREE.Mesh||o instanceof THREE.LineSegments){geometries.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:[o.material])materials.add(m);}});
  let geometryDisposals=0,materialDisposals=0;
  for(const g of geometries)g.addEventListener('dispose',()=>geometryDisposals++);
  for(const m of materials)m.addEventListener('dispose',()=>materialDisposals++);
  const shared=[...geometries][0],material=[...materials][0];environment.add(new THREE.Mesh(shared,material));
  release(environment);expect(geometryDisposals).toBe(geometries.size);expect(materialDisposals).toBe(materials.size);
 });
});
