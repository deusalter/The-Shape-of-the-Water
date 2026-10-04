import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import type { MercyProfile, ActorName } from './profiles';
const palette = { stone: '#bfb59e', wall: '#a7a393', dark: '#263b3e', wood: '#594842', coral: '#a86f60', blue: '#38656b', gold: '#a48b57', green: '#617469', paper: '#d4c8aa', plum: '#594653', glass: '#233f45' };
function material(color:string){return new THREE.MeshStandardMaterial({color,roughness:color===palette.gold?.49:color===palette.blue?.65:.92,metalness:color===palette.gold?.32:0});}
function glow(mesh:THREE.Mesh,intensity=.65){const finish=mesh.material as THREE.MeshStandardMaterial;finish.emissive.set('#efb76c');finish.emissiveIntensity=intensity;finish.roughness=.42;mesh.castShadow=false;return mesh;}
export function box(parent:THREE.Object3D,name:string,color:string,x:number,y:number,z:number,w:number,h:number,d:number,rotation=0){
 const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material(color));mesh.name=name;mesh.position.set(x,y,z);mesh.rotation.y=rotation;mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;
}
function cylinder(parent:THREE.Object3D,name:string,color:string,x:number,y:number,z:number,r:number,h:number){const mesh=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,16),material(color));mesh.name=name;mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;}
function beam(parent:THREE.Object3D,color:string,a:THREE.Vector3,b:THREE.Vector3,width=.12){const mesh=box(parent,'Timber',color,0,0,0,width,a.distanceTo(b),width);mesh.position.copy(a).add(b).multiplyScalar(.5);mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),b.clone().sub(a).normalize());return mesh;}
export function figure(name:ActorName | 'Blaise'){
 const root=new THREE.Group();root.name=name;
 const cfg=name==='Blaise'?{color:'#455d70',height:1.86,width:.53}:name==='Julian'?{color:palette.coral,height:1.77,width:.47}:name==='Erasmus'?{color:'#d9c89c',height:1.91,width:.76}:{color:'#617b6a',height:1.64,width:.48};
 const coat=box(root,`${name}_Coat`,cfg.color,0,.97,0,cfg.width,.84,.36);coat.rotation.z=name==='Vera'?-.06:0;
 box(root,`${name}_Collar`,palette.paper,0,1.39,-.012,cfg.width*.75,.07,.38);
 // Heads are deliberately featureless cuboids, without eyes or facial textures.
 box(root,`${name}_Head`,name==='Blaise'?'#b4b0a7':'#c6baa6',0,cfg.height-.2,0,.3,.36,.29,name==='Julian'?-.16:0);
 const limbs:THREE.Group[]=[];
 for(const side of [-1,1]){
  const leg=new THREE.Group();leg.name=`${name}_${side<0?'Left':'Right'}Leg`;leg.position.set(side*cfg.width*.25,.57,0);box(leg,'Trouser',name==='Blaise'?'#2d3b4d':'#454c48',0,-.24,0,.2,.55,.25);box(leg,'Shoe','#2d3035',0,-.5,-.04,.22,.13,.36);root.add(leg);limbs.push(leg);
  const arm=new THREE.Group();arm.name=`${name}_${side<0?'Left':'Right'}Arm`;arm.position.set(side*(cfg.width*.5+.065),1.28,0);box(arm,'Sleeve',cfg.color,0,-.28,0,.17,.6,.23);box(arm,'Hand','#c6baa6',0,-.63,0,.14,.13,.16);root.add(arm);limbs.push(arm);
 }
 if(name==='Julian'){limbs[1].rotation.z=.21;limbs[3].rotation.x=-.3;box(root,'PaintApron','#dbcfae',0,.9,-.205,.36,.56,.04);}
 if(name==='Erasmus'){limbs[1].rotation.z=.13;limbs[3].rotation.z=-.13;coat.scale.z=1.25;}
 if(name==='Vera'){beam(root,palette.gold,new THREE.Vector3(.36,.05,.2),new THREE.Vector3(.5,1.04,.05),.06);limbs[3].rotation.x=-.34;}
 box(root,`${name}_CoatSeam`,name==='Blaise'?'#304650':palette.dark,0,.95,.184,.018,.72,.012);
 // Small geometric contact patches remain attached to the feet, including on raised stages.
 for(const [radius,opacity] of [[.36,.14],[.53,.06]]){const contact=new THREE.Mesh(new THREE.CircleGeometry(radius,24),new THREE.MeshBasicMaterial({color:'#172429',transparent:true,opacity,depthWrite:false}));contact.name='Foot contact';contact.rotation.x=-Math.PI/2;contact.scale.y=.72;contact.position.y=.003;root.add(contact);}
 root.userData.faceless=true;return root;
}
function paving(root:THREE.Group,size=20,urban=true){
 box(root,'Ground',urban?'#827d6e':'#79867b',0,-.18,0,70,.35,70);
 if(!urban){for(let i=0;i<35;i++){const stone=box(root,'Dry ground stone',i%3?'#92a396':'#acb6a3',Math.sin(i*47)*9,.003,Math.cos(i*23)*8,.3+(i%3)*.1,.04,.2, i);stone.rotation.z=.05;}return;}
 const stones=[palette.stone,'#b5ac98','#c4baa3','#aaa48f'];
 for(let row=0;row<19;row++)for(let column=0;column<19;column++){
  const x=-9+column+(row%2?.5:0),z=-8+row*.88;
  box(root,'Dressed paving stone',stones[(row*7+column*3)%stones.length],x,.003,z,.96,.014,.84);
 }
 // Flush stone borders give the square a clear scale without adding obstacles.
 for(const x of [-7.9,7.9])box(root,'Square edging',palette.paper,x,.01,0,.18,.04,size);
}
function house(root:THREE.Object3D,x:number,z:number,height:number,color:string,width=2.6){
 box(root,'House',color,x,height/2,z,width,height,2.2);
 box(root,'Stone plinth',palette.wall,x,.17,z,width+.1,.34,2.3);
 box(root,'Roof cornice',palette.paper,x,height-.08,z,width+.23,.18,2.43);
 box(root,'Roof',palette.dark,x,height+.08,z,width+.12,.14,2.32);
 for(const side of [-1,1]){
  const face=z+side*1.11;
  for(const dx of [-width*.44,width*.44])box(root,'Facade pilaster',palette.wall,x+dx,height*.5,face,.12,height-.4,.07);
  for(let row=.9;row<height-.3;row+=1.35)for(const dx of [-.65,.65]){
   box(root,'Window stone surround',palette.paper,x+dx,row,face,.59,.82,.075);
   box(root,'Recessed window',palette.glass,x+dx,row,face+side*.043,.43,.66,.024);
   box(root,'Window mullion',palette.wood,x+dx,row,face+side*.065,.035,.66,.025);
   box(root,'Window crossbar',palette.wood,x+dx,row+.06,face+side*.066,.43,.035,.025);
   box(root,'Window ledge',palette.paper,x+dx,row-.42,face+side*.08,.71,.08,.24);
  }
 }
}
function compactStatic(group:THREE.Group){
 group.updateMatrixWorld(true);const originals:THREE.Mesh[]=[];const bins=new Map<string,{geometries:THREE.BufferGeometry[];material:THREE.MeshStandardMaterial;castShadow:boolean;receiveShadow:boolean}>();
 group.traverse(object=>{if(object instanceof THREE.Mesh&&object.material instanceof THREE.MeshStandardMaterial){originals.push(object);const finish=object.material;
  const key=JSON.stringify([finish.color.getHexString(),finish.emissive.getHexString(),finish.emissiveIntensity,finish.roughness,finish.metalness,finish.opacity,finish.transparent,finish.side,finish.depthWrite,finish.flatShading,object.castShadow,object.receiveShadow]);
  let bin=bins.get(key);if(!bin){bin={geometries:[],material:finish.clone(),castShadow:object.castShadow,receiveShadow:object.receiveShadow};bins.set(key,bin);}bin.geometries.push(object.geometry.clone().applyMatrix4(object.matrixWorld));}});
 for(const original of originals){original.removeFromParent();original.geometry.dispose();(original.material as THREE.Material).dispose();}for(const bin of bins.values()){const geometry=mergeGeometries(bin.geometries);for(const part of bin.geometries)part.dispose();if(!geometry){bin.material.dispose();continue;}const mesh=new THREE.Mesh(geometry,bin.material);mesh.castShadow=bin.castShadow;mesh.receiveShadow=bin.receiveShadow;group.add(mesh);}
}
function innerSky(root:THREE.Group,late:boolean){
 // Distant city terraces rise around the inner curve. They are scenery, never reachable story locations.
 const curve=new THREE.Group();curve.name='Aubade inner sky';root.add(curve);
 for(let band=0;band<3;band++){
  const angle=band*.4, r=10, y=r*(1-Math.cos(angle)), z=-12-r*Math.sin(angle);
  const terrace=new THREE.Group();terrace.position.set(0,y,z);terrace.rotation.x=-angle;curve.add(terrace);
  box(terrace,'Curved terrace',palette.paper,0,-.15,0,37,.35,5);
  for(let j=0;j<9;j++)house(terrace,-16+j*4,0,2.5+((j*3+band)%4)*.75,[(late?'#849691':palette.wall),palette.paper,'#b98571'][j%3],2.9);
 }
 // Beyond the crest a small inverted row hangs over the city.
 const inverted=new THREE.Group();inverted.position.set(0,11,-25);inverted.rotation.x=Math.PI;curve.add(inverted);
 box(inverted,'Upside-down terrace',palette.wall,0,-.2,0,37,.4,4);for(let j=0;j<9;j++)house(inverted,-16+j*4,0,3, j%2?palette.coral:palette.paper);
 for(const x of [-6,6]){const person=figure('Julian');person.name='Distant terrace resident';person.position.set(x,0,-2.3);person.scale.setScalar(.85);inverted.add(person);}
 for(let j=0;j<8;j++)box(inverted,'Hanging washing',j%2?'#c7a08d':'#e1d9bf',-10+j*2.6,1.0,-2.5,.95,.72,.04);
 compactStatic(curve);
}
function tree(root:THREE.Group,x:number,z:number){cylinder(root,'Tree trunk',palette.wood,x,.7,z,.16,1.4);for(const [dx,dy,dz] of [[0,2,0],[-.45,1.7,.2],[.5,1.8,-.2]]){const mesh=new THREE.Mesh(new THREE.IcosahedronGeometry(.92,1),new THREE.MeshStandardMaterial({color:palette.green,roughness:1,flatShading:true}));mesh.position.set(x+dx,dy,z+dz);mesh.castShadow=true;root.add(mesh);}}
function table(root:THREE.Object3D,name:string,x:number,z:number,w=3,d=1.4){const group=new THREE.Group();group.name=name;group.position.set(x,0,z);root.add(group);box(group,'Tabletop',palette.wood,0,.9,0,w,.16,d);for(const dx of [-w/2+.15,w/2-.15])for(const dz of [-d/2+.15,d/2-.15])box(group,'Table leg',palette.dark,dx,.42,dz,.12,.84,.12);return group;}
function door(root:THREE.Group,x:number,z:number){const g=new THREE.Group();g.name='painted-door';g.position.set(x,0,z);g.rotation.y=-.22;root.add(g);box(g,'Door panel',palette.blue,0,1.4,0,1.2,2.8,.13);box(g,'Painted sky', '#bfceca',0,1.65,.075,.96,1.9,.025);
 const moon=new THREE.Mesh(new THREE.CircleGeometry(.21,20),new THREE.MeshStandardMaterial({color:'#eedabc',roughness:1}));moon.position.set(.13,2.2,.095);g.add(moon);for(let i=0;i<5;i++)box(g,'Painted cloud','#e1d9c3',-.3+i*.12,1.6+Math.sin(i)*.2,.095,.26,.06,.017);box(g,'Paint dribble','#6f949d',-.33,.54,.085,.04,.8,.02);for(const dx of [-.7,.7])box(g,'Door jamb',palette.gold,dx,1.5,0,.14,3,.22);box(g,'Lintel',palette.gold,0,3,0,1.55,.14,.22);cylinder(g,'Door handle',palette.gold,.38,1.25,.15,.06,.07);return g;}
