import {useEffect,useRef,useState} from 'react';
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {moveWithinBath,walkPath,type Point} from './navigation';
import {placeForScene,targetsFor,type WorldChoice,type WorldTarget} from './staging';
import './world.css';

interface Props{sceneId:string;choices:WorldChoice[];disabled:boolean;onChoose:(choiceId:string)=>void}
export function BathWorld(props:Props){
 const mount=useRef<HTMLDivElement>(null),latest=useRef(props);latest.current=props;
 const controls=useRef<{turn:(amount:number)=>void;reset:()=>void;interact:()=>void}|undefined>(undefined);
 const [status,setStatus]=useState('Opening the bath…'),[near,setNear]=useState<WorldTarget|null>(null),[failed,setFailed]=useState(false);
 useEffect(()=>{
  const host=mount.current;if(!host)return;
  let disposed=false,frame=0,avatar:THREE.Object3D|undefined,asset:THREE.Object3D|undefined,revisionScene='',path:Point[]=[],yaw=Math.PI/4,last=performance.now(),walkPhase=0,nearId='';
  const keys=new Set<string>(),scene=new THREE.Scene();scene.background=new THREE.Color('#1a2321');scene.fog=new THREE.Fog('#1a2321',48,90);
  let renderer:THREE.WebGLRenderer;
  try{renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'low-power'});}catch{setStatus('The 3D view could not start. Dialogue and all actions remain available below.');setFailed(true);return;}
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.25;
  renderer.domElement.setAttribute('aria-hidden','true');host.appendChild(renderer.domElement);
  const camera=new THREE.OrthographicCamera(-14,14,9,-9,0.1,120);camera.position.set(15,18,25);
  const ambient=new THREE.HemisphereLight('#c7d6d0','#4e4635',1.15);scene.add(ambient);
  const daylight=new THREE.DirectionalLight('#fff0cc',2.5);daylight.position.set(-9,18,-6);daylight.castShadow=true;daylight.shadow.mapSize.set(1024,1024);Object.assign(daylight.shadow.camera,{left:-18,right:18,top:20,bottom:-20,near:1,far:60});daylight.shadow.bias=-0.001;scene.add(daylight);
  const marker=new THREE.Mesh(new THREE.RingGeometry(0.46,0.51,32),new THREE.MeshBasicMaterial({color:'#d4bb79',side:THREE.DoubleSide,depthWrite:false}));marker.rotation.x=-Math.PI/2;marker.position.y=0.04;marker.visible=false;scene.add(marker);
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const cameraTarget=new THREE.Vector3(0,0.8,8.5),ray=new THREE.Raycaster(),mouse=new THREE.Vector2(),ground=new THREE.Plane(new THREE.Vector3(0,1,0),0);
  const resize=()=>{const width=Math.max(host.clientWidth,1),height=Math.max(host.clientHeight,1),aspect=width/height;camera.left=-9*aspect;camera.right=9*aspect;camera.top=9;camera.bottom=-9;camera.updateProjectionMatrix();renderer.setSize(width,height,false);};
  const observer=new ResizeObserver(resize);observer.observe(host);resize();
  const nearTarget=()=>{if(!avatar||latest.current.disabled)return null;return targetsFor(latest.current.choices,latest.current.sceneId).map(target=>({target,distance:Math.hypot(target.x-avatar!.position.x,target.z-avatar!.position.z)})).filter(item=>item.distance<2.2).sort((a,b)=>a.distance-b.distance)[0]?.target??null;};
  const interact=()=>{const target=nearTarget();if(target)latest.current.onChoose(target.choiceId);};
  controls.current={turn:amount=>{yaw+=amount;},reset:()=>{yaw=Math.PI/4;},interact};
  const keydown=(event:KeyboardEvent)=>{if(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(event.code)){event.preventDefault();keys.add(event.code);path=[];}if(event.code==='KeyE'&&!event.repeat){event.preventDefault();interact();}};
  const keyup=(event:KeyboardEvent)=>keys.delete(event.code),blur=()=>keys.clear();
  host.addEventListener('keydown',keydown);host.addEventListener('keyup',keyup);host.addEventListener('blur',blur);window.addEventListener('blur',blur);
  let down:{x:number;y:number}|null=null;
  const pointerdown=(event:PointerEvent)=>{host.focus({preventScroll:true});down={x:event.clientX,y:event.clientY};};
  const pointerup=(event:PointerEvent)=>{
   if(!down||!avatar)return;const distance=Math.hypot(event.clientX-down.x,event.clientY-down.y);down=null;if(distance>10)return;
   const rect=host.getBoundingClientRect();mouse.set((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1);ray.setFromCamera(mouse,camera);
   const hit=asset?ray.intersectObject(asset,true).find(item=>item.object.visible):undefined;
   if(hit){let object:THREE.Object3D|null=hit.object;while(object&&object!==asset){const name=['Ada','Simon','Miriam','Cabinet'].find(name=>object!.name===name);if(name){const target=targetsFor(latest.current.choices,latest.current.sceneId).find(item=>item.shortLabel.toLowerCase().includes(name.toLowerCase()));if(target){path=walkPath(avatar.position,target);return;}}object=object.parent;}}
   const point=new THREE.Vector3();if(ray.ray.intersectPlane(ground,point))path=walkPath(avatar.position,{x:point.x,z:point.z});
  };
  host.addEventListener('pointerdown',pointerdown);host.addEventListener('pointerup',pointerup);
  const release=(root:THREE.Object3D)=>root.traverse(object=>{if(object instanceof THREE.Mesh){object.geometry.dispose();for(const material of Array.isArray(object.material)?object.material:[object.material])material.dispose();}});
  const rest=new Map<THREE.Object3D,{position:THREE.Vector3;rotation:THREE.Euler}>();
  const pose=(name:string,x:number,z:number,seated=false,yaw=0)=>{
   const person=asset?.getObjectByName(name);if(!person)return;person.position.set(x,0,z);person.rotation.y=yaw;
   person.children.forEach(part=>{const original=rest.get(part);if(original){part.position.copy(original.position);part.rotation.copy(original.rotation);}if(seated){if(part.name.endsWith('Leg')){part.rotation.x=Math.PI/2;part.position.y=.6;part.position.z=.28;}else part.position.y-=.15;}});
  };
  new GLTFLoader().load(`${import.meta.env.BASE_URL}world/bath-faceless.glb`,gltf=>{
   if(disposed){release(gltf.scene);return;}asset=gltf.scene;scene.add(asset);asset.traverse(object=>{if(object instanceof THREE.Mesh){object.castShadow=true;object.receiveShadow=true;}});avatar=asset.getObjectByName('Blaise');
   if(!avatar){setStatus('The character model could not be opened. Dialogue remains available.');setFailed(true);return;}
   for(const name of ['Ada','Simon','Miriam'])asset.getObjectByName(name)?.children.forEach(part=>rest.set(part,{position:part.position.clone(),rotation:part.rotation.clone()}));
   host.dataset.loaded='true';host.dataset.characterStyle='faceless-blocks';setStatus('Click the floor to walk. WASD or arrow keys also move Blaise. E takes the nearby action.');
  },undefined,()=>{if(!disposed){setStatus('The bath model could not be opened. Dialogue and all actions remain available below.');setFailed(true);}});
  const tick=(now:number)=>{
   if(disposed)return;frame=requestAnimationFrame(tick);const dt=Math.min((now-last)/1000,0.05);last=now;
   if(avatar){
    if(revisionScene!==latest.current.sceneId){revisionScene=latest.current.sceneId;const place=placeForScene(revisionScene);if(!['concourse','finding_notebook'].includes(revisionScene))avatar.position.set(place.x,0,place.z);path=[];cameraTarget.set(avatar.position.x,.8,avatar.position.z-2);
     pose('Ada',-7.2,-6.5);pose('Simon',6.2,-8);pose('Miriam',7.4,3,true,-Math.PI/2);
     if(revisionScene==='arrival'){pose('Ada',-2.5,8.5,true,.4);pose('Simon',-1,8.5,false,.4);}
     if(revisionScene==='ada_miriam')pose('Miriam',-5.6,-6.4,false,-Math.PI/2);
     if(revisionScene==='simon_ada')pose('Ada',5.0,-8,false,Math.PI/2);
     if(['shared','report','public_account','private_account','continuation','supper'].includes(revisionScene)){pose('Ada',-1.2,8);pose('Simon',.2,7.5);pose('Miriam',2.8,7.5);}
    }
    let dx=0,dz=0;
    if(!latest.current.disabled){
     const forward=(keys.has('KeyW')||keys.has('ArrowUp')?1:0)-(keys.has('KeyS')||keys.has('ArrowDown')?1:0),right=(keys.has('KeyD')||keys.has('ArrowRight')?1:0)-(keys.has('KeyA')||keys.has('ArrowLeft')?1:0);
     dx=-Math.sin(yaw)*forward+Math.cos(yaw)*right;dz=-Math.cos(yaw)*forward-Math.sin(yaw)*right;
     if(!dx&&!dz&&path.length){const next=path[0];dx=next.x-avatar.position.x;dz=next.z-avatar.position.z;if(Math.hypot(dx,dz)<0.13){path.shift();dx=0;dz=0;}}
    }
    const length=Math.hypot(dx,dz);if(length){const next=moveWithinBath(avatar.position,{x:dx/length*dt*3.6,z:dz/length*dt*3.6});avatar.position.x=next.x;avatar.position.z=next.z;avatar.rotation.y=Math.atan2(dx,dz);walkPhase+=dt*8;}
    for(const [part,sign]of [['LeftLeg',1],['RightLeg',-1],['LeftArm',-1],['RightArm',1]]as const){const limb=avatar.getObjectByName(`Blaise_${part}`);if(limb)limb.rotation.x=length&&!reduced?Math.sin(walkPhase)*0.12*sign:0;}
    const target=nearTarget();if((target?.choiceId??'')!==nearId){nearId=target?.choiceId??'';setNear(target);}
    marker.visible=!!target;if(target)marker.position.set(target.x,0.05,target.z);
    const follow=new THREE.Vector3(avatar.position.x,0.8,avatar.position.z-2);cameraTarget.lerp(follow,reduced?1:1-Math.exp(-dt*7));camera.position.set(cameraTarget.x+Math.sin(yaw)*20,cameraTarget.y+18,cameraTarget.z+Math.cos(yaw)*20);camera.lookAt(cameraTarget);
    host.dataset.playerX=avatar.position.x.toFixed(2);host.dataset.playerZ=avatar.position.z.toFixed(2);
    if(asset){const west=asset.getObjectByName('WestWall'),north=asset.getObjectByName('NorthWall');if(west)west.visible=camera.position.x>-8;if(north)north.visible=camera.position.z>-12;}
   }
   renderer.render(scene,camera);
  };frame=requestAnimationFrame(tick);
  return()=>{disposed=true;cancelAnimationFrame(frame);observer.disconnect();host.removeEventListener('keydown',keydown);host.removeEventListener('keyup',keyup);host.removeEventListener('blur',blur);window.removeEventListener('blur',blur);host.removeEventListener('pointerdown',pointerdown);host.removeEventListener('pointerup',pointerup);controls.current=undefined;release(scene);renderer.dispose();renderer.domElement.remove();};
 },[]);
 return <section className="bath-world" aria-label="Explore the saltwater bath">
  <div ref={mount} className="bath-world-canvas" tabIndex={0} role="application" aria-label="Third-person exploration. Move Blaise with WASD or arrow keys; E takes the nearby action." aria-describedby="world-controls"/>
  <div className="world-caption"><span>The saltwater bath</span><span>Blaise Bloom</span></div>
  {near&&!props.disabled&&<div className="world-near"><strong>{near.shortLabel}</strong><p>{near.label}</p><button onClick={()=>controls.current?.interact()}>Take this action <kbd>E</kbd></button></div>}
  <div className="world-controls" id="world-controls"><p role="status">{status}</p>{!failed&&<div><button className="quiet" aria-label="Turn camera left" onClick={()=>controls.current?.turn(-Math.PI/4)}>↶</button><button className="quiet" aria-label="Reset camera angle" onClick={()=>controls.current?.reset()}>Camera</button><button className="quiet" aria-label="Turn camera right" onClick={()=>controls.current?.turn(Math.PI/4)}>↷</button></div>}</div>
 </section>;
}
