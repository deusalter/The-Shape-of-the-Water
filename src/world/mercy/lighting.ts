import * as THREE from 'three';
import type {Location} from './profiles';

// Authored light, rather than a universal noon sun. Lighting never advances story state.
const looks = {
 morning: {sky:'#607f89',horizon:'#d9b99b',fog:'#b9b2a0',near:24,far:66,key:'#ffd1a0',power:3.3,position:[-13,14,-8],ambient:1.1,ground:'#605363',fill:'#93c2d0',fillPower:1.1,exposure:1.02,practical:6},
 evening: {sky:'#384b68',horizon:'#af8a8e',fog:'#8b8390',near:22,far:62,key:'#f5b2a0',power:2.7,position:[-16,10,-9],ambient:.85,ground:'#3f344e',fill:'#9cb8da',fillPower:.8,exposure:1,practical:13},
 theatre: {sky:'#435b68',horizon:'#a3b4ab',fog:'#849894',near:26,far:65,key:'#cbe5ed',power:2.5,position:[-11,12,-14],ambient:.8,ground:'#4c3544',fill:'#ffd0a4',fillPower:.35,exposure:1.06,practical:12},
 lateTheatre: {sky:'#303a52',horizon:'#8b8596',fog:'#6d7382',near:25,far:64,key:'#a8c8e7',power:1.9,position:[-11,12,-14],ambient:.8,ground:'#423449',fill:'#eebdb1',fillPower:.42,exposure:1.05,practical:15},
 rain: {sky:'#203b4b',horizon:'#688889',fog:'#40636b',near:17,far:48,key:'#a9d4df',power:1.75,position:[-10,17,-8],ambient:1.1,ground:'#394454',fill:'#9bd1ce',fillPower:.9,exposure:1.12,practical:20},
 edge: {sky:'#566f92',horizon:'#d5b5b0',fog:'#a4afb6',near:21,far:61,key:'#f8d6c0',power:2.7,position:[-16,12,-10],ambient:1,ground:'#535775',fill:'#b0c7ef',fillPower:.7,exposure:1.02,practical:9},
} as const;
export function lightingFor(location:Location){
 return location==='market'||location==='outside-theatre'?looks.rain:location==='edge'?looks.edge:location==='theatre'?looks.theatre:location==='late-theatre'?looks.lateTheatre:location==='late-square'?looks.evening:looks.morning;
}

export function createLighting(scene:THREE.Scene,renderer:THREE.WebGLRenderer){
 const key=new THREE.DirectionalLight();key.castShadow=true;key.shadow.mapSize.set(2048,2048);
 Object.assign(key.shadow.camera,{left:-15,right:15,top:15,bottom:-15,near:1,far:65});
 key.shadow.bias=-.00025;key.shadow.normalBias=.035;key.shadow.radius=3.5;
 const ambient=new THREE.HemisphereLight(),fill=new THREE.DirectionalLight();fill.position.set(9,7,12);
 const practicals=[-7.5,7.5].map(x=>{const light=new THREE.PointLight('#ffc78d',0,9,2);light.position.set(x,3.1,6.6);return light;});
 const stage=new THREE.SpotLight('#ffc48c',0,24,.8,.75,1.7);stage.position.set(0,7,-1);stage.target.position.set(0,.2,-5);
 const sky=new THREE.Mesh(new THREE.SphereGeometry(100,24,12),new THREE.ShaderMaterial({
  side:THREE.BackSide,depthWrite:false,fog:false,
  uniforms:{zenith:{value:new THREE.Color()},horizon:{value:new THREE.Color()}},
  vertexShader:'varying vec3 direction; void main(){direction=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader:'uniform vec3 zenith; uniform vec3 horizon; varying vec3 direction; void main(){float height=normalize(direction).y; gl_FragColor=vec4(mix(horizon,zenith,smoothstep(-.05,.65,height)),1.);\n #include <tonemapping_fragment>\n #include <colorspace_fragment>}',
 }));sky.name='Painted atmosphere';sky.renderOrder=-1;
 scene.add(key,key.target,ambient,fill,...practicals,stage,stage.target,sky);
 return {
  apply(location:Location){const look=lightingFor(location);renderer.toneMappingExposure=look.exposure;
   key.color.set(look.key);key.intensity=look.power;key.position.set(look.position[0],look.position[1],look.position[2]);
   ambient.color.set(look.fill);ambient.groundColor.set(look.ground);ambient.intensity=look.ambient;
   fill.color.set(look.fill);fill.intensity=look.fillPower;
   practicals.forEach(light=>{light.intensity=look.practical;});stage.intensity=location.includes('theatre')?42:0;
   sky.material.uniforms.zenith.value.set(look.sky);sky.material.uniforms.horizon.value.set(look.horizon);
   scene.background=new THREE.Color(look.horizon);scene.fog=new THREE.Fog(look.fog,look.near,look.far);
  },
  dispose(){key.shadow.dispose();},
 };
}