function horse(root:THREE.Group){const g=new THREE.Group();g.name='horse';g.position.set(-3.8,0,-3);g.rotation.y=.23;root.add(g);box(g,'Paper horse body',palette.paper,0,1.3,0,2.2,.85,.76);for(const x of [-.78,.78])for(const z of [-.27,.27])box(g,'Paper horse leg',palette.paper,x,.47,z,.19,.95,.23);const neck=box(g,'Paper horse neck',palette.paper,.78,2.03,0,.43,1.3,.6);neck.rotation.z=-.3;box(g,'Paper horse head',palette.paper,1.05,2.6,-.02,.96,.47,.52);box(g,'Mane',palette.coral,.56,2.07,.01,.13,1.15,.67);for(const z of [-.19,.19]){const ear=box(g,'Paper ear',palette.paper,.93,3.02,z,.2,.5,.13);ear.rotation.z=.15;}beam(g,palette.wood,new THREE.Vector3(-1.3,1.45,0),new THREE.Vector3(1.3,1.45,0),.055);
 for(const x of [-.72,-.15,.45,.9]){box(g,'Paper patch seam','#b3a581',x,1.31,.39,.025,.76,.012);box(g,'Paper patch seam','#b3a581',x,1.31,-.39,.025,.76,.012);}for(const y of [1.06,1.57])box(g,'Paper paste edge','#b3a581',0,y,.394,2.15,.02,.012);for(let i=0;i<4;i++)box(g,'Visible wooden rib',palette.wood,-.6+i*.4,1.05,.395,.04,.28,.017);box(g,'String repair','#a88760',-.76,.88,.281,.22,.04,.04);return g;}
