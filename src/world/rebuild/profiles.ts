import type { NavigationArea, Point } from './navigation';
export interface WorldChoice { id: string; label: string }
/** Staged model roots may be people or authored movable objects. */
export interface ActorStage extends Point { model: string; yaw?: number; y?: number }
export interface ActionAnchor extends Point { object: string; shortLabel: string }
export interface SceneProfile {
  id: string; title: string; asset: string; geometryGroup: string; spawn: Point;
  navigation: NavigationArea; actors: readonly ActorStage[];
  partVisibility?: Readonly<Record<string, boolean>>;
  motions?: readonly { object: string; axis: 'x' | 'z'; amplitude: number; speed: number }[];
  /** Exact authored choice ids; labels never instruct the renderer. */
  actions: Readonly<Record<string, ActionAnchor>>;
}
export interface WorldTarget extends ActionAnchor { choiceId: string; label: string }
const asset='world/rebuild/second-mouth-supper.glb';
const upperNavigation:NavigationArea={
  bounds:{minX:-6.45,maxX:6.4,minZ:-5.05,maxZ:5.35},
  obstacles:[
    {minX:-3.6,maxX:3.6,minZ:-.77,maxZ:1.92},
    {minX:-6.95,maxX:-5.65,minZ:-4.6,maxZ:-1.0},
    {minX:-3.65,maxX:-2.65,minZ:1.65,maxZ:2.37},
    {minX:-1.3,maxX:-.3,minZ:1.62,maxZ:2.65},
    {minX:1.5,maxX:2.5,minZ:1.62,maxZ:2.65},
    {minX:-1.4,maxX:-.4,minZ:-1.65,maxZ:-.4},
    {minX:1.2,maxX:2.2,minZ:-1.65,maxZ:-.4},
  ],
};
const lowerNavigation:NavigationArea={
  bounds:{minX:-4.1,maxX:4.1,minZ:-5.2,maxZ:5.2},
  obstacles:[{minX:-4,maxX:-1.8,minZ:1.5,maxZ:3.9},{minX:0,maxX:4.05,minZ:-5.05,maxZ:-2.15},
    ...[-3.8,3.8].flatMap(x=>[-4.6,-1,3.4].map(z=>({minX:x-.3,maxX:x+.3,minZ:z-.3,maxZ:z+.3})))],
};
const anchor={
  noorPanel:{object:'NoorPanel',shortLabel:'Noor at the low panel',x:-2.4,z:-3.7},
  panel:{object:'LowPanel',shortLabel:'Noor and the wall panel',x:-2.4,z:-3.7},
  mouth:{object:'WoodenMouth',shortLabel:'The mouth beneath Blaise’s chair',x:-4.05,z:2.5},
  doraFirst:{object:'Dora',shortLabel:'The woman at the table',x:1.7,z:-2.3},
  dora:{object:'Dora',shortLabel:'The woman at the table',x:-.9,z:-2.3},
  root:{object:'RootHand',shortLabel:'The rooted speaking piece',x:.9,z:-4.4},
  rope:{object:'SoftRope',shortLabel:'The soft rope',x:5.5,z:3.2},
  ropeWoman:{object:'DoraStanding',shortLabel:'The woman helping with the rope',x:4.5,z:3.2},
  stair:{object:'SideDoorLintel',shortLabel:'The side steps',x:5.7,z:1.9},
  room:{object:'SupperTable',shortLabel:'The supper room',x:-4.05,z:2.5},
  cast:{object:'DoraPlaceCast',shortLabel:'The underside of Dora’s former place',x:-.7,z:-1.6},
  niche:{object:'EmptyReturnNiche',shortLabel:'The unoccupied cup niche',x:-1.35,z:2.7},
  upstairs:{object:'LowerSideGate',shortLabel:'Return to the supper room',x:2.9,z:4.25},
  transfer:{object:'SupportTransferPanel',shortLabel:'The new reach beside the window',x:5.5,z:-4.5},
  orchard:{object:'OrchardOpening',shortLabel:'The opening beside the orchard',x:4.0,z:-4.6},
};
const actionGroups:[readonly string[],ActionAnchor][]=[
  [['o0.hear-noor'],anchor.noorPanel],
  [['o0.inspect-p','o0.revisit-braid','o0.sill-investigate'],anchor.panel],
  [['o0.keep-promise','o0.break-promise','o0.watch-release','o0.inspect-wedge'],anchor.mouth],
  [['o0.look-after-touch'],anchor.doraFirst],
  [['o0.hold-root-kept','o0.hold-root-touched','o0.root-secured','o0.talk-root','o0.private-confession','o0.confession-back'],anchor.root],
  [['o0.rope-kept','o0.rope-touched'],anchor.rope],
  [['o0.rope-secured'],anchor.ropeWoman],
  [['o0.talk-table','o0.table-want','o0.table-affection-choice','o0.table-memory-test','o0.report-confess','o0.tell-finding','o0.choose-dry'],anchor.dora],
  [['o0.go-below','o0.remove-cast-later','o0.leave-for-dry'],anchor.stair],
  [['o0.organize-finding','o0.p-back','o0.q-back','o0.p-revisit-back','o0.table-want-back','o0.table-affection-back','o0.table-refusal-back','o0.root-back','o0.claim-back'],anchor.room],
  [['o0.look-under-place','o0.isolate-occupied-cast'],anchor.cast],
  [['o0.look-niche','o0.niche-before-removal','o0.operate-empty-return','o0.decline-empty-return'],anchor.niche],
  [['o0.test-back','o0.decline-test-back','o0.removed-after-test'],anchor.upstairs],
  [['o0.report-go-transfer','o0.confessed-go-transfer','o0.offer-new-reach','o0.offer-old-body','o0.ask-handover','o0.offer-to-argument','o0.reconstruction-to-argument','o0.handover-to-argument','o0.after-argument'],anchor.transfer],
  [['o0.choose-orchard','o0.leave-for-orchard'],anchor.orchard],
];
const actionAnchors:Readonly<Record<string,ActionAnchor>>=Object.fromEntries(actionGroups.flatMap(([ids,point])=>ids.map(id=>[id,point])));
const sceneActions:Record<string,readonly string[]>={
  'o0.supper':['o0.hear-noor'], 'o0.promise':['o0.keep-promise','o0.break-promise'],
  'o0.leave-mouth':['o0.watch-release'], 'o0.close-mouth':['o0.look-after-touch'],
  'o0.exposure-kept':['o0.hold-root-kept','o0.rope-kept'], 'o0.exposure-touched':['o0.hold-root-touched','o0.rope-touched'],
  'o0.catch-tree':['o0.root-secured'], 'o0.fetch-rope':['o0.rope-secured'], 'o0.sill':['o0.sill-investigate'],
  'o0.room-hub':['o0.inspect-p','o0.inspect-wedge','o0.talk-table','o0.talk-root','o0.go-below','o0.remove-cast-later','o0.organize-finding','o0.revisit-braid'],
  'o0.direct-braid':['o0.p-back'], 'o0.wedge':['o0.q-back'], 'o0.braid-revisit':['o0.p-revisit-back'],
  'o0.table-conversation':['o0.table-want','o0.table-affection-choice','o0.table-memory-test'],
  'o0.table-want':['o0.table-want-back'], 'o0.table-affection':['o0.table-affection-back'], 'o0.table-refusal':['o0.table-refusal-back'],
  'o0.root-conversation':['o0.root-back','o0.private-confession'], 'o0.private-confession':['o0.confession-back'],
  'o0.lower-passage':['o0.look-under-place'], 'o0.cast-inspection':['o0.isolate-occupied-cast','o0.niche-before-removal'], 'o0.cast-removal':['o0.look-niche','o0.removed-after-test'],
  'o0.niche':['o0.operate-empty-return','o0.decline-empty-return'], 'o0.return-test':['o0.test-back'], 'o0.return-declined':['o0.decline-test-back'],
  'o0.claim':['o0.claim-back'], 'o0.finding-private':['o0.tell-finding'],
  'o0.report':['o0.report-confess','o0.report-go-transfer'], 'o0.public-confession':['o0.confessed-go-transfer'],
  'o0.transfer':['o0.offer-new-reach','o0.offer-old-body','o0.ask-handover'],
  'o0.reach-offer':['o0.offer-to-argument'], 'o0.reach-reconstruction':['o0.reconstruction-to-argument'], 'o0.reach-handover':['o0.handover-to-argument'],
  'o0.god-argument':['o0.after-argument'], 'o0.invitations':['o0.choose-orchard','o0.choose-dry'],
  'o0.orchard-agreement':['o0.leave-for-orchard'], 'o0.dry-agreement':['o0.leave-for-dry'],
  'o0.orchard-departure':[], 'o0.dry-departure':[],
};
const initialParts={Dora_LeftHand:false,ReleasedWedge:false,WedgeFreshEnd:false,ConnectionQ:true,LooseQEnd:false,RootSupportRope:false,TransferFold:false};
const transformedParts={Dora_LeftHand:true,ReleasedWedge:false,WedgeFreshEnd:false,ConnectionQ:false,LooseQEnd:true,RootSupportRope:true,TransferFold:false};
const upper=(id:string,before=false):SceneProfile=>({
  id,title:'The changing supper room',asset,geometryGroup:'SupperRoom',spawn:before?{x:-3.15,z:2.5}:{x:-.8,z:-4},navigation:upperNavigation,
  actors:[{model:'Dora',x:before||id.startsWith('o0.exposure')?1.7:-.9,z:-1,yaw:Math.PI},
    before?{model:'NoorPanel',x:-2.4,z:-4.55,yaw:.25}:{model:'NoorWindow',x:.1,z:-4.9,yaw:Math.PI},
    before?{model:'SpeakingPiece',x:6.2,y:2.9,z:2}:{model:'SpeakingPiece',x:.91,y:.89,z:-6.78},
    {model:'BlueRoomPainting',x:5.87,y:1.95,z:-5.70}],
  partVisibility:before?initialParts:transformedParts,
  motions:[{object:'OrchardTree',axis:'x',amplitude:.28,speed:.20},...before?[]:[{object:'SpeakingPiece',axis:'x' as const,amplitude:.28,speed:.20}]],
  actions:Object.fromEntries((sceneActions[id]??[]).map(choiceId=>[choiceId,actionAnchors[choiceId]])),
});
const beforeIds=['o0.supper','o0.promise','o0.leave-mouth','o0.close-mouth'];
const lowerIds=['o0.lower-passage','o0.cast-inspection','o0.cast-removal','o0.niche','o0.return-test','o0.return-declined','o0.dry-departure'];
const transferIds=['o0.transfer','o0.reach-offer','o0.reach-reconstruction','o0.reach-handover','o0.god-argument'];
const profiles=Object.keys(sceneActions).map(id=>{
  if(!lowerIds.includes(id))return upper(id,beforeIds.includes(id));
  return {
    id,title:'The lower passage',asset,geometryGroup:'LowerPassage',spawn:id==='o0.lower-passage'?{x:2.8,z:4.1}:['o0.cast-inspection','o0.cast-removal'].includes(id)?{x:-.7,z:-1.6}:{x:-1.4,z:2.7},navigation:lowerNavigation,
    actors:[{model:'NoorLower',x:.9,z:-1.3,yaw:.6},['o0.cast-removal','o0.dry-departure'].includes(id)?{model:'DoraPlaceCast',x:2.1,y:-1.05,z:-3.6}:{model:'DoraPlaceCast',x:0,y:0,z:-2.35}],
    partVisibility:{CupCharcoalMark:['o0.niche','o0.return-declined'].includes(id)},
    actions:Object.fromEntries(sceneActions[id].map(choiceId=>[choiceId,actionAnchors[choiceId]])),
  } satisfies SceneProfile;
});
for(const profile of profiles){
  if(['o0.exposure-kept','o0.exposure-touched'].includes(profile.id)){
    profile.spawn={x:-3.15,z:2.5};profile.partVisibility={...transformedParts,RootSupportRope:false};
  }
  if(['o0.exposure-kept','o0.wedge'].includes(profile.id))profile.partVisibility={...profile.partVisibility,ReleasedWedge:true,WedgeFreshEnd:true};
  if(['o0.table-conversation','o0.table-want','o0.table-affection','o0.table-refusal','o0.wedge','o0.report','o0.public-confession','o0.invitations','o0.finding-private','o0.claim'].includes(profile.id))profile.spawn={x:-.9,z:-2.3};
  if(['o0.direct-braid','o0.braid-revisit'].includes(profile.id))profile.spawn={x:-2.3,z:-3.8};
  if(profile.id==='o0.fetch-rope'){
    profile.spawn={x:4.6,z:3.7};profile.actors=profile.actors.map(actor=>actor.model==='Dora'?{model:'DoraStanding',x:5,z:2.8,yaw:-Math.PI/2}:actor);
  }
  if(['o0.table-conversation','o0.table-want','o0.table-affection','o0.table-refusal'].includes(profile.id))profile.actors=profile.actors.map(actor=>actor.model==='BlueRoomPainting'?{model:actor.model,x:-.9,y:.78,z:-.48}:actor);
  if(profile.id==='o0.private-confession'){
    profile.spawn={x:.9,z:-4.4};profile.actors=profile.actors.map(actor=>actor.model==='NoorWindow'?{model:'NoorLower',x:-1.7,z:-2.3,yaw:.5}:actor);
  }
  if(transferIds.includes(profile.id)){
    profile.spawn={x:5.5,z:-4.5};profile.partVisibility={...profile.partVisibility,TransferFold:true};
    profile.actors=profile.actors.map(actor=>actor.model==='NoorWindow'?{model:actor.model,x:4.7,z:-4.6,yaw:Math.PI}:actor.model==='BlueRoomPainting'?{model:actor.model,x:-.7,y:.65,z:2.7}:actor);
  }
  if(profile.id==='o0.god-argument')profile.actors=profile.actors.map(actor=>actor.model==='Dora'?{model:'DoraKneeling',x:5.2,z:-3.7,yaw:Math.PI}:actor);
  if(profile.id==='o0.invitations')profile.actors=profile.actors.map(actor=>actor.model==='NoorWindow'?{model:'NoorLower',x:-2.4,z:-2.3,yaw:.6}:actor);
  if(profile.id==='o0.orchard-departure'){profile.spawn={x:4,z:-4.6};profile.actors=profile.actors.map(actor=>actor.model==='Dora'?{model:'DoraStanding',x:2.6,z:-4.3,yaw:Math.PI}:actor.model==='BlueRoomPainting'?{model:actor.model,x:2.6,y:1.3,z:-4}:actor);}
  if(profile.id==='o0.dry-departure'){
    profile.spawn={x:2.8,z:4.5};profile.actors=[{model:'DoraStanding',x:2.1,z:3.1,yaw:0},{model:'BlueRoomPainting',x:2.1,y:1.1,z:3.35},{model:'DoraPlaceCast',x:2.1,y:-1.05,z:-3.6}];
  }
}
const entries: [string,SceneProfile][] = profiles.flatMap(profile=>[[profile.id,profile],[`${profile.id}:${profile.id}.base`,profile]]);
const hub=profiles.find(profile=>profile.id==='o0.room-hub')!;
entries.push(['o0.room-hub:o0.hub-after-inspection',{...hub,partVisibility:{...transformedParts,ReleasedWedge:true,WedgeFreshEnd:true}}]);
const argument=profiles.find(profile=>profile.id==='o0.god-argument')!;
entries.push(['o0.god-argument:o0.argument-handover',{...argument,spawn:{x:3.8,z:-4.45}}]);
export const sceneProfiles:Readonly<Record<string,SceneProfile>>=Object.fromEntries(entries);
export function profileFor(sceneId:string,variantId?:string,encounteredSourceIds:readonly string[]=[]):SceneProfile|undefined{
  const profile=sceneProfiles[variantId?`${sceneId}:${variantId}`:sceneId];
  // This bounded first-occasion join consumes only the actually encountered removal record.
  // Future recurrence must distinguish historical sources from the presently captured scope.
  if(profile&&['o0.niche','o0.return-test','o0.return-declined'].includes(sceneId)&&encounteredSourceIds.includes('o0.cast-removed')){
    return {...profile,actors:profile.actors.map(actor=>actor.model==='DoraPlaceCast'?{model:actor.model,x:2.1,y:-1.05,z:-3.6}:actor)};
  }
  return profile;
}
export function targetsFor(profile:SceneProfile,choices:readonly WorldChoice[]):WorldTarget[]{
  return choices.flatMap(choice=>{const point=profile.actions[choice.id];return point?[{...point,choiceId:choice.id,label:choice.label}]:[];});
}
export function nearestTarget(profile:SceneProfile,choices:readonly WorldChoice[],point:Point,radius=1.8):WorldTarget|null{
  return targetsFor(profile,choices).map(target=>({target,distance:Math.hypot(target.x-point.x,target.z-point.z)})).filter(item=>item.distance<radius).sort((a,b)=>a.distance-b.distance)[0]?.target??null;
}
