import type {Point} from './navigation';
export interface WorldChoice {id:string;label:string}
export interface WorldTarget extends Point {choiceId:string;label:string;shortLabel:string}
const places={entrance:{x:0,z:10.5},bench:{x:5.6,z:3},workshop:{x:-6.3,z:-6.3},cabinet:{x:-6.5,z:-1.6},gallery:{x:5.8,z:-6.6},gathering:{x:1.8,z:8}};
const travel:Record<string,[keyof typeof places,string]>={
 'arrival-miriam':['bench','Miriam'],'arrival-ada':['workshop','Ada'],'arrival-cabinet':['cabinet','Cabinet'],
 'hub-bench':['bench','Miriam'],'hub-workshop':['workshop','Ada'],'hub-cabinet':['cabinet','Cabinet'],'hub-gallery':['gallery','Simon'],
 'hub-recording':['gallery','Recording'],'hub-test':['cabinet','Empty cabinet'],'hub-miriam':['bench','Miriam'],'hub-ada-private':['workshop','Ada and Miriam'],
 'hub-simon-private':['gallery','Folded chairs'],'hub-miriam-private':['bench','Miriam'],'hub-shared':['gathering','Gather everyone'],
 'workshop-to-test':['cabinet','Empty cabinet'],'cabinet-test':['cabinet','Empty cabinet'],'gallery-recording':['gallery','Recording'],
};
export const sceneKey=(id:string)=>id.replace(/^o[0-9]+\./,'');
export function targetsFor(choices:WorldChoice[],sceneId?:string):WorldTarget[]{return choices.flatMap(choice=>{const id=sceneKey(choice.id),target=travel[id];const point=sceneKey(sceneId??'')==='arrival'&&id==='arrival-ada'?{x:-2.5,z:8.5}:target?places[target[0]]:undefined;return target&&point?[{...point,choiceId:choice.id,label:choice.label,shortLabel:target[1]}]:[];});}
export function placeForScene(id:string):Point{
 const scene=sceneKey(id);
 if(['bench','miriam_account','miriam_private'].includes(scene))return places.bench;
 if(['workshop','ada_miriam'].includes(scene))return places.workshop;
 if(['cabinet','release','optics'].includes(scene))return places.cabinet;
 if(['gallery','recording','simon_account','simon_ada'].includes(scene))return places.gallery;
 if(['shared','report','public_account','private_account','continuation','supper'].includes(scene))return places.gathering;
 return places.entrance;
}
