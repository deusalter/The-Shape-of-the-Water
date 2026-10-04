import type { ConditionV2,ProofV2,ContentV2 } from '../engine/evidence-v2';

const ids=(items:{id:string}[])=>items.map(item=>item.id);
function IdSelect({label,value,options,onChange}:{label:string;value:string;options:string[];onChange:(value:string)=>void}){return <label>{label}<select value={value} onChange={event=>onChange(event.target.value)}>{!options.includes(value)&&<option value={value}>{value||'Select a reference'}</option>}{options.map(id=><option key={id} value={id}>{id}</option>)}</select></label>;}
export function ConditionEditor({value,onChange,content,depth=0}:{value:ConditionV2;onChange:(value:ConditionV2)=>void;content:ContentV2;depth?:number}){
  const refs=[...ids(content.sources),...ids(content.questions)];
  function replace(op:ConditionV2['op']){
    if(op==='always')onChange({op});
    else if(op==='all'||op==='any')onChange({op,args:'args' in value?value.args:[value]});
    else if(op==='not')onChange({op,arg:value});
    else if(op==='npcKnows')onChange({op,characterId:content.characters[0]?.id??'unassigned-character',refId:refs[0]??'unassigned-reference'});
    else if(op==='npcBelieves')onChange({op,characterId:content.characters[0]?.id??'unassigned-character',beliefId:content.beliefIds[0]??'unassigned-belief'});
    else onChange({op,id:op==='hasSource'?content.sources[0]?.id??'unassigned-source':op==='hasDeduction'?content.questions[0]?.id??'unassigned-question':op==='interpretationAvailable'?content.interpretationRules[0]?.id??'unassigned-reading':'new-flag'});
  }
  return <fieldset className="logic-editor"><legend>Condition</legend><label>Operator<select value={value.op} onChange={event=>replace(event.target.value as ConditionV2['op'])}>{['always','all','any','not','hasSource','hasDeduction','flag','npcKnows','npcBelieves','interpretationAvailable'].map(op=><option key={op} value={op} disabled={depth>=7&&['all','any','not'].includes(op)}>{op}</option>)}</select></label>
    {'id'in value&&(value.op==='flag'?<label>Flag ID<input value={value.id} onChange={event=>onChange({...value,id:event.target.value})}/></label>:<IdSelect label="Required reference" value={value.id} options={value.op==='hasSource'?ids(content.sources):value.op==='hasDeduction'?ids(content.questions):ids(content.interpretationRules)} onChange={id=>onChange({...value,id})}/>)}
    {'characterId'in value&&<IdSelect label="Character" value={value.characterId} options={ids(content.characters)} onChange={characterId=>onChange({...value,characterId})}/>}
    {value.op==='npcKnows'&&<IdSelect label="Known reference" value={value.refId} options={refs} onChange={refId=>onChange({...value,refId})}/>}
    {value.op==='npcBelieves'&&<IdSelect label="Belief" value={value.beliefId} options={content.beliefIds} onChange={beliefId=>onChange({...value,beliefId})}/>}
    {value.op==='not'&&depth<8&&<ConditionEditor value={value.arg} depth={depth+1} content={content} onChange={arg=>onChange({...value,arg})}/>}
    {(value.op==='all'||value.op==='any')&&depth<8&&<>{value.args.map((arg,index)=><div key={index}><ConditionEditor value={arg} depth={depth+1} content={content} onChange={next=>onChange({...value,args:value.args.map((item,i)=>i===index?next:item)})}/><button className="quiet" disabled={value.args.length===1} onClick={()=>onChange({...value,args:value.args.filter((_,i)=>i!==index)})}>Remove condition {index+1}</button></div>)}<button className="quiet" disabled={value.args.length>=64} onClick={()=>onChange({...value,args:[...value.args,{op:'always'}]})}>Add condition</button></>}
    {depth>=8&&<p>Further nesting is shown in diagnostics. Reduce this condition before preview.</p>}
  </fieldset>;
}
export function ProofEditor({value,onChange,refs,depth=0}:{value:ProofV2;onChange:(value:ProofV2)=>void;refs:string[];depth?:number}){
  return <fieldset className="logic-editor"><legend>Factual support</legend><label>Proof operator<select value={value.op} onChange={event=>onChange(event.target.value==='ref'?{op:'ref',refId:refs[0]??'unassigned-source'}:{op:event.target.value as 'all'|'any',args:value.op==='ref'?[value]:value.args,...(event.target.value==='all'&&value.op==='all'&&value.independent?{independent:true}:{})})}><option value="ref">One reference</option><option value="all" disabled={depth>=7}>All of these</option><option value="any" disabled={depth>=7}>Any complete route</option></select></label>
    {value.op==='ref'?<IdSelect label="Evidence or deduction" value={value.refId} options={refs} onChange={refId=>onChange({...value,refId})}/>:<>
      {value.op==='all'&&<label className="checkbox"><input type="checkbox" checked={value.independent??false} onChange={event=>onChange({...value,independent:event.target.checked})}/> Require independent source origins</label>}
      {depth<8&&value.args.map((child,index)=><div key={index}><ProofEditor value={child} refs={refs} depth={depth+1} onChange={next=>onChange({...value,args:value.args.map((item,i)=>i===index?next:item)})}/><button className="quiet" disabled={value.args.length===1} onClick={()=>onChange({...value,args:value.args.filter((_,i)=>i!==index)})}>Remove support {index+1}</button></div>)}
      <button className="quiet" disabled={depth>=7||value.args.length>=64} onClick={()=>onChange({...value,args:[...value.args,{op:'ref',refId:refs[0]??'unassigned-source'}]})}>Add alternative or required support</button>
    </>}
  </fieldset>;
}
