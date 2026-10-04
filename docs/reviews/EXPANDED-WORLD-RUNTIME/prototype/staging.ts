import spatial from './bath-spatial.json';
import authored from './scene-staging.json';
import { position, type Position, type Point } from './navigation';
export interface WorldChoice { id: string; label: string }
export interface WorldTarget extends Position { choiceId: string; label: string; shortLabel: string }
interface ActorRequirement { id: string; area: string; pose: string }
interface SceneRequirement { area: string; actors: ActorRequirement[] }
export interface ActorPose extends Position { root: string; seated: boolean; yaw: number }
export interface PropPose extends Position { root: string; yaw: number }
export interface Stage { area: string; player: Position; actors: ActorPose[]; props: PropPose[]; privacy: boolean }
const requirements: Record<string, SceneRequirement> = authored.scenes;
const anchors: Record<string, Point> = spatial.anchors as Record<string, Point>;
const areas: Record<string, string> = { entrance:'frontInterior', 'street-front':'frontExterior', 'street-opposite':'laundryWaiting', concourse:'gathering', 'spectators-bench':'bench', 'shallow-water':'waterChairs', workshop:'workshop', 'workshop-doorway':'workshopDoorway', gallery:'gallery', cabinet:'cabinet', 'service-passage':'serviceInterior', 'service-yard':'yard', 'changing-passage':'changingPassage' };
export const sceneKey = (id: string) => id.replace(/^o[0-9]+\./, '');
function areaPoint(area: string): Position {
  // The changing passage is a viewing/retreat position on the dry east side.
  return position(anchors[areas[area]] ?? (area === 'changing-passage' ? { x:9.25,z:8.8 } : anchors.arrival));
}
function actorPoint(actor: ActorRequirement): Position {
  const name = actor.id.split('.').at(-1)!, exterior = name === 'miriam_exterior';
  const table: Record<string, Record<string, [number,number]>> = {
    workshop: { ada:[-8.5,-10.1], simon:[-6.2,-12.95], miriam:[-7.35,-9.45], miriam_exterior:[-7.75,-13.0], emmy:[-6.2,-9.15] },
    'workshop-doorway': { simon:[-7.5,-7.45], miriam:[-5.4,-7.35], ada:[-6.1,-6.5] },
    gallery: { simon:[6.3,-11], ada:[5.3,-12], miriam:[6.25,-12.6] },
    cabinet: { ada:[-5.05,-2.85], simon:[-5.05,-4.2], miriam:[-6.95,-.85], emmy:[-7.85,-2], ruth:[-7.8,-5.2] },
    entrance: { ada:[-1.45,11.5], simon:[1.6,11.6], miriam:[-.6,12.5], miriam_exterior:[.95,12.5], emmy:[2.6,12.5] },
    concourse: { ada:[-1.2,8], simon:[.2,7.5], miriam:[2.8,7.5] },
    'spectators-bench': { ada:[5.5,2], simon:[5.35,4.5], miriam:[7.4,3], miriam_exterior:[6.4,5.9] },
    'shallow-water': { ada:[5.15,7.9], simon:[7.4,7.2], miriam:[5.2,5.9], ruth:[5.05,4.8] },
    'service-passage': { ada:[-8.9,-7.1], simon:[-7.3,-6.1], miriam:[-7.8,-5.1], miriam_exterior:[-9.15,-5.1] },
    'street-front': { ada:[1.5,15.4], simon:[2.7,15.65], miriam:[-.5,15.45], miriam_exterior:[-2.6,15.2] },
  };
  const base = areaPoint(actor.area), offset = table[actor.area]?.[name];
  const point = offset ? position({ x:offset[0],z:offset[1] },base.layer) : base;
  // Both women always derive from the same base model. This selects position only.
  if (exterior && actor.area === 'street-opposite') return position(anchors.laundryWaiting);
  return point;
}
function prop(root: string, override?: Point): PropPose {
  const data = (spatial.stagedProps as Record<string,{anchor?:string;x?:number;y?:number;z?:number;yaw?:number}>)[root];
  const base = override ?? (data.anchor ? anchors[data.anchor] : { x:data.x??0,y:data.y??0,z:data.z??0 });
  return { ...position(base), y:base.y??0, root, yaw:data.yaw??0 };
}
export function stageForScene(id: string): Stage {
  const fullId = id.includes('.') ? id : `o0.${id}`, key = sceneKey(fullId), requirement = requirements[fullId] ?? { area:'entrance',actors:[] };
  const privacy = requirement.area === 'changing-passage' || fullId === 'o1.changed-date.alone' || fullId === 'o1.name-offered.leave';
  const actors: ActorPose[] = requirement.actors.filter(actor => !privacy || actor.area === requirement.area).map(actor => {
    const name = actor.id.split('.').at(-1)!;
    return { ...actorPoint(actor), root:name === 'miriam_exterior' ? 'MiriamEncountered' : name[0].toUpperCase()+name.slice(1), seated:actor.pose === 'seated',yaw:actor.area === 'spectators-bench' ? -Math.PI/2 : 0 };
  });
  let player = areaPoint(requirement.area);
  if (['arrival','return','return.blue','return.handle'].includes(key)) {
    player = position(anchors.arrival);
    const ada = actors.find(actor=>actor.root==='Ada'); if(ada) Object.assign(ada,position({x:-2.5,z:8.5}),{seated:true,yaw:.4});
  }
  // Ordinary exploration retains known first-night figures at their established stations.
  if (['concourse','finding_notebook'].includes(key)) {
    actors.push({ ...position(anchors.adaWorkshop),root:'Ada',seated:false,yaw:0 },{ ...position(anchors.simonGallery),root:'Simon',seated:false,yaw:0 },{ ...position(anchors.miriamBench),root:'Miriam',seated:true,yaw:-Math.PI/2 });
  }
  if (key==='lesson') {
    const miriam=actors.find(actor=>actor.root==='Miriam'); if(miriam) Object.assign(miriam,{x:3.55,z:4.8,y:-.8});
    const ruth=actors.find(actor=>actor.root==='Ruth'); if(ruth) Object.assign(ruth,{x:3.6,z:3.1,y:-.8});
  }
  const props:PropPose[]=[];
  if(key==='release') props.push(prop('PropPaddedTestChair'),prop('PropBindingTest'));
  if(key.startsWith('emmy-arrival'))props.push(prop('PropFootballBoot'));
  if(['bench','miriam_account','miriam_private'].includes(key))props.push(prop('PropBenchShoe'));
  if(key.startsWith('knock'))props.push(prop('PropSoundChair'));
  if(key.startsWith('two-cups')||key.startsWith('changed-date')||key.startsWith('two-at-bench')||key==='bench-thanks'||key==='middle-close')props.push(prop('PropSoundChair',{x:6.4,z:5.9}),prop('PropWaterCup'));
  if(key==='two-breaths')props.push(prop('PropLooseChair',{x:5.15,z:7.9}));
  if(requirement.area==='shallow-water'&&id.startsWith('o1.'))props.push(prop('PropLooseChair',{x:5.2,z:5.9}));
  if(['bearers','parcel'].includes(key))props.push(prop('PropExteriorBearer'),prop('PropInteriorBearer'));
  if(key==='parcel')props.push(prop('PropWrappedGlass'));
  if(key.startsWith('wood-'))props.push(prop('PropExteriorBearer',{x:-7.1,y:.96,z:-11.7}),prop('PropInteriorBearer',{x:-7.7,y:.96,z:-11.7}));
  return { area:requirement.area,player,actors,props,privacy };
}
export function placeForScene(id: string): Position { return stageForScene(id).player; }
const travel:Record<string,[string,string]> = {
 'arrival-miriam':['spectators-bench','Miriam'],'arrival-ada':['workshop','Ada'],'arrival-cabinet':['cabinet','Cabinet'],
 'hub-bench':['spectators-bench','Miriam'],'hub-workshop':['workshop','Ada'],'hub-cabinet':['cabinet','Cabinet'],'hub-gallery':['gallery','Simon'],
 'hub-recording':['gallery','Recording'],'hub-test':['cabinet','Empty cabinet'],'hub-miriam':['spectators-bench','Miriam'],'hub-ada-private':['workshop','Ada and Miriam'],
 'hub-simon-private':['gallery','Folded chairs'],'hub-miriam-private':['spectators-bench','Miriam'],'hub-shared':['concourse','Gather everyone'],
 'workshop-to-test':['cabinet','Empty cabinet'],'cabinet-test':['cabinet','Empty cabinet'],'gallery-recording':['gallery','Recording'],
};
/** Only enumerated, currently offered travel actions become world targets. Never infer a crossing from prose. */
export function targetsFor(choices: WorldChoice[], sceneId?: string): WorldTarget[] {
  return choices.flatMap(choice=>{
    const id=sceneKey(choice.id),target=travel[id];if(!target)return[];
    const point=sceneKey(sceneId??'')==='arrival'&&id==='arrival-ada'?position(anchors.arrivalAdaApproach):areaPoint(target[0]);
    return [{...point,choiceId:choice.id,label:choice.label,shortLabel:target[1]}];
  });
}
