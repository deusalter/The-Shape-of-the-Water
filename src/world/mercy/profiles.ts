import manifest from './staging.json';
import type { NavigationArea, Point } from './navigation';
export type ActorName='Julian'|'Erasmus'|'Vera';
export type Location='square'|'theatre'|'patron'|'edge'|'market'|'outside-theatre'|'late-square'|'late-theatre';
export interface WorldChoice {id:string;label:string}
export interface MercyProfile {id:string;variantId?:string;location:Location;title:string;spawn:Point;navigation:NavigationArea;actors:readonly {name:ActorName;x:number;z:number;y?:number;scale?:number;yaw?:number}[];props:readonly string[];choiceIds:readonly string[];cameraYaw:number;}
export interface WorldTarget extends Point {choiceId:string;label:string;shortLabel:string;}
interface Entry {sceneId:string;location:string;actors:string[];props:string[];choiceIds?:string[];variantIds?:string[];distantActors?:string[];variants?:{variantId:string;location?:string;actors?:string[];props?:string[]}[];}
const aliases:Record<string,Location>={palace:'patron','west-road':'market','rain-stage':'outside-theatre',square:'square',theatre:'theatre',edge:'edge',patron:'patron',market:'market','outside-theatre':'outside-theatre','late-square':'late-square','late-theatre':'late-theatre'};
const titles:Record<Location,string>={square:'Aubade · the inner sky',theatre:'The dedication theatre',patron:'The patron’s table',edge:'The city’s curved edge',market:'The dry side of the rain','outside-theatre':'A theatre beyond Aubade','late-square':'The city, after the account','late-theatre':'A play with another ending'};
const normalizedActor=(id:string):ActorName|undefined=>/^(julian|j[01])(-|$)/.test(id.toLowerCase())?'Julian':/^(erasmus|e)(-|$)/.test(id.toLowerCase())?'Erasmus':/^(vera|v[01])(-|$)/.test(id.toLowerCase())?'Vera':undefined;
function makeProfile(entry:Entry,variantId?:string):MercyProfile{
 const override=entry.variants?.find(v=>v.variantId===variantId);
 entry={...entry,...override};
 const base=entry.props.includes('market-stalls')?'market':aliases[entry.location]??'square';const location=entry.sceneId.startsWith('a2.')&&base==='theatre'?'late-theatre':entry.sceneId.startsWith('a2.')&&base==='square'?'late-square':base;
 const navigation:NavigationArea={bounds:{minX:-7.7,maxX:7.7,minZ:-6.4,maxZ:7.3},obstacles:[]};
 if(['theatre','late-theatre','outside-theatre'].includes(location))navigation.obstacles=[{minX:3.4,maxX:6.8,minZ:-2.7,maxZ:-.9},...[-5,-3,-1,1,3,5].flatMap(x=>[2,3.55,5.1].map(z=>({minX:x-.61,maxX:x+.61,minZ:z-.53,maxZ:z+.65})))];
 else if(location==='patron'||location==='late-square')navigation.obstacles=[{minX:-2.7,maxX:2.7,minZ:-4.15,maxZ:-1.85},{minX:-4.1,maxX:-2.9,minZ:-3.6,maxZ:-2.4},{minX:2.9,maxX:4.1,minZ:-3.6,maxZ:-2.4}];
 else if(location==='market')navigation.obstacles=[{minX:-7.7,maxX:-3.85,minZ:-3.95,maxZ:-2.05},{minX:2.85,maxX:7.15,minZ:-3.95,maxZ:-2.05},{minX:-7.7,maxX:-5.15,minZ:.35,maxZ:5.6},{minX:5.15,maxX:7.7,minZ:.35,maxZ:5.6}];
 else if(location==='edge')navigation.obstacles=[{minX:-5.25,maxX:-2.75,minZ:-3.7,maxZ:-2.3},{minX:3.25,maxX:4.75,minZ:-4.2,maxZ:-2.8}];
 else navigation.obstacles=[{minX:-6.5,maxX:-3.5,minZ:-4.5,maxZ:-1.5}];
 const names=entry.actors.map(normalizedActor).filter((x):x is ActorName=>!!x);const distantNames=(entry.distantActors??[]).map(normalizedActor);const actors=[...new Set(names)].map((name,index)=>({name,y:distantNames.includes(name)?1.05:['theatre','late-theatre','outside-theatre'].includes(location)?.3:0,scale:distantNames.includes(name)?.8:1,x:distantNames.includes(name)?.7:location==='patron'?(-2.3+index*2.3):index===0?-.9:2.3+index*.9,z:distantNames.includes(name)?-6.7:location==='patron'?-5:-3.4,yaw:Math.PI*.1}));
 const propAliases:Record<string,string>={'paper-horse':'horse','account-pages':'account'};
 if(entry.props.some(prop=>['horse','paper-horse'].includes(prop)))navigation.obstacles=[...navigation.obstacles,{minX:-5.6,maxX:-2.1,minZ:-4,maxZ:-2.3}];
 if(entry.props.includes('cart'))navigation.obstacles=[...navigation.obstacles,{minX:-6.2,maxX:-3.8,minZ:-2.5,maxZ:2.1}];
 if(entry.props.includes('painted-door'))navigation.obstacles=[...navigation.obstacles,{minX:2.0,maxX:3.8,minZ:-5.2,maxZ:-4.1}];
 const props=entry.props.map(prop=>{const key=prop.toLowerCase().replaceAll('_','-');return propAliases[key]??key;});
 // Geometry is current scene staging only. Captured sources never resurrect people or objects.
 return {id:entry.sceneId,variantId,location,title:titles[location],spawn:{x:0,z:1},navigation,actors,props,choiceIds:entry.choiceIds??[],cameraYaw:.33};
}
const entries=manifest.scenes as Entry[];
export const sceneProfiles:Readonly<Record<string,MercyProfile>>=Object.fromEntries(entries.flatMap(entry=>[[entry.sceneId,makeProfile(entry)],...([...new Set([`${entry.sceneId}.base`,...(entry.variantIds??[])])].map(variant=>[`${entry.sceneId}:${variant}`,makeProfile(entry,variant)]))]));
export function profileFor(sceneId:string,variantId?:string,_encounteredSourceIds:readonly string[]=[]){return sceneProfiles[variantId?`${sceneId}:${variantId}`:sceneId];}
export function hasStaging(sceneId:string,variantId?:string){return !!profileFor(sceneId,variantId);}
export function targetsFor(profile:MercyProfile,choices:readonly WorldChoice[]):WorldTarget[]{
 const offered=choices.filter(c=>profile.choiceIds.includes(c.id));
 const centre=profile.location==='patron'||profile.location==='late-square'?{x:0,z:-1.15}:profile.location==='edge'?{x:1.5,z:-3.1}:{x:0,z:-2};
 return offered.map((choice,index)=>({...centre,x:centre.x+(index-(offered.length-1)/2)*1.45,choiceId:choice.id,label:choice.label,shortLabel:'Continue this encounter'}));
}
export function nearestTarget(profile:MercyProfile,choices:readonly WorldChoice[],point:Point,radius=1.65){return targetsFor(profile,choices).map(target=>({target,distance:Math.hypot(point.x-target.x,point.z-target.z)})).filter(x=>x.distance<radius).sort((a,b)=>a.distance-b.distance)[0]?.target??null;}
/** Reuse the already prepared current targets during movement and interaction. */
export function nearestPreparedTarget(targets:readonly WorldTarget[],point:Point,radius=1.65){
 if(radius<=0)return null;
 let nearest:WorldTarget|null=null,distanceSquared=radius*radius;
 for(const target of targets){const distance=(point.x-target.x)**2+(point.z-target.z)**2;if(distance<distanceSquared){nearest=target;distanceSquared=distance;}}
 return nearest;
}
