export interface Point {x:number;z:number}
export const bounds={minX:-9.35,maxX:9.35,minZ:-13.3,maxZ:13.0};
// Walking bounds describe the coarse production mesh, not forensic measurements.
export const obstacles=[
  {minX:-4.45,maxX:4.45,minZ:-7.95,maxZ:5.95},
  {minX:-7.55,maxX:-5.45,minZ:-4.25,maxZ:-2.45},
  {minX:-9.05,maxX:-5.35,minZ:-10.05,maxZ:-7.95},
  {minX:7.02,maxX:8.45,minZ:0.45,maxZ:5.55},
  {minX:7.02,maxX:8.45,minZ:-11.55,maxZ:-6.45},
  {minX:5.15,maxX:7.65,minZ:-9.9,maxZ:-8.1},
];
export function walkable(point:Point){return point.x>=bounds.minX&&point.x<=bounds.maxX&&point.z>=bounds.minZ&&point.z<=bounds.maxZ&&!obstacles.some(box=>point.x>=box.minX&&point.x<=box.maxX&&point.z>=box.minZ&&point.z<=box.maxZ);}
export function moveWithinBath(from:Point,delta:Point):Point{
  let point={...from};
  if(walkable({x:point.x+delta.x,z:point.z}))point.x+=delta.x;
  if(walkable({x:point.x,z:point.z+delta.z}))point.z+=delta.z;
  return point;
}
const step=0.5;
const key=(point:Point)=>`${point.x},${point.z}`;
/** A bounded grid route avoids the pool and furnishings; diagonal corner cutting is forbidden. */
export function walkPath(from:Point,to:Point):Point[]{
  if(!walkable(to))return[];
  const snap=(p:Point)=>({x:Math.round(p.x/step)*step,z:Math.round(p.z/step)*step});
  const start=snap(from),goal=snap(to);if(!walkable(start)||!walkable(goal))return[];
  const queue=[start],parents=new Map<string,Point|null>([[key(start),null]]);
  for(let index=0;index<queue.length&&index<3000;index++){
    const current=queue[index];
    if(key(current)===key(goal)){
      const result:Point[]=[to];let at:Point|null=current;
      while(at){result.push(at);at=parents.get(key(at))??null;}
      return result.reverse().slice(1);
    }
    for(const [dx,dz]of [[0,-step],[step,0],[0,step],[-step,0],[step,step],[-step,step],[step,-step],[-step,-step]]){
      const next={x:current.x+dx,z:current.z+dz};
      if(parents.has(key(next))||!walkable(next)||!walkable({x:next.x,z:current.z})||!walkable({x:current.x,z:next.z}))continue;
      parents.set(key(next),current);queue.push(next);
    }
  }return[];
}