function rain(root:THREE.Group){
 box(root,'Rain darkness','#234650',0,7,-12,75,14,6);
 for(const side of [-1,1])box(root,'Dry hollow rain edge','#234650',side*12,7,-1,5,14,18);
 for(let row=0;row<3;row++){const layer=new THREE.Mesh(new THREE.PlaneGeometry(70,14),new THREE.MeshBasicMaterial({color:'#739ca0',transparent:true,opacity:.08,side:THREE.DoubleSide,depthWrite:false}));layer.position.set(0,7,-8.8-row*.8);root.add(layer);}
 const positions:number[]=[];let seed=119;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
 for(let i=0;i<4500;i++){const side=i%4===0?-1:i%4===1?1:0;const x=side?side*(9.4+random()*2):(random()-.5)*65,y=random()*14,z=side?-9+random()*18:-11.2+random()*3.1;positions.push(x,y,z,x,y+.08+random()*.3,z);}
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));const lines=new THREE.LineSegments(geometry,new THREE.LineBasicMaterial({color:'#b8dfdb',transparent:true,opacity:.5}));lines.name='Stationary rain';root.add(lines);
 for(let i=0;i<7;i++){const ripple=new THREE.Mesh(new THREE.TorusGeometry(.27+i*.05,.008,4,32),new THREE.MeshBasicMaterial({color:'#cae0d5',transparent:true,opacity:.5}));ripple.rotation.x=Math.PI/2;ripple.position.set(-7+i*2.2,.02,-7);root.add(ripple);}
}
function theatre(root:THREE.Group,outside:boolean,late:boolean,complete=false){
 box(root,'Rehearsal runner',outside?'#687f75':palette.plum,0,.015,-.4,9,.024,3.2);
 for(const z of [-1.87,1.07])box(root,'Runner woven border',palette.gold,0,.03,z,8.8,.006,.05);
 box(root,'Stage apron',palette.wood,0,.15,-5,15,.3,5);box(root,'Stage back',outside?'#768b82':palette.dark,outside?0:2.6,2.5,-7.7,outside?15:9.6,5,.2);
 for(let index=0;index<20;index++)box(root,'Stage floorboard',index%3?'#665247':'#76604c',-7.1+index*.74,.308,-5,.7,.015,4.96);
 box(root,'Apron brass line',palette.gold,0,.24,-2.48,14.9,.025,.045);
 for(const x of [-5,-2.5,0,2.5,5]){box(root,'Footlight housing',palette.dark,x,.4,-2.62,.48,.18,.2);glow(box(root,'Footlight pane',palette.gold,x,.47,-2.61,.35,.05,.14),.8);}
 for(const x of [-7.1,7.1]){box(root,'Stage post',palette.wood,x,2.9,-5,.22,5.8,.22);beam(root,palette.wood,new THREE.Vector3(x,5.5,-5),new THREE.Vector3(x,4,-7.5),.15);}
 if(outside){for(const x of [-5,-1,3,7])beam(root,palette.wood,new THREE.Vector3(x,5.5,-7.5),new THREE.Vector3(x,5.5,-1),.12);rain(root);if(complete){for(const x of [-4.5,0,4.5]){box(root,'Finished roof',palette.paper,x,5.6,-6.3,4.45,.13,3);box(root,'Roof edge',palette.wood,x,5.55,-4.8,4.5,.15,.15);}}else box(root,'Unfinished roof',palette.paper,4,5.6,-4,6,.08,5);for(const z of [-5.5,-2])box(root,'Scaffolding crossbar',palette.wood,7.6,1.9,z,.12,.12,3);box(root,'Stacked planks',palette.wood,-6,.26,-.5,1.3,.52,3.4);for(const x of [-6.7,-5.3])box(root,'Discarded roof boards',palette.wood,x,.08,-.5,.09,.15,3.7);}
 else{for(const x of [-1.5,6]){box(root,'Velvet curtain',late?palette.blue:palette.plum,x,2.45,-7.4,2,4.8,.12);for(let j=0;j<9;j++)box(root,'Curtain fold',late?'#2c5157':'#473843',x-.91+j*.225,2.45,-7.28,.12,4.8,.14);box(root,'Curtain hem',palette.gold,x,.14,-7.25,2,.07,.03);}
  box(root,'Stage pelmet',palette.plum,2.2,4.95,-7.25,9.7,.28,.2);box(root,'Pelmet brass trim',palette.gold,2.2,4.8,-7.1,9.7,.035,.045);
 box(root,'Dining room back wall',palette.wall,3.7,3.3,-8.4,12.6,6.6,.3);box(root,'Window low wall',palette.wall,-5.6,.8,-8.4,5.7,1.6,.3);box(root,'Window high wall',palette.wall,-5.6,5.7,-8.4,5.7,1.8,.3);
  for(const x of [-8.6,-2.65])box(root,'Window jamb',palette.paper,x,3.1,-8.3,.2,3.2,.4);for(const x of [-7.1,-5.6,-4.1])box(root,'Window mullion',palette.paper,x,3.1,-8.3,.13,3.1,.18);box(root,'Long window sill',palette.paper,-5.6,1.7,-8.1,6.2,.18,.7);
  box(root,'Dining room side wall',palette.wall,-8.7,2.5,-1.4,.24,5,13.5);for(const z of [-5.5,-1.4,2.7]){box(root,'Wall wainscot',palette.wood,-8.52,.65,z,.12,1.3,3.85);box(root,'Wall molding',palette.gold,-8.49,1.35,z,.14,.08,4);for(const dz of [-1.3,0,1.3]){box(root,'Wainscot panel inset',palette.dark,-8.44,.65,z+dz,.018,.95,1.1);box(root,'Panel upper rail',palette.gold,-8.43,1.15,z+dz,.02,.028,1.1);}}
  for(const z of [-7.9,-3,2.6]){box(root,'Ceiling beam',palette.wood,0,5.4,z,18,.18,.2);box(root,'Dining room column',palette.paper,-8.4,2.7,z,.3,5.4,.3);}innerSky(root,late);}
 for(let row=0;row<3;row++)for(let column=0;column<6;column++){const x=-5+column*2,z=2+row*1.55;box(root,'Audience seat',palette.wood,x,.49,z,.95,.15,.72);box(root,'Chair back',palette.wood,x,.88,z+.31,.95,.82,.13);box(root,'Seat cushion',palette.plum,x,.58,z-.03,.82,.07,.58);for(const dx of [-.36,.36])for(const dz of [-.25,.25])box(root,'Chair leg',palette.dark,x+dx,.23,z+dz,.075,.46,.075);}
 table(root,'Worktable',5,-1.8,2.7,1.2);for(let i=0;i<4;i++)cylinder(root,'Paint pot',[palette.coral,palette.blue,palette.gold,palette.green][i],4.1+i*.55,1.07,-1.8,.15,.2);
}
function publicSquare(root:THREE.Group,late:boolean){innerSky(root,late);for(const x of [-9,9])for(let z=-6;z<=4;z+=5)house(root,x,z,3.5+(z+6)*.12,x<0?palette.coral:palette.wall,3);tree(root,-6,4);tree(root,7,4);cylinder(root,'Fountain basin',palette.wall,-5,0,-3,1.25,.35);cylinder(root,'Fountain water',palette.blue,-5,.18,-3,1,.04);cylinder(root,'Fountain column',palette.paper,-5,.7,-3,.17,1.3);
 const rim=new THREE.Mesh(new THREE.TorusGeometry(1.13,.095,6,32),material(palette.paper));rim.name='Fountain stone rim';rim.rotation.x=Math.PI/2;rim.position.set(-5,.19,-3);rim.castShadow=true;rim.receiveShadow=true;root.add(rim);
 for(const x of [-2,2]){box(root,'Street bench',palette.wood,x,.48,5.7,2.7,.2,.55);for(const dx of [-1,1])box(root,'Bench support',palette.dark,x+dx,.23,5.7,.12,.46,.48);for(const dz of [-.12,.12])box(root,'Bench slat seam',palette.dark,x,.586,5.7+dz,2.65,.008,.012);}}
