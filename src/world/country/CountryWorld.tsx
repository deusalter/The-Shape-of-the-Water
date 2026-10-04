import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { moveWithinArea, walkPath, type Point } from './navigation';
import { nearestTarget, profileFor, targetsFor, type WorldChoice, type WorldTarget } from './profiles';
import './country.css';

export interface CountryWorldProps {
  sceneId: string;
  /** Only the encountered passage variant, if that variant has explicit staging. */
  variantId?: string;
  /** Visible captured sources; country staging currently does not infer inventory from history. */
  encounteredSourceIds?: readonly string[];
  choices: readonly WorldChoice[];
  disabled: boolean;
  onChoose: (choiceId: string) => void;
}
const movementKeys = ['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'];
const release = (root: THREE.Object3D) => root.traverse(object => {
  if (object instanceof THREE.Mesh) {
    object.geometry.dispose();
    for (const material of Array.isArray(object.material) ? object.material : [object.material]) material.dispose();
  }
});
export function CountryWorld(props: CountryWorldProps) {
  const mount = useRef<HTMLDivElement>(null), latest = useRef(props); latest.current = props;
  const profile = profileFor(props.sceneId, props.variantId, props.encounteredSourceIds);
  const controls = useRef<{ turn: (amount: number) => void; reset: () => void; interact: (choiceId: string) => void } | undefined>(undefined);
  const [status, setStatus] = useState('Opening the world…'), [near, setNear] = useState<WorldTarget | null>(null), [failed, setFailed] = useState(false);
  useEffect(() => {
    const host = mount.current; if (!host || !profile) return;
    setNear(null); setFailed(false); setStatus('Opening the world…');
    let disposed = false, frame = 0, asset: THREE.Object3D | undefined, avatar: THREE.Object3D | undefined;
    let staged = '', path: Point[] = [], yaw = profile.cameraYaw??Math.PI / 4, last = performance.now(), walkPhase = 0, nearKey = '';
    const keys = new Set<string>(), scene = new THREE.Scene();
    const modelRest = new Map<THREE.Object3D,THREE.Vector3>();
    scene.background = new THREE.Color('#1b1825'); scene.fog = new THREE.Fog('#1b1825', 45, 85);
    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'low-power' }); }
    catch { setStatus('The 3D view could not start. Dialogue and actions remain available below.'); setFailed(true); return; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.6));
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.25;
    renderer.domElement.setAttribute('aria-hidden', 'true'); host.appendChild(renderer.domElement);
    const camera = new THREE.OrthographicCamera(-12,12,9,-9,0.1,120);
    const light = new THREE.DirectionalLight('#ffdfb6', 3.0); light.position.set(-8,19,7); light.castShadow = true;
    light.shadow.mapSize.set(1024,1024); Object.assign(light.shadow.camera,{left:-25,right:25,top:25,bottom:-25,near:1,far:60}); light.shadow.bias=-0.001;
    scene.add(light, new THREE.HemisphereLight('#c4b5db','#524c45',1.6));
    const marker = new THREE.Mesh(new THREE.RingGeometry(0.4,0.45,32),new THREE.MeshBasicMaterial({color:'#ead5a5',side:THREE.DoubleSide,depthWrite:false}));
    marker.rotation.x=-Math.PI/2; marker.position.y=0.035; marker.visible=false; scene.add(marker);
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const cameraTarget=new THREE.Vector3(), follow=new THREE.Vector3(), ray=new THREE.Raycaster(), mouse=new THREE.Vector2();
    const floorPlane=new THREE.Plane(new THREE.Vector3(0,1,0),0);
    const currentProfile = () => profileFor(latest.current.sceneId, latest.current.variantId, latest.current.encounteredSourceIds);
    const currentTarget = () => {
      const stage=currentProfile();
      return stage && avatar && !latest.current.disabled ? nearestTarget(stage,latest.current.choices,avatar.position) : null;
    };
    const interact = (expectedChoiceId: string) => {
      const target=currentTarget();
      // Re-check current choices and proximity so stale prompts cannot choose a previous scene's action.
      if(target?.choiceId===expectedChoiceId) { path=[]; keys.clear(); latest.current.onChoose(target.choiceId); }
    };
    controls.current={turn:amount=>{yaw+=amount;},reset:()=>{yaw=currentProfile()?.cameraYaw??Math.PI/4;},interact};
    const resize = () => {
      const width=Math.max(1,host.clientWidth),height=Math.max(1,host.clientHeight),aspect=width/height;
      camera.left=-8.8*aspect;camera.right=8.8*aspect;camera.top=8.8;camera.bottom=-8.8;camera.updateProjectionMatrix();renderer.setSize(width,height,false);
    };
    const observer=new ResizeObserver(resize);observer.observe(host);resize();
    const keydown = (event: KeyboardEvent) => {
      if(movementKeys.includes(event.code)){event.preventDefault();if(!latest.current.disabled)keys.add(event.code);path=[];}
      if(event.code==='KeyE'&&!event.repeat){event.preventDefault();const target=currentTarget();if(target)interact(target.choiceId);}
    };
    const keyup=(event:KeyboardEvent)=>keys.delete(event.code),blur=()=>{keys.clear();path=[];};
    host.addEventListener('keydown',keydown);host.addEventListener('keyup',keyup);host.addEventListener('blur',blur);window.addEventListener('blur',blur);
    let down: {x:number;y:number}|null=null;
    const pointerdown=(event:PointerEvent)=>{host.focus({preventScroll:true});down={x:event.clientX,y:event.clientY};};
    const pointerup=(event:PointerEvent)=>{
      if(!down)return;const click=down;down=null;
      const stage=currentProfile();if(!avatar||!stage||latest.current.disabled||Math.hypot(event.clientX-click.x,event.clientY-click.y)>10)return;
      const rect=host.getBoundingClientRect();mouse.set((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1);ray.setFromCamera(mouse,camera);
      const targets=targetsFor(stage,latest.current.choices);
      // A clicked visible actor or object may request a walk, never an immediate story action.
      const hits=asset?ray.intersectObject(asset,true):[];
      for(const hit of hits){
        let object:THREE.Object3D|null=hit.object,visible=true;
        while(object){if(!object.visible){visible=false;break;}object=object.parent;}
        if(!visible)continue;
        object=hit.object;
        while(object&&object!==asset){const target=targets.find(item=>item.object===object!.name);if(target){path=walkPath(stage.navigation,avatar.position,target);return;}object=object.parent;}
        break;
      }
      const point=new THREE.Vector3();if(ray.ray.intersectPlane(floorPlane,point))path=walkPath(stage.navigation,avatar.position,{x:point.x,z:point.z});
    };
    host.addEventListener('pointerdown',pointerdown);host.addEventListener('pointerup',pointerup);
    const loadedUrl=`${import.meta.env.BASE_URL}${profile.asset}`;
    new GLTFLoader().load(loadedUrl,gltf=>{
      if(disposed){release(gltf.scene);return;}
      asset=gltf.scene;scene.add(asset);asset.traverse(object=>{modelRest.set(object,object.position.clone());if(object instanceof THREE.Mesh){object.castShadow=true;object.receiveShadow=true;}});
      avatar=asset.getObjectByName('Blaise');
      if(!avatar){asset.visible=false;setStatus('The character model could not be opened. Dialogue and actions remain available below.');setFailed(true);return;}
      host.dataset.loaded='true';host.dataset.characterStyle='faceless-blocks';
      setStatus('Click the floor to walk. WASD or arrow keys move Blaise. E takes a nearby action.');
    },undefined,()=>{if(!disposed){setStatus('The world model could not be opened. Dialogue and actions remain available below.');setFailed(true);}});
    const tick=(now:number)=>{
      if(disposed)return;frame=requestAnimationFrame(tick);const dt=Math.min(Math.max(0,(now-last)/1000),0.05);last=now;
      const stage=currentProfile();
      if(avatar&&asset&&stage){
        const stageKey=`${latest.current.sceneId}:${latest.current.variantId??''}`;
        if(staged!==stageKey){
          staged=stageKey;yaw=stage.cameraYaw??Math.PI/4;path=[];keys.clear();nearKey='';setNear(null);
          for(const child of asset.children) child.visible=child.name==='Blaise'||child.name===stage.geometryGroup||stage.actors.some(actor=>actor.model===child.name);
          for(const actor of stage.actors){const object:THREE.Object3D|undefined=asset.getObjectByName(actor.model);if(object){if(object.parent!==asset)asset.add(object);object.visible=true;object.position.set(actor.x,actor.y??0,actor.z);object.rotation.set(actor.pitch??0,actor.yaw??0,actor.roll??0);modelRest.set(object,object.position.clone());}}
          for(const [name,visible]of Object.entries(stage.partVisibility??{})){const object=asset.getObjectByName(name);if(object)object.visible=visible;}
          avatar.position.set(stage.spawn.x,0,stage.spawn.z);cameraTarget.set(stage.spawn.x,0.9,stage.spawn.z);
          host.dataset.geometryGroup=stage.geometryGroup;
          host.dataset.visibleModels=stage.actors.map(actor=>actor.model).join(',');
          host.dataset.variantId=latest.current.variantId??`${latest.current.sceneId}.base`;host.dataset.sceneId=latest.current.sceneId;host.dataset.scene=latest.current.sceneId;
        }
        let dx=0,dz=0;
        if(!latest.current.disabled){
          const forward=(keys.has('KeyW')||keys.has('ArrowUp')?1:0)-(keys.has('KeyS')||keys.has('ArrowDown')?1:0);
          const right=(keys.has('KeyD')||keys.has('ArrowRight')?1:0)-(keys.has('KeyA')||keys.has('ArrowLeft')?1:0);
          dx=-Math.sin(yaw)*forward+Math.cos(yaw)*right;dz=-Math.cos(yaw)*forward-Math.sin(yaw)*right;
          if(!dx&&!dz&&path.length){const next=path[0];dx=next.x-avatar.position.x;dz=next.z-avatar.position.z;if(Math.hypot(dx,dz)<0.08){path.shift();dx=0;dz=0;}}
        }else{keys.clear();path=[];}
        const length=Math.hypot(dx,dz);
        if(length){const speed=Math.min(dt*3.2,keys.size?Infinity:length);const next=moveWithinArea(stage.navigation,avatar.position,{x:dx/length*speed,z:dz/length*speed});avatar.position.x=next.x;avatar.position.z=next.z;avatar.rotation.y=Math.atan2(dx,dz);walkPhase+=dt*8;}
        for(const [part,sign]of [['LeftLeg',1],['RightLeg',-1],['LeftArm',-1],['RightArm',1]]as const){const limb=avatar.getObjectByName(`Blaise_${part}`);if(limb)limb.rotation.x=length&&!reduced?Math.sin(walkPhase)*0.10*sign:0;}
        for(const actor of stage.actors){if(actor.carried){const object=asset.getObjectByName(actor.model);if(object)object.position.set(avatar.position.x+actor.x,actor.y??0,avatar.position.z+actor.z);}}
        for(const motion of stage.motions??[]){const object=asset.getObjectByName(motion.object),rest=object?modelRest.get(object):undefined;if(object&&rest)object.position[motion.axis]=rest[motion.axis]+(reduced?0:Math.sin(now/1000*motion.speed)*motion.amplitude);}
        const target=currentTarget(),targetKey=target?`${target.choiceId}:${target.label}`:'';
        if(nearKey!==targetKey){nearKey=targetKey;setNear(target);}marker.visible=!!target;if(target)marker.position.set(target.x,0.035,target.z);
        follow.set(avatar.position.x,0.9,avatar.position.z);cameraTarget.lerp(follow,reduced?1:1-Math.exp(-dt*7));
        camera.position.set(cameraTarget.x+Math.sin(yaw)*20,cameraTarget.y+18,cameraTarget.z+Math.cos(yaw)*20);camera.lookAt(cameraTarget);
        host.dataset.playerX=avatar.position.x.toFixed(2);host.dataset.playerZ=avatar.position.z.toFixed(2);
      }
      renderer.render(scene,camera);
    };
    frame=requestAnimationFrame(tick);
    return()=>{
      disposed=true;cancelAnimationFrame(frame);observer.disconnect();controls.current=undefined;
      host.removeEventListener('keydown',keydown);host.removeEventListener('keyup',keyup);host.removeEventListener('blur',blur);window.removeEventListener('blur',blur);
      host.removeEventListener('pointerdown',pointerdown);host.removeEventListener('pointerup',pointerup);
      delete host.dataset.loaded;release(scene);light.shadow.dispose();renderer.dispose();renderer.domElement.remove();
    };
  },[profile?.asset]);
  const visibleNear = near && profile && targetsFor(profile,props.choices).some(target=>target.choiceId===near.choiceId&&target.label===near.label) ? near : null;
  if(!profile)return <section className="country-world country-world-fallback" aria-label="World view"><p>This passage is presented in text. Continue with the actions below.</p></section>;
  return <section className="country-world" aria-label={`Explore ${profile.title}`}>
    <div ref={mount} className="country-world-canvas" tabIndex={0} role="application" aria-label="Third-person exploration. Move Blaise with WASD or arrow keys; E takes a nearby action." aria-describedby="country-world-controls"/>
    <div className="country-world-caption"><span>{profile.title}</span><span>Blaise Bloom</span></div>
    {visibleNear&&!props.disabled&&<div className="country-world-near"><strong>{visibleNear.shortLabel}</strong><p>{visibleNear.label}</p><button onClick={()=>controls.current?.interact(visibleNear.choiceId)}>Take this action <kbd>E</kbd></button></div>}
    <div className="country-world-controls" id="country-world-controls"><p role="status">{status}</p>{!failed&&<div><button className="quiet" aria-label="Turn camera left" onClick={()=>controls.current?.turn(-Math.PI/4)}>↶</button><button className="quiet" aria-label="Reset camera angle" onClick={()=>controls.current?.reset()}>Camera</button><button className="quiet" aria-label="Turn camera right" onClick={()=>controls.current?.turn(Math.PI/4)}>↷</button></div>}</div>
  </section>;
}

export { profileFor, hasStaging } from './profiles';
