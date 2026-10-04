import { newProofReference } from './occasion-author';
import type { ConditionV2,ProofV2,ContentV2,OccasionScopeV2 } from '../engine/evidence-v2';

const ids=(items:{id:string}[])=>items.map(item=>item.id);
function IdSelect({label,value,options,onChange}:{label:string;value:string;options:string[];onChange:(value:string)=>void}){return <label>{label}<select aria-label={label} value={value} onChange={event=>onChange(event.target.value)}>{!options.includes(value)&&<option value={value}>{value||'Select a reference'}</option>}{options.map(id=><option key={id} value={id}>{id}</option>)}</select></label>;}
export function ConditionEditor({value,onChange,content,depth=0,occasionId}:{value:ConditionV2;onChange:(value:ConditionV2)=>void;content:ContentV2;depth?:number;occasionId?:string}){
  const currentOccasion=occasionId??content.occasions?.[0]?.id;
  const firstSource=content.sources.find(item=>!content.occasions||item.occasionId===currentOccasion)?.id??'unassigned-source',firstQuestion=content.questions.find(item=>!content.occasions||item.occasionId===currentOccasion)?.id??'unassigned-question';
  const refs=[...ids(content.sources),...ids(content.questions)];
  function replace(op:ConditionV2['op']){
    if(op==='always')onChange({op});
    else if(op==='all'||op==='any')onChange({op,args:'args' in value?value.args:[value]});
    else if(op==='not')onChange({op,arg:value});
    else if(op==='npcKnows')onChange({op,characterId:content.characters[0]?.id??'unassigned-character',refId:refs[0]??'unassigned-reference'});
    else if(op==='npcBelieves')onChange({op,characterId:content.characters[0]?.id??'unassigned-character',beliefId:content.beliefIds[0]??'unassigned-belief'});
    else if(op==='occasionIs')onChange({op,id:value.op==='occasionIs'?value.id:currentOccasion??'unassigned-occasion'});
    else onChange({op,...(['hasSource','hasDeduction','flag'].includes(op)?('scope' in value&&value.scope?{scope:value.scope}:content.occasions?{scope:'current' as const}:{}):{}),id:op==='hasSource'?firstSource:op==='hasDeduction'?firstQuestion:op==='interpretationAvailable'?content.interpretationRules[0]?.id??'unassigned-reading':currentOccasion?`${currentOccasion}.new-flag`:'new-flag'});
  }
  return <fieldset className="logic-editor"><legend>Condition</legend><label>Operator<select aria-label="Operator" value={value.op} onChange={event=>replace(event.target.value as ConditionV2['op'])}>{['always','all','any','not','hasSource','hasDeduction','flag','npcKnows','npcBelieves','interpretationAvailable',...(content.occasions||value.op==='occasionIs'?['occasionIs']:[])].map(op=><option key={op} value={op} disabled={depth>=7&&['all','any','not'].includes(op)}>{op}</option>)}</select></label>
    {'id'in value&&(value.op==='flag'?<label>Flag ID<input value={value.id} onChange={event=>onChange({...value,id:event.target.value})}/></label>:<IdSelect label="Required reference" value={value.id} options={value.op==='hasSource'?ids(content.sources):value.op==='hasDeduction'?ids(content.questions):value.op==='occasionIs'?ids(content.occasions??[]):ids(content.interpretationRules)} onChange={id=>onChange({...value,id})}/>)}
    {(value.op==='flag'||value.op==='hasSource'||value.op==='hasDeduction')&&(content.occasions||value.scope)&&<ScopeSelect value={value.scope} optedIn={!!content.occasions} onChange={scope=>{const next={...value};if(scope)next.scope=scope;else delete next.scope;onChange(next);}}/>}
    {'characterId'in value&&<IdSelect label="Character" value={value.characterId} options={ids(content.characters)} onChange={characterId=>onChange({...value,characterId})}/>}
    {value.op==='npcKnows'&&<IdSelect label="Known reference" value={value.refId} options={refs} onChange={refId=>onChange({...value,refId})}/>}
    {value.op==='npcBelieves'&&<IdSelect label="Belief" value={value.beliefId} options={content.beliefIds} onChange={beliefId=>onChange({...value,beliefId})}/>}
    {value.op==='not'&&depth<8&&<ConditionEditor value={value.arg} depth={depth+1} content={content} occasionId={occasionId} onChange={arg=>onChange({...value,arg})}/>}
    {(value.op==='all'||value.op==='any')&&depth<8&&<>{value.args.map((arg,index)=><div key={index}><ConditionEditor value={arg} depth={depth+1} content={content} occasionId={occasionId} onChange={next=>onChange({...value,args:value.args.map((item,i)=>i===index?next:item)})}/><button className="quiet" disabled={value.args.length===1} onClick={()=>onChange({...value,args:value.args.filter((_,i)=>i!==index)})}>Remove condition {index+1}</button></div>)}<button className="quiet" disabled={value.args.length>=64} onClick={()=>onChange({...value,args:[...value.args,{op:'always'}]})}>Add condition</button></>}
    {depth>=8&&<p>Further nesting is shown in diagnostics. Reduce this condition before preview.</p>}
  </fieldset>;
}
export function ProofEditor({value,onChange,refs,depth=0,optedIn=false}:{value:ProofV2;onChange:(value:ProofV2)=>void;refs:string[];depth?:number;optedIn?:boolean}){
  return <fieldset className="logic-editor"><legend>Factual support</legend><label>Proof operator<select aria-label="Proof operator" value={value.op} onChange={event=>onChange(event.target.value==='ref'?(value.op==='ref'?value:newProofReference(refs[0]??'unassigned-source',optedIn)):{op:event.target.value as 'all'|'any',args:value.op==='ref'?[value]:value.args,...(event.target.value==='all'&&value.op==='all'&&value.independent?{independent:true}:{})})}><option value="ref">One reference</option><option value="all" disabled={depth>=7}>All of these</option><option value="any" disabled={depth>=7}>Any complete route</option></select></label>
    {value.op==='ref'?<><IdSelect label="Evidence or deduction" value={value.refId} options={refs} onChange={refId=>onChange({...value,refId})}/>{(optedIn||value.scope)&&<ScopeSelect value={value.scope} optedIn={optedIn} onChange={scope=>{const next={...value};if(scope)next.scope=scope;else delete next.scope;onChange(next);}}/>}</>:<>
      {value.op==='all'&&<label className="checkbox"><input type="checkbox" checked={value.independent??false} onChange={event=>onChange({...value,independent:event.target.checked})}/> Require independent source origins</label>}
      {depth<8&&value.args.map((child,index)=><div key={index}><ProofEditor value={child} refs={refs} optedIn={optedIn} depth={depth+1} onChange={next=>onChange({...value,args:value.args.map((item,i)=>i===index?next:item)})}/><button className="quiet" disabled={value.args.length===1} onClick={()=>onChange({...value,args:value.args.filter((_,i)=>i!==index)})}>Remove support {index+1}</button></div>)}
      <button className="quiet" disabled={depth>=7||value.args.length>=64} onClick={()=>onChange({...value,args:[...value.args,newProofReference(refs[0]??'unassigned-source',optedIn)]})}>Add alternative or required support</button>
    </>}
  </fieldset>;
}

function ScopeSelect({value,optedIn,onChange}:{value?:OccasionScopeV2;optedIn:boolean;onChange:(value:OccasionScopeV2|undefined)=>void}) {
  return <label>Evidence scope<select aria-label="Evidence scope" value={value??''} onChange={event=>onChange((event.target.value||undefined) as OccasionScopeV2|undefined)}>{(!optedIn||!value)&&<option value="" disabled={optedIn}>{optedIn?'Missing explicit scope':'Legacy (unscoped)'}</option>}{(['current','historical','encountered'] as const).map(scope=><option key={scope} value={scope}>{scope}</option>)}</select></label>;
}
export function OccasionEditor({value,content,onChange,label='Occasion'}:{value?:string;content:ContentV2;onChange:(value:string|undefined)=>void;label?:string}) {
  if(!content.occasions&&!value)return null;
  return <label>{label}<select aria-label={label} value={value??''} onChange={event=>onChange(event.target.value||undefined)}><option value="">Unassigned</option>{value&&!content.occasions?.some(item=>item.id===value)&&<option value={value}>{value} (undeclared)</option>}{content.occasions?.map(item=><option key={item.id} value={item.id}>{item.label} ({item.id})</option>)}</select></label>;
}
