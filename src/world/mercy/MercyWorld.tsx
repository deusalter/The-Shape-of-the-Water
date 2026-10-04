import {useEffect,useMemo,useRef,useState} from 'react';
import * as THREE from 'three';
import {buildEnvironment,figure,release} from './geometry';
import {moveWithinArea,walkPath,type Point} from './navigation';
import {profileFor,targetsFor,nearestPreparedTarget,type WorldChoice,type WorldTarget} from './profiles';
import {physicalStageKey} from './physicalStage';
import {createRenderScheduler} from './renderScheduler';
import './mercy.css';
export interface MercyWorldProps {sceneId:string;variantId?:string;encounteredSourceIds?:readonly string[];choices:readonly WorldChoice[];disabled:boolean;onChoose:(id:string)=>void;}
const movementKeys=['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'];
export function MercyWorld(props:MercyWorldProps){
 const mount=useRef<HTMLDivElement>(null),latest=useRef(props);latest.current=props;
 const profile=profileFor(props.sceneId,props.variantId,props.encounteredSourceIds);
 const choiceSignature=JSON.stringify(props.choices.map(c=>[c.id,c.label]));
 const prepared=useMemo(()=>({profile,targets:profile?targetsFor(profile,props.choices):[],physicalKey:profile?physicalStageKey(profile):'',key:JSON.stringify([props.sceneId,props.variantId,choiceSignature])}),[profile,choiceSignature,props.sceneId,props.variantId]);
 const stage=useRef(prepared);stage.current=prepared;
 const controls=useRef<{turn:(x:number)=>void;interact:(id:string)=>void;reset:()=>void;refresh:()=>void}|undefined>(undefined);
 const [near,setNear]=useState<WorldTarget|null>(null),[failed,setFailed]=useState(false);
 useEffect(()=>{
  const host=mount.current;if(!host||!profile)return;setNear(null);setFailed(false);
  let renderer:THREE.WebGLRenderer;
  try{renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'low-power'});}catch{setFailed(true);return;}
  renderer.setPixelRatio(Math.min(window.devicePixelRatio,1.5));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.shadowMap.autoUpdate=false;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.domElement.setAttribute('aria-hidden','true');host.appendChild(renderer.domElement);
  const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(48,1,.1,130),metadataCamera=new THREE.PerspectiveCamera(48,1,.1,130),avatar=figure('Blaise');scene.add(avatar);
  const limbs=([['LeftLeg',1],['RightLeg',-1],['LeftArm',-1],['RightArm',1]] as const).map(([part,sign])=>({object:avatar.getObjectByName(`Blaise_${part}`)!,sign}));
  const sun=new THREE.DirectionalLight('#ffe5bd',2.7);sun.position.set(-9,18,9);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-17,right:17,top:17,bottom:-17,near:1,far:55});sun.shadow.bias=-.001;scene.add(sun,new THREE.HemisphereLight('#c3dbdc','#766451',1.45));
  let environment:THREE.Group|undefined,markers:THREE.Group|undefined,staged='',physicalKey='',yaw=profile.cameraYaw,path:Point[]=[],phase=0,nearKey='',inViewport=true,projectionDirty=true;
  let renderFrames=0,environmentBuilds=0,shadowUpdates=0;
  const keys=new Set<string>(),follow=new THREE.Vector3(),desired=new THREE.Vector3(),ray=new THREE.Raycaster(),pointer=new THREE.Vector2(),projection=new THREE.Vector3(),floor=new THREE.Plane(new THREE.Vector3(0,1,0),0);
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // Writes and projection serialization happen only when their visible values change.
  const dataset=(key:string,value:string)=>{if(host.dataset[key]!==value)host.dataset[key]=value;};
  const publishTargets=(targets:readonly WorldTarget[],view:THREE.PerspectiveCamera)=>{view.updateMatrixWorld();dataset('targets',JSON.stringify(targets.map(t=>{projection.set(t.x,.03,t.z).project(view);return {choiceId:t.choiceId,x:t.x,z:t.z,screenX:(projection.x+1)/2*host.clientWidth,screenY:(1-projection.y)/2*host.clientHeight};})));};
  const publishStageMetadata=()=>{
   const current=stage.current,p=current.profile;if(!p)return;
   for(const [key,value] of Object.entries({scene:latest.current.sceneId,sceneId:latest.current.sceneId,location:p.location,variantId:latest.current.variantId??'',characterStyle:'faceless-blocks',visibleModels:p.actors.map(a=>a.name).join(','),visibleProps:p.props.join(',')}))dataset(key,value);
   // Logical staging stays current even while drawing is paused offscreen.
   if(staged!==current.key){
    dataset('playerX',p.spawn.x.toFixed(3));dataset('playerZ',p.spawn.z.toFixed(3));
    metadataCamera.projectionMatrix.copy(camera.projectionMatrix);metadataCamera.position.set(p.spawn.x+Math.sin(p.cameraYaw)*15,9.9,p.spawn.z+Math.cos(p.cameraYaw)*15);metadataCamera.lookAt(p.spawn.x,1.35,p.spawn.z-3.5);publishTargets(current.targets,metadataCamera);
   }
  };
  const currentTarget=()=>!latest.current.disabled&&staged===stage.current.key?nearestPreparedTarget(stage.current.targets,avatar.position):null;
  const interact=(id:string)=>{if(currentTarget()?.choiceId===id){path=[];keys.clear();scheduler.wake();latest.current.onChoose(id);}};
  const blur=()=>{keys.clear();path=[];scheduler.wake();};
  const tick=(dt:number)=>{
   const current=stage.current,p=current.profile;if(!p)return false;
   let shadowDirty=false,cameraDirty=projectionDirty;
   if(staged!==current.key){
    staged=current.key;keys.clear();path=[];nearKey='';setNear(null);yaw=p.cameraYaw;projectionDirty=true;cameraDirty=true;shadowDirty=true;
    if(!environment||physicalKey!==current.physicalKey){
     if(environment){scene.remove(environment);release(environment);}
     physicalKey=current.physicalKey;environment=buildEnvironment(p);scene.add(environment);environmentBuilds++;
    }
    if(markers){scene.remove(markers);release(markers);}markers=new THREE.Group();scene.add(markers);
    for(const target of current.targets){const mesh=new THREE.Mesh(new THREE.RingGeometry(.28,.34,32),new THREE.MeshBasicMaterial({color:'#dbc092',side:THREE.DoubleSide,transparent:true,opacity:.72}));mesh.rotation.x=-Math.PI/2;mesh.position.set(target.x,.045,target.z);mesh.userData.choiceId=target.choiceId;markers.add(mesh);}
    avatar.position.set(p.spawn.x,0,p.spawn.z);follow.set(p.spawn.x,1.1,p.spawn.z);
    const outside=['market','outside-theatre','edge'].includes(p.location);scene.background=new THREE.Color(outside?'#8faeb0':'#c2d0ca');scene.fog=new THREE.Fog(outside?'#8faeb0':'#c2d0ca',35,85);
    publishStageMetadata();
   }
   let dx=0,dz=0;
   if(!latest.current.disabled){
    const f=Number(keys.has('KeyW')||keys.has('ArrowUp'))-Number(keys.has('KeyS')||keys.has('ArrowDown')),r=Number(keys.has('KeyD')||keys.has('ArrowRight'))-Number(keys.has('KeyA')||keys.has('ArrowLeft'));
    dx=-Math.sin(yaw)*f+Math.cos(yaw)*r;dz=-Math.cos(yaw)*f-Math.sin(yaw)*r;
    if(!dx&&!dz&&path.length){dx=path[0].x-avatar.position.x;dz=path[0].z-avatar.position.z;if(Math.hypot(dx,dz)<.06){path.shift();dx=0;dz=0;}}
   }else{keys.clear();path=[];}
   const length=Math.hypot(dx,dz);
   if(length){
    const speed=Math.min(dt*3.5,keys.size?Infinity:length),next=moveWithinArea(p.navigation,avatar.position,{x:dx/length*speed,z:dz/length*speed}),rotation=Math.atan2(dx,dz);
    if(avatar.position.x!==next.x||avatar.position.z!==next.z||avatar.rotation.y!==rotation)shadowDirty=true;
    avatar.position.set(next.x,avatar.position.y,next.z);avatar.rotation.y=rotation;phase+=dt*9;
   }
   for(const {object,sign} of limbs){const rotation=length&&!reduced?Math.sin(phase)*.21*sign:0;if(object.rotation.x!==rotation){object.rotation.x=rotation;shadowDirty=true;}}
   const height=['theatre','late-theatre','outside-theatre'].includes(p.location)&&avatar.position.z<-2.5?.3:0;if(avatar.position.y!==height){avatar.position.y=height;shadowDirty=true;}
   const target=currentTarget(),key=target?JSON.stringify([target.choiceId,target.label]):'';if(key!==nearKey){nearKey=key;setNear(target);}
   desired.set(avatar.position.x,avatar.position.y+1.1,avatar.position.z);
   const settling=follow.distanceToSquared(desired)>1e-8;
   if(settling){follow.lerp(desired,reduced?1:1-Math.exp(-dt*7));if(follow.distanceToSquared(desired)<=1e-8)follow.copy(desired);cameraDirty=true;}
   if(cameraDirty){camera.position.set(follow.x+Math.sin(yaw)*15,follow.y+8.8,follow.z+Math.cos(yaw)*15);camera.lookAt(follow.x,follow.y+.25,follow.z-3.5);}
   dataset('playerX',avatar.position.x.toFixed(3));dataset('playerZ',avatar.position.z.toFixed(3));
   // Fixture projections expose present geometry only, and cannot teleport or dispatch story choices.
   if(cameraDirty){publishTargets(current.targets,camera);projectionDirty=false;}
   if(shadowDirty){renderer.shadowMap.needsUpdate=true;shadowUpdates++;}
   renderer.render(scene,camera);renderFrames++;dataset('loaded','true');
   dataset('drawCalls',String(renderer.info.render.calls));dataset('triangles',String(renderer.info.render.triangles));dataset('renderFrames',String(renderFrames));dataset('environmentBuilds',String(environmentBuilds));dataset('shadowUpdates',String(shadowUpdates));
   return !latest.current.disabled&&(keys.size>0||path.length>0)||follow.distanceToSquared(desired)>1e-8;
  };
  const scheduler=createRenderScheduler({request:callback=>requestAnimationFrame(callback),cancel:id=>cancelAnimationFrame(id),now:()=>performance.now()},tick);
  controls.current={turn:x=>{yaw+=x;projectionDirty=true;scheduler.wake();},reset:()=>{yaw=stage.current.profile?.cameraYaw??.33;projectionDirty=true;scheduler.wake();},interact,refresh:()=>{publishStageMetadata();scheduler.wake();}};
  const resize=()=>{camera.aspect=Math.max(1,host.clientWidth)/Math.max(1,host.clientHeight);camera.updateProjectionMatrix();renderer.setSize(host.clientWidth,host.clientHeight,false);projectionDirty=true;scheduler.wake();};
  const observer=new ResizeObserver(resize);observer.observe(host);resize();
  const visibility=()=>{if(document.hidden){keys.clear();path=[];}scheduler.setActive(!document.hidden&&inViewport);};
  const intersection=typeof IntersectionObserver==='undefined'?undefined:new IntersectionObserver(entries=>{inViewport=entries[entries.length-1]?.isIntersecting??true;visibility();});intersection?.observe(host);document.addEventListener('visibilitychange',visibility);visibility();
  const keydown=(e:KeyboardEvent)=>{if(movementKeys.includes(e.code)){e.preventDefault();if(!latest.current.disabled)keys.add(e.code);path=[];scheduler.wake();}if(e.code==='KeyE'&&!e.repeat){e.preventDefault();const t=currentTarget();if(t)interact(t.choiceId);}};
  const keyup=(e:KeyboardEvent)=>{if(keys.delete(e.code))scheduler.wake();};
  let down:{x:number;y:number}|undefined;
  const pointerdown=(e:PointerEvent)=>{host.focus({preventScroll:true});down={x:e.clientX,y:e.clientY};};
  const pointerup=(e:PointerEvent)=>{if(!down)return;const start=down;down=undefined;const p=stage.current.profile;if(!p||latest.current.disabled||Math.hypot(e.clientX-start.x,e.clientY-start.y)>10)return;const bounds=host.getBoundingClientRect();pointer.set((e.clientX-bounds.left)/bounds.width*2-1,-(e.clientY-bounds.top)/bounds.height*2+1);ray.setFromCamera(pointer,camera);const point=new THREE.Vector3();if(ray.ray.intersectPlane(floor,point)){path=walkPath(p.navigation,avatar.position,{x:point.x,z:point.z});scheduler.wake();}};
  host.addEventListener('keydown',keydown);host.addEventListener('keyup',keyup);host.addEventListener('blur',blur);window.addEventListener('blur',blur);host.addEventListener('pointerdown',pointerdown);host.addEventListener('pointerup',pointerup);
  scheduler.wake();
  return()=>{scheduler.dispose();observer.disconnect();intersection?.disconnect();document.removeEventListener('visibilitychange',visibility);controls.current=undefined;host.removeEventListener('keydown',keydown);host.removeEventListener('keyup',keyup);host.removeEventListener('blur',blur);window.removeEventListener('blur',blur);host.removeEventListener('pointerdown',pointerdown);host.removeEventListener('pointerup',pointerup);release(scene);sun.shadow.dispose();renderer.dispose();renderer.domElement.remove();delete host.dataset.loaded;};
 },[!!profile]);
 // Prop changes wake the renderer even when it has no pending animation frame.
 useEffect(()=>{controls.current?.refresh();},[prepared,props.disabled]);
 const visibleNear=near&&prepared.targets.some(t=>t.choiceId===near.choiceId&&t.label===near.label)?near:null;
 if(!profile)return <section className="mercy-world mercy-world-fallback" aria-label="World view"><p>Continue this passage with the actions below.</p></section>;
 return <section className="mercy-world" aria-label={`Explore ${profile.title}`}>
  <div ref={mount} className="mercy-world-canvas" tabIndex={0} role="application" aria-label="Third-person exploration. Move Blaise with WASD or arrow keys. Click the floor to walk. Press E for a nearby action."/>
  <div className="mercy-world-caption"><span>{profile.title}</span><span>Blaise Bloom</span></div>
  {visibleNear&&!props.disabled&&<div className="mercy-world-near" aria-live="polite" aria-atomic="true"><p>{visibleNear.label}</p><button aria-label={visibleNear.label} onClick={()=>controls.current?.interact(visibleNear.choiceId)}>Continue <kbd>E</kbd></button></div>}
  <div className="mercy-world-controls"><span role="status">{failed?'3D unavailable. All actions remain in the text.':'Click to walk · WASD / arrows · E nearby'}</span><div><button aria-label="Turn camera left" onClick={()=>controls.current?.turn(-Math.PI/4)}>↶</button><button aria-label="Reset camera" onClick={()=>controls.current?.reset()}>Camera</button><button aria-label="Turn camera right" onClick={()=>controls.current?.turn(Math.PI/4)}>↷</button></div></div>
 </section>;
}
export {hasStaging,profileFor} from './profiles';
