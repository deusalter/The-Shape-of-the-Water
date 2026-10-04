import {createRoot} from 'react-dom/client';
import {useState} from 'react';
import {MercyWorld} from '../../src/world/mercy/MercyWorld';
import {sceneProfiles,targetsFor} from '../../src/world/mercy/profiles';
declare global {interface Window {mercyFixture:{setScene:(scene:string,variant?:string)=>void;setDisabled:(value:boolean)=>void;setChoices:(ids:string[])=>void;dispatches:string[];profiles:unknown[]}}}
const first=Object.keys(sceneProfiles).find(key=>!key.includes(':'))??'';
function Fixture(){const [scene,setScene]=useState(first),[variant,setVariant]=useState<string|undefined>(),[disabled,setDisabled]=useState(false),[override,setOverride]=useState<string[]|undefined>();
 const profile=sceneProfiles[variant?`${scene}:${variant}`:scene];const ids=override??profile?.choiceIds??[];
 window.mercyFixture={setScene:(id,v)=>{setScene(id);setVariant(v);setOverride(undefined);},setDisabled,setChoices:setOverride,dispatches:window.mercyFixture?.dispatches??[],profiles:Object.values(sceneProfiles).map(p=>({scene:p.id,variant:p.variantId,location:p.location,spawn:p.spawn,targets:targetsFor(p,p.choiceIds.map(id=>({id,label:id}))),actors:p.actors,props:p.props}))};
 return <MercyWorld sceneId={scene} variantId={variant} choices={ids.map(id=>({id,label:`Take ${id}`}))} disabled={disabled} onChoose={id=>window.mercyFixture.dispatches.push(id)}/>;
}
createRoot(document.getElementById('root')!).render(<Fixture/>);
