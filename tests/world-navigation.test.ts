import {describe,it,expect} from 'vitest';
import {moveWithinBath,walkable,walkPath} from '../src/world/navigation';

describe('bath walking',()=>{
 it('can reach both speakers around the pool without entering the water',()=>{
  for(const target of [{x:5.6,z:3},{x:-6.3,z:-6.3},{x:5.8,z:-6.6}]){
   const path=walkPath({x:0,z:10.5},target);
   expect(path.length).toBeGreaterThan(1);expect(path.at(-1)).toEqual(target);
   expect(path.every(walkable)).toBe(true);
   let previous={x:0,z:10.5};
   for(const point of path){for(let t=0;t<=1;t+=.1)expect(walkable({x:previous.x+(point.x-previous.x)*t,z:previous.z+(point.z-previous.z)*t})).toBe(true);previous=point;}
  }
 });
 it('rejects a destination in the pool or outside the room',()=>{
  expect(walkPath({x:0,z:10.5},{x:0,z:0})).toEqual([]);
  expect(walkPath({x:0,z:10.5},{x:30,z:30})).toEqual([]);
 });
 it('slides along an obstacle while refusing movement into it',()=>{
  expect(moveWithinBath({x:0,z:6.1},{x:.2,z:-.3})).toEqual({x:.2,z:6.1});
 });
});