export function buildEnvironment(profile:MercyProfile){
 const root=new THREE.Group();root.name=profile.location;paving(root,20,!['market','outside-theatre'].includes(profile.location));
 const paperPoint=['patron','late-square'].includes(profile.location)?{x:0,z:-3}:profile.location==='edge'?{x:-4,z:-3}:{x:4.8,z:-1.8};
 for(const [x,z] of [[-7.5,6.6],[7.5,6.6]]){
  cylinder(root,'Lamp pedestal',palette.dark,x,.15,z,.27,.3);cylinder(root,'Lamp pole',palette.dark,x,1.5,z,.06,3);
  glow(box(root,'Lamp glass',palette.gold,x,3.12,z,.31,.43,.31),.85);
  for(const dx of [-.19,.19])for(const dz of [-.19,.19])box(root,'Lantern corner',palette.dark,x+dx,3.12,z+dz,.035,.55,.035);
  box(root,'Lantern cap',palette.dark,x,3.41,z,.46,.1,.46);box(root,'Lantern base',palette.dark,x,2.85,z,.43,.06,.43);
 }
const late=profile.location.startsWith('late-');
 if(profile.location==='theatre'||profile.location==='late-theatre')theatre(root,false,late);
 else if(profile.location==='outside-theatre')theatre(root,true,late,profile.props.includes('finished-roof'));
 else if(profile.location==='market'){rain(root);for(const x of [-6,5]){const t=table(root,'Market counter',x,-3,3.7,1.4);for(let i=0;i<8;i++)cylinder(t,'Fruit',i%2?palette.coral:palette.gold,-1.2+i*.35,1.11,0,.12,.22);box(root,'Market canopy',x<0?palette.coral:palette.gold,x,3,-3,4.4,.08,2.5);for(let i=0;i<7;i++)box(root,'Awning edge',i%2?palette.paper:(x<0?palette.coral:palette.gold),x-1.8+i*.6,2.85,-1.77,.57,.3,.05);for(const dx of [-1.3,0,1.3]){box(root,'Produce crate',palette.wood,x+dx,.25,-3.7,.95,.5,.7);for(let row=0;row<3;row++)box(root,'Crate slat',palette.gold,x+dx,.15+row*.14,-3.33,.97,.06,.02);}for(const dx of [-1.9,1.9])box(root,'Stall post',palette.wood,x+dx,1.5,-3,.12,3,.12);}tree(root,7,5);
 for(const side of [-1,1]){
  const x=side*6.5;box(root,'Linked market awning',side<0?'#92776d':'#758b82',x,2.9,2.8,2.7,.08,6.5);for(const z of [.6,3,5.2]){const wares=table(root,'Side stall',x,z,1.9,1.1);for(let i=0;i<4;i++)cylinder(wares,'Pottery ware',palette.paper,-.6+i*.4,1.08,0,.12,.23);box(root,'Canopy post',palette.wood,x+side*1.2,1.5,z,.1,3,.1);cylinder(root,'Barrel',palette.wood,x-side*.75,.36,z+.5,.34,.72);for(const y of [.18,.54])cylinder(root,'Barrel hoop',palette.dark,x-side*.75,y,z+.5,.35,.055);}
  beam(root,palette.wood,new THREE.Vector3(x,2.7,-2),new THREE.Vector3(x,2.7,6),.065);beam(root,palette.wood,new THREE.Vector3(side*7.5,3,-3),new THREE.Vector3(side*2.2,2.6,-4.2),.025);
 }
 for(const z of [.4,3.4]){box(root,'Market walkway',palette.wood,0,.015,z,8,.03,1.2);for(let x=-3.7;x<=3.7;x+=.6)box(root,'Walkway plank joint','#5e6055',x,.035,z,.013,.006,1.16);}
 if(profile.props.includes('market-stalls')){box(root,'Distant theatre platform',palette.wood,1.4,.2,-6.2,4.8,.4,2.6);for(const x of [-.7,3.5])box(root,'Distant theatre post',palette.wood,x,1.8,-7,.13,3.6,.13);box(root,'Distant roof beam',palette.wood,1.4,3.5,-7,4.8,.12,.15);box(root,'Distant canvas',palette.paper,2.8,2.1,-7.45,1.4,2.4,.05);for(const x of [.25,1.15])box(root,'Distant ladder rail',palette.wood,x,.9,-6.7,.06,1.8,.08);for(let y=.2;y<1.8;y+=.25)box(root,'Distant ladder rung',palette.wood,.7,y,-6.7,.98,.045,.08);}
 for(const [x,z,color]of [[-5,-4.2,'#687b83'],[5,-4.2,'#a77961'],[6,2,'#a3a382']] as const){const person=figure('Vera');person.name='Market resident';person.position.set(x,0,z);person.traverse(o=>{if(o instanceof THREE.Mesh&&o.name==='Vera_Coat')(o.material as THREE.MeshStandardMaterial).color.set(color);});root.add(person);}
 }
 else if(profile.location==='edge'){
  innerSky(root,false);box(root,'Boundary path',palette.paper,0,.01,-2,3,.03,16);for(let x=-9;x<=9;x+=2){box(root,'Edge stone',palette.wall,x,.32,-6,.7,.64,.8);}
  const instrument=new THREE.Group();instrument.name='observations';instrument.position.set(4,0,-3.5);root.add(instrument);for(const [x,z]of [[-.6,.4],[.6,.4],[0,-.6]])beam(instrument,palette.wood,new THREE.Vector3(x,0,z),new THREE.Vector3(0,1.3,0),.09);const scope=cylinder(instrument,'Telescope',palette.gold,0,1.6,0,.18,1.3);scope.rotation.z=1.15;table(root,'Instrument case',-4,-3,2,1);box(root,'Observation cloth',palette.paper,-4,.99,-3,1.6,.03,.7);
 }else{publicSquare(root,late);if(profile.location==='patron'||profile.location==='late-square'){
  if(profile.location==='patron'){for(const x of [-7,-3,1,5]){cylinder(root,'Palace column',palette.paper,x,1.55,-6.9,.24,3.1);cylinder(root,'Column capital',palette.paper,x,3.14,-6.9,.35,.2);}for(const x of [-5,-1,3]){const arch=new THREE.Mesh(new THREE.TorusGeometry(1.76,.18,8,32,Math.PI),new THREE.MeshStandardMaterial({color:palette.paper,roughness:.9}));arch.position.set(x,3.1,-6.9);arch.castShadow=true;root.add(arch);}box(root,'Kitchen window frame',palette.wood,7,2.1,-6.7,1.8,2.5,.12);box(root,'Kitchen window',palette.blue,7,2.1,-6.6,1.5,2.2,.05);}
  const t=table(root,'Patron table',0,-3,5,1.9);box(t,'Table cloth',palette.paper,0,1.0,0,5.04,.035,1.94);for(let i=0;i<5;i++){cylinder(t,'Dish',palette.gold,-1.9+i*.94,1.035,0,.26,.035);box(t,'Bread',palette.coral,-1.9+i*.94,1.13,0,.25,.15,.26);}
  for(const x of [-3.5,3.5])box(root,'Dining chair',palette.wood,x,.6,-3,.8,1.2,.8);
 }}
 if(profile.id.startsWith('a2.')&&['patron','late-square','late-theatre'].includes(profile.location)){for(const [index,x,z]of [[0,-6,1],[1,-5.8,3.4],[2,6.4,1],[3,6.4,3.3]] as const){const person=figure(index%2?'Julian':'Vera');person.name='Gathered resident';person.position.set(x,0,z);person.rotation.y=x<0?-Math.PI/2:Math.PI/2;person.scale.setScalar(.88+index*.035);person.traverse(o=>{if(o instanceof THREE.Mesh&&o.name.endsWith('_Coat'))(o.material as THREE.MeshStandardMaterial).color.set(['#7e7d68','#887677','#7f8a80','#967c6b'][index]);});root.add(person);}}
 // Batch the immutable background before adding present story props and figures.
 compactStatic(root);
 for(const prop of profile.props){if(prop==='horse')horse(root);if(prop==='painted-door')door(root,2.9,-4.7);if(prop==='cart'){const g=new THREE.Group();g.name='cart';g.position.set(-5,0,-1);root.add(g);box(g,'Cart bed',palette.wood,0,.6,0,1.8,.14,2.5);for(const x of [-1,1]){const wheel=cylinder(g,'Wheel',palette.dark,x,.43,0,.44,.14);wheel.rotation.z=Math.PI/2;}beam(g,palette.wood,new THREE.Vector3(.65,.55,1),new THREE.Vector3(.65,.55,3),.09);}if(prop==='account')box(root,'account',palette.paper,paperPoint.x,1.04,paperPoint.z,1.1,.025,.7);
 if(['bowl','whole-bowl','soup-bowls','star-cups'].includes(prop)){for(const x of prop==='whole-bowl'?[0]:[-1.2,0,1.2])cylinder(root,prop,palette.blue,x,1.05,-3,prop==='star-cups'?.14:.28,prop==='star-cups'?.23:.16);}
 if(prop==='stacked-plates'){for(let i=0;i<5;i++)cylinder(root,prop,palette.paper,1.7,1.04+i*.045,-3,.27,.04);}
 if(prop==='bean-pot')cylinder(root,prop,palette.wood,1.7,1.25,-3,.3,.45);
 if(prop==='commemorative-cloth'){box(root,prop,palette.coral,0,3.2,-7.7,4,2.3,.055);for(const x of [-1.8,1.8])box(root,'Banner trim',palette.gold,x,3.2,-7.66,.08,2.3,.035);}
 if(prop==='folded-cloth')box(root,prop,palette.coral,.7,1.08,-3,1.2,.12,.6);
 if(prop==='judge-robe'){const robe=box(root,prop,'#817494',6.5,.76,-.2,1,.04,2);robe.rotation.z=.18;}
 if(prop==='play-pages')box(root,prop,palette.paper,5,1,-1.8,.85,.05,.62);
 if(prop==='letter')box(root,prop,palette.paper,paperPoint.x,1.075,paperPoint.z,.6,.03,.4);
 if(prop==='empty-doorway'){for(const x of [2.2,3.6])box(root,prop,palette.gold,x,1.5,-4.7,.14,3,.22);box(root,'Empty lintel',palette.gold,2.9,3,-4.7,1.55,.14,.22);}
 if(prop==='hinge-pins'){for(const y of [.65,2.1])cylinder(root,prop,palette.dark,2.27,y,-4.55,.055,.12);}
 if(prop==='old-reminder')box(root,prop,palette.paper,3.7,1.6,-4.67,.4,.32,.02);
 if(prop==='small-bottle')cylinder(root,prop,'#647d65',paperPoint.x+.4,1.22,paperPoint.z,.11,.36);
 if(prop==='loose-button')cylinder(root,prop,palette.gold,paperPoint.x-.3,1.09,paperPoint.z,.055,.015);
 if(prop==='bishop-costume'){box(root,prop,'#938c78',5.4,1.02,-1.65,.58,.035,1);const hat=new THREE.Mesh(new THREE.ConeGeometry(.24,.64,4),new THREE.MeshStandardMaterial({color:palette.paper,roughness:1}));hat.name='Bishop hat';hat.position.set(5.6,1.35,-1.8);hat.castShadow=true;root.add(hat);}
 if(prop==='paint-pot')cylinder(root,prop,palette.coral,paperPoint.x+.6,1.14,paperPoint.z-.35,.17,.25);
 if(prop==='paper')box(root,prop,palette.paper,paperPoint.x,1.28,paperPoint.z,.8,.02,.6);
 if(prop==='pencil')box(root,prop,palette.gold,paperPoint.x+.3,1.3,paperPoint.z+.25,.035,.035,.6,.4);
 if(prop==='notebook')box(root,prop,palette.paper,paperPoint.x+.12,1.34,paperPoint.z,.7,.08,.46);
 if(prop==='stage-sketch')box(root,prop,palette.paper,paperPoint.x+.3,1.43,paperPoint.z+.12,.9,.02,.56);
 if(prop==='bread')box(root,prop,palette.coral,profile.location==='market'?-5:paperPoint.x,1.12,profile.location==='market'?-3:paperPoint.z,.6,.2,.3);
 if(['cup','breakfast-cup'].includes(prop))cylinder(root,prop,palette.blue,paperPoint.x+.6,1.16,paperPoint.z,.14,.24);
 if(prop==='instrument-box'){box(root,prop,palette.wood,-4,1.11,-3,1.4,.25,.8);box(root,'Box lid',palette.wood,-4,1.5,-3.3,1.4,.06,.7,.1);}
 if(prop==='sky-cloth'){box(root,prop,palette.blue,paperPoint.x,profile.props.includes('instrument-box')?1.27:1.05,paperPoint.z,1.25,.025,.68);}
 if(prop==='bucket'){cylinder(root,prop,palette.wood,-2,1.9,-3,.28,.48);beam(root,palette.wood,new THREE.Vector3(-2,2.2,-3),new THREE.Vector3(-2,3.8,-3),.018);}
 if(prop==='ladder'){const ladder=new THREE.Group();ladder.name=prop;ladder.position.set(-5.5,0,-5.2);ladder.rotation.x=-.2;root.add(ladder);for(const x of [-.45,.45])box(ladder,'Ladder rail',palette.wood,x,1.8,0,.1,3.6,.13);for(let y=.3;y<3.6;y+=.4)box(ladder,'Ladder rung',palette.wood,0,y,0,.92,.09,.12);}
 if(prop==='blanket')box(root,prop,'#956f72',-5.3,.06,-1.2,1.7,.1,1.1);
 if(prop==='cheap-cup')cylinder(root,prop,palette.wall,-5.3,.25,-.55,.15,.32);
 if(prop==='paint-brush'){box(root,prop,palette.wood,4.9,1.08,-1.8,.04,.04,.6,.35);box(root,'Brush bristles',palette.coral,4.81,1.08,-2.05,.1,.045,.13,.35);}
 if(prop==='needle')box(root,prop,palette.dark,.7,1.15,-3,.025,.025,.3);
 if(prop==='construction-boards'){for(let i=0;i<4;i++)box(root,prop,palette.wood,-6+i*.25,.06,-.6,.19,.12,3.7,.07);}
 }
 for(const actor of profile.actors){const model=figure(actor.name);model.position.set(actor.x,actor.y??0,actor.z);model.scale.setScalar(actor.scale??1);model.rotation.y=actor.yaw??0;root.add(model);}
 return root;
}
export function release(root:THREE.Object3D){const geometries=new Set<THREE.BufferGeometry>(),materials=new Set<THREE.Material>();root.traverse(o=>{if(o instanceof THREE.Mesh||o instanceof THREE.LineSegments){geometries.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:[o.material])materials.add(m);}});for(const g of geometries)g.dispose();for(const m of materials)m.dispose();}
