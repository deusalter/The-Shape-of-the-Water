import { describe, expect, it } from 'vitest';
import { moveWithinArea, walkPath, walkable, type NavigationArea } from '../src/world/rebuild/navigation';
import { nearestTarget, profileFor, targetsFor, type SceneProfile } from '../src/world/rebuild/profiles';
const area: NavigationArea={bounds:{minX:-5,maxX:5,minZ:-5,maxZ:5},obstacles:[{minX:-.3,maxX:.3,minZ:-5,maxZ:5}]};
const fixture: SceneProfile={id:'test',title:'Test',asset:'fixture',geometryGroup:'Fixture',spawn:{x:-2,z:0},navigation:area,actors:[],actions:{'offered-action':{object:'Person',shortLabel:'Person',x:-2,z:0},'hidden-action':{object:'Secret',shortLabel:'Secret',x:-2,z:0}}};
describe('rebuild local navigation',()=>{
  it('cannot cross an authored gate by keyboard delta, large frame, or click route',()=>{
    expect(moveWithinArea(area,{x:-2,z:0},{x:4,z:0}).x).toBeLessThan(-.3);
    expect(walkPath(area,{x:-2,z:0},{x:2,z:0})).toEqual([]);
    expect(walkPath(area,{x:-2,z:0},{x:8,z:0})).toEqual([]);
  });
  it('routes around furnishings without entering the collision volume',()=>{
    const furniture:NavigationArea={bounds:area.bounds,obstacles:[{minX:-1,maxX:1,minZ:-1,maxZ:1}]};
    const from={x:-3,z:0},to={x:3,z:0};const route=walkPath(furniture,from,to);
    expect(route.length).toBeGreaterThan(2);expect(route.at(-1)).toEqual(to);
    for(const point of route)expect(walkable(furniture,point)).toBe(true);
    let at=from;
    for(const next of route){at=moveWithinArea(furniture,at,{x:next.x-at.x,z:next.z-at.z});expect(at.x).toBeCloseTo(next.x,4);expect(at.z).toBeCloseTo(next.z,4);}
  });
  it('slides along furniture and rejects nonfinite movement',()=>{
    const moved=moveWithinArea(area,{x:-.5,z:0},{x:.5,z:1});expect(moved.x).toBeLessThan(-.3);expect(moved.z).toBeCloseTo(1);
    expect(moveWithinArea(area,{x:-2,z:0},{x:NaN,z:0})).toEqual({x:-2,z:0});
  });
});
describe('rebuild encountered-action projection',()=>{
  it('offers only ids passed by the actual player projection, retaining its exact label',()=>{
    const choices=[{id:'offered-action',label:'Current seen choice'},{id:'unknown-action',label:'Hidden Person'}];
    expect(targetsFor(fixture,choices)).toEqual([{...fixture.actions['offered-action'],choiceId:'offered-action',label:'Current seen choice'}]);
    expect(nearestTarget(fixture,[],fixture.spawn)).toBeNull();
    expect(nearestTarget(fixture,choices,{x:-4.5,z:4})).toBeNull();
  });
  it('does not invent staging for unknown scenes or passage variants',()=>{
    expect(profileFor('unencountered-scene')).toBeUndefined();
    expect(profileFor('unencountered-scene','future-variant')).toBeUndefined();
  });
});
