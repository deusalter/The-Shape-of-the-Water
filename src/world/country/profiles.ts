import type { NavigationArea, Point } from './navigation';
export interface WorldChoice { id: string; label: string }
export interface ActorStage extends Point { model:string; y?:number; yaw?:number; pitch?:number; roll?:number; carried?:boolean }
export interface ActionAnchor extends Point { object:string; shortLabel:string }
export interface SceneProfile {
  id:string; title:string; asset:string; geometryGroup:string; spawn:Point; navigation:NavigationArea;
  cameraYaw?:number; actors:readonly ActorStage[]; actions:Readonly<Record<string,ActionAnchor>>;
  partVisibility?:Readonly<Record<string,boolean>>;
  motions?:readonly {object:string;axis:'x'|'y'|'z';amplitude:number;speed:number}[];
}
export interface WorldTarget extends ActionAnchor {choiceId:string;label:string}
const asset='world/country/first-country-locations.glb';
const orchard:NavigationArea={bounds:{minX:-8.4,maxX:8.4,minZ:-7.0,maxZ:7.1},obstacles:[
  ...[[-3,2],[0,-1],[4,3.5]].map(([x,z])=>({minX:x-1.8,maxX:x+1.8,minZ:z-.93,maxZ:z+.93})),
  ...[[-4.2,3.25],[-1.8,3.25],[-1.2,.15],[1.2,.15],[2.8,4.75],[5.2,4.75]].map(([x,z])=>({minX:x-.48,maxX:x+.48,minZ:z-.48,maxZ:z+.48})),
  {minX:-7.1,maxX:-3.5,minZ:-5,maxZ:-3.7},
]};
const theatre:NavigationArea={bounds:{minX:-7.2,maxX:6.6,minZ:-5.6,maxZ:6.4},obstacles:[
  {minX:-2.85,maxX:2.85,minZ:-.1,maxZ:3.7},
  {minX:-.5,maxX:.5,minZ:-3.2,maxZ:-2.3},
  ...[-5.5,-4].map(x=>({minX:x-.85,maxX:x+.85,minZ:2.95,maxZ:4.4})),
]};
const house:NavigationArea={bounds:{minX:-5.15,maxX:5.15,minZ:-5.1,maxZ:5.15},obstacles:[
  {minX:1,maxX:3.8,minZ:-.1,maxZ:2.1},{minX:4.1,maxX:5.5,minZ:-4.2,maxZ:-1.5},
  ...[-2.8,-.7].map(x=>({minX:x-.55,maxX:x+.55,minZ:1.72,maxZ:2.82})),
]};
const anchors={
  strip:{object:'RainStrip',shortLabel:'The living rain strip',x:-5.0,z:-3.25},
  cradle:{object:'BranchCradle',shortLabel:'Alma and the altered cradle',x:4,z:2.0},
  root:{object:'DoraRoot',shortLabel:'Return to the rooted speaking piece',x:-5.65,z:-5.8},
  path:{object:'CakeTable',shortLabel:'Leave with cakes after telling Dora',x:-5.4,z:2.0},
  floor:{object:'SourceFloorPanel',shortLabel:'Basil and the source floor',x:3.3,z:1.3},
  pipe:{object:'Basil',shortLabel:'Basil and the split pipe',x:2.5,z:-.7},
  theatreDoor:{object:'EntranceCurtain',shortLabel:'Dora, Basil and the theatre doorway',x:6.2,z:3.35},
  emil:{object:'Emil',shortLabel:'Emil beside the answering leaf',x:.4,z:2.6},
  leaf:{object:'OpenFloorLeaf',shortLabel:'The local leaf return',x:-3.1,z:-.4},
  drawing:{object:'SupportDrawing',shortLabel:'Emil’s support drawing',x:1.4,z:2.65},
  door:{object:'SlowHouseDoor',shortLabel:'The slow door',x:2.8,z:4.6},
  rene:{object:'Rene',shortLabel:'René at the house',x:1,z:3.8},
};
const actionGroups:[readonly string[],ActionAnchor][]=[
 [['o0.follow-rain-strip'],anchors.strip], [['o0.ask-about-cradle','o0.make-cradle-rubbing','o0.borrow-cradle'],anchors.cradle],
 [['o0.rubbing-to-root','o0.loan-to-root'],anchors.root], [['o0.tell-orchard-departure','o0.orchard-reach-house'],anchors.path],
 [['o0.inspect-source-floor','o0.trace-floor','o0.arrange-panel'],anchors.floor],
 [['o0.tracing-to-pipe','o0.panel-to-pipe','o0.accept-pipe-part','o0.prefer-bodily-whistle','o0.rehearsal-next','o0.invitation-next'],anchors.pipe],
 [['o0.tell-dry-departure','o0.dry-reach-house'],anchors.theatreDoor],
 [['o0.tell-emil-mechanism','o0.write-emil-account','o0.keep-emil-oral'],anchors.emil],
 [['o0.written-to-leaf','o0.oral-to-leaf'],anchors.leaf], [['o0.ask-emil-drawing'],anchors.drawing],
 [['o0.wait-house-door'],anchors.door], [['o0.tell-rene-cast'],anchors.rene],
];
const actionAnchors=Object.fromEntries(actionGroups.flatMap(([ids,anchor])=>ids.map(id=>[id,anchor])));
const sceneChoices:Readonly<Record<string,readonly string[]>>={
 'o0.orchard-roof':['o0.follow-rain-strip'],'o0.rain-strip':['o0.ask-about-cradle'],
 'o0.cradle-account':['o0.make-cradle-rubbing','o0.borrow-cradle'],'o0.cradle-rubbing':['o0.rubbing-to-root'],'o0.cradle-loan':['o0.loan-to-root'],
 'o0.orchard-report':['o0.tell-orchard-departure'],'o0.orchard-house-departure':['o0.orchard-reach-house'],
 'o0.dry-rehearsal':['o0.inspect-source-floor'],'o0.source-floor':['o0.trace-floor','o0.arrange-panel'],
 'o0.floor-tracing':['o0.tracing-to-pipe'],'o0.panel-arrangement':['o0.panel-to-pipe'],
 'o0.pipe-discovery':['o0.accept-pipe-part','o0.prefer-bodily-whistle'],'o0.pipe-rehearsal':['o0.rehearsal-next'],
 'o0.whistle-invitation':['o0.invitation-next'],'o0.dry-house-lead':['o0.tell-dry-departure'],'o0.dry-house-departure':['o0.dry-reach-house'],
 'o0.house-window':['o0.tell-emil-mechanism'],'o0.emil-account':['o0.write-emil-account','o0.keep-emil-oral'],
 'o0.account-written':['o0.written-to-leaf'],'o0.account-oral':['o0.oral-to-leaf'],'o0.leaf-return':['o0.ask-emil-drawing'],
 'o0.emil-control':['o0.wait-house-door'],'o0.house-door':['o0.tell-rene-cast'],'o0.rene-arrival':[],
};
const root:ActorStage={model:'DoraRoot',x:-5.9,z:-4.9};
const alma:ActorStage={model:'Alma',x:-1.8,z:1.2,yaw:-.6};
const cradle:ActorStage={model:'BranchCradle',x:4,z:3.5,y:1.02};
const floor:ActorStage={model:'SourceFloorPanel',x:0,z:1.8,y:1.1};
const front:ActorStage={model:'SourceFloorPanel',x:0,z:-5.9,y:1.7,pitch:-Math.PI/2};
const basil:ActorStage={model:'Basil',x:2.1,z:-1.4,yaw:-.5};
const dora:ActorStage={model:'TableDora',x:3.6,z:-1.3,yaw:-.6};
const picture:ActorStage={model:'CountryBluePicture',x:3.6,z:-1.0,y:.6};
const emil:ActorStage={model:'Emil',x:-.7,z:2.3};
const sceneGroups:Readonly<Record<string,string>>=Object.fromEntries([
 ...['o0.orchard-roof','o0.rain-strip','o0.cradle-account','o0.cradle-rubbing','o0.cradle-loan','o0.orchard-report','o0.orchard-house-departure'].map(id=>[id,'OrchardWedding']),
 ...['o0.dry-rehearsal','o0.source-floor','o0.floor-tracing','o0.panel-arrangement','o0.pipe-discovery','o0.pipe-rehearsal','o0.whistle-invitation','o0.dry-house-lead','o0.dry-house-departure'].map(id=>[id,'DryTheatre']),
 ...['o0.house-window','o0.emil-account','o0.account-written','o0.account-oral','o0.leaf-return','o0.emil-control','o0.house-door','o0.rene-arrival'].map(id=>[id,'LowHouse']),
]);
const profiles:SceneProfile[]=Object.entries(sceneChoices).map(([id,ids])=>{
 const group=sceneGroups[id];
 const actors:ActorStage[]=group==='OrchardWedding'?[root,alma,cradle]:group==='DryTheatre'?[basil,dora,picture,front]:[emil];
 return {id,title:group==='OrchardWedding'?'The orchard wedding':group==='DryTheatre'?'The shed-room theatre':'The low house',asset,geometryGroup:group,
 spawn:group==='OrchardWedding'?{x:-5,z:2.8}:group==='DryTheatre'?{x:4.6,z:2.3}:{x:.4,z:2.6},
 navigation:group==='OrchardWedding'?orchard:group==='DryTheatre'?theatre:house,actors,actions:Object.fromEntries(ids.map(choice=>[choice,actionAnchors[choice]])),
 partVisibility:group==='LowHouse'?{LooseFlakeOutsideReach:false,ReturnedLeafFlake:false,EmilSupportDrawing:false,EmilMealBowl:false,BurntFruitJar:false}:undefined,
 motions:group==='LowHouse'?[{object:'LeafReturnMound',axis:'y',amplitude:.025,speed:1.15}]:undefined};
});
for(const stage of profiles){
 if(stage.geometryGroup==='OrchardWedding'){
  if(['o0.rain-strip','o0.orchard-report'].includes(stage.id)){stage.spawn={x:-5.65,z:-5.8};stage.cameraYaw=-Math.PI/4;}
  if(stage.id.startsWith('o0.cradle')){stage.spawn={x:4,z:2};stage.actors=[root,{...alma,x:5.85,z:3.1,yaw:-Math.PI/2},cradle];}
  if(stage.id==='o0.cradle-rubbing')stage.actors=[...stage.actors,{model:'CradleRubbing',x:4,z:3.3,y:1.66}];
  if(stage.id==='o0.cradle-loan')stage.actors=stage.actors.map(actor=>actor.model==='BranchCradle'?{...actor,x:.8,z:0,y:.65,carried:true}:actor);
  if(stage.id==='o0.orchard-report')stage.actors=[root,alma,cradle,{model:'CradleRubbing',x:.5,z:0,y:1.0,carried:true}];
  if(stage.id==='o0.orchard-house-departure'){stage.spawn={x:-5.4,z:2};stage.actors=[root,alma,cradle];}
 }
 if(stage.geometryGroup==='DryTheatre'){
  if(stage.id!=='o0.dry-rehearsal')stage.actors=stage.actors.filter(actor=>actor.model!=='SourceFloorPanel');
  if(['o0.source-floor','o0.floor-tracing','o0.panel-arrangement'].includes(stage.id)){stage.spawn={x:3.3,z:1.3};stage.actors=[{...basil,x:3.3,z:2.9},dora,picture,floor];}
  if(stage.id==='o0.floor-tracing')stage.actors=[...stage.actors,{model:'FloorTracing',x:1.7,z:1.7,y:1.22}];
  if(['o0.floor-tracing','o0.panel-arrangement'].includes(stage.id))stage.actions=Object.fromEntries(Object.entries(stage.actions).map(([id,anchor])=>[id,{...anchor,x:3.3,z:1.3}]));
  if(stage.id==='o0.panel-arrangement')stage.actors=[...stage.actors.filter(actor=>actor.model!=='SourceFloorPanel'),{...floor,x:3.5,z:4.9,y:.3},{model:'PanelLowBlocks',x:3.5,z:4.9}];
  if(['o0.pipe-discovery','o0.whistle-invitation'].includes(stage.id)){stage.spawn={x:2.5,z:-.7};stage.actors=[basil,dora,picture,{model:'SplitPipe',x:2.1,z:-1.15,y:1.18}];}
  if(stage.id==='o0.pipe-rehearsal'){stage.spawn={x:0,z:-1.7};stage.actors=[{...basil,x:2.7,z:-1.5},dora,picture,{model:'SplitPipe',x:.5,z:0,y:1.1,carried:true}];}
  if(stage.id.startsWith('o0.dry-house')){stage.spawn={x:6.2,z:3.35};stage.actors=[{...basil,x:4.6,z:4.5},{...dora,x:5.4,z:2.7},{...picture,x:5.4,z:3,y:.6}];}
  if(stage.id==='o0.dry-house-departure')stage.actors=[...stage.actors.map(actor=>actor.model==='CountryBluePicture'?{...actor,x:4.9,z:-6.5,y:.9}:actor),{model:'CountryLamp',x:.55,z:0,y:.85,carried:true}];
 }
 if(stage.geometryGroup==='LowHouse'){
  const flake=stage.id!=='o0.house-window',returned=['o0.leaf-return','o0.emil-control','o0.house-door','o0.rene-arrival'].includes(stage.id),drawing=['o0.emil-control','o0.house-door','o0.rene-arrival'].includes(stage.id);
  stage.partVisibility={LooseFlakeOutsideReach:flake,ReturnedLeafFlake:returned,EmilSupportDrawing:drawing,EmilMealBowl:returned,BurntFruitJar:returned};
  if(stage.id==='o0.account-written')stage.actors=[emil,{model:'WrittenAccount',x:.4,z:2.45,y:1.1}];
  if(stage.id==='o0.house-door'){stage.spawn={x:1,z:3.8};stage.actors=[emil,{model:'Rene',x:2.5,z:4.55,yaw:Math.PI},{model:'ReneCleanStrips',x:-2.8,z:2.3,y:.61}];}
  if(stage.id==='o0.rene-arrival')stage.actors=[emil,{model:'ReneSeated',x:-2.8,z:2.3},{model:'ReneCleanStrips',x:-3.7,z:2.7,y:.03}];
 }
}
for(const stage of profiles){if(['o0.orchard-report','o0.orchard-house-departure'].includes(stage.id))stage.actors=[...stage.actors,{model:'WrappedCakes',x:-.6,z:0,y:1,carried:true}];}
const entries:[string,SceneProfile][]=profiles.flatMap(profile=>[[profile.id,profile],[`${profile.id}:${profile.id}.base`,profile]]);
const report=profiles.find(profile=>profile.id==='o0.orchard-report')!;
entries.push(['o0.orchard-report:o0.orchard-report-with-cradle',{...report,actors:[root,alma,{...cradle,x:.8,z:0,y:.65,carried:true},{model:'WrappedCakes',x:-.6,z:0,y:1,carried:true}]}]);
const departure=profiles.find(profile=>profile.id==='o0.orchard-house-departure')!;
entries.push(['o0.orchard-house-departure:o0.orchard-departure-with-frame',{...departure,actors:[root,alma,{...cradle,x:.8,z:0,y:.65,carried:true},{model:'WrappedCakes',x:-.6,z:0,y:1,carried:true}]}]);
const houseWindow=profiles.find(profile=>profile.id==='o0.house-window')!;
entries.push(['o0.house-window:o0.house-window-with-cradle',{...houseWindow,actors:[emil,{...cradle,x:1.3,z:6.25,y:.05},{model:'WrappedCakes',x:2.0,z:6.35,y:.05}]}]);
entries.push(['o0.house-window:o0.house-window-with-lamp',{...houseWindow,actors:[emil,{model:'CountryLamp',x:1.3,z:6.25,y:.05}]}]);
export const sceneProfiles:Readonly<Record<string,SceneProfile>>=Object.fromEntries(entries);
/** Current encountered scene/variant only. Historical sources do not imply present inventory or audience. */
export function profileFor(sceneId:string,variantId?:string,_encounteredSourceIds:readonly string[]=[]):SceneProfile|undefined{return sceneProfiles[variantId?`${sceneId}:${variantId}`:sceneId];}
export function hasStaging(sceneId:string,variantId?:string):boolean{return !!profileFor(sceneId,variantId);}
export function targetsFor(profile:SceneProfile,choices:readonly WorldChoice[]):WorldTarget[]{return choices.flatMap(choice=>{const anchor=profile.actions[choice.id];return anchor?[{...anchor,choiceId:choice.id,label:choice.label}]:[];});}
export function nearestTarget(profile:SceneProfile,choices:readonly WorldChoice[],point:Point,radius=1.8):WorldTarget|null{return targetsFor(profile,choices).map(target=>({target,distance:Math.hypot(target.x-point.x,target.z-point.z)})).filter(item=>item.distance<radius).sort((a,b)=>a.distance-b.distance)[0]?.target??null;}
