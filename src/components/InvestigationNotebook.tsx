import { useState } from 'react';
import { projectPlayerV2, type ContentV2, type GameStateV2 } from '../engine/evidence-v2';
import { OccasionLabel } from './OccasionLabel';
import './investigation-notebook.css';

export type InvestigationAction =
  | {type:'submitDeduction';questionId:string;candidateId:string;selectedRefs:string[]}
  | {type:'requestHint';hintId:string}
  | {type:'reviewInterpretation';interpretationId:string};

/** Render only the player's projection. Proof trees and NPC internals never enter the DOM. */
export function InvestigationNotebook({content,state,disabled,onAction}:{content:ContentV2;state:GameStateV2;disabled:boolean;onAction:(action:InvestigationAction)=>void}){
  const view=projectPlayerV2(content,state);
  const [selections,setSelections]=useState<Record<string,string[]>>({});
  const [candidates,setCandidates]=useState<Record<string,string>>({});
  const [search,setSearch]=useState('');
  const query=search.trim().toLocaleLowerCase();
  const matchingSources=view.sources.filter(source=>`${source.title}\n${source.text}`.toLocaleLowerCase().includes(query));
  const references=[...view.sources.map(source=>({id:source.id,label:source.title+(source.occasionLabel?` (${source.occasionLabel})`:''),text:source.text,kind:source.kind})),...view.deductions.map(deduction=>({id:deduction.id,label:deduction.text+(deduction.occasionLabel?` (${deduction.occasionLabel})`:''),text:'A conclusion you supported with selected evidence.',kind:'deduction'}))];
  return <div className="investigation-notebook">
    <section aria-labelledby="evidence-title"><h3 id="evidence-title">Encountered evidence</h3>
      <label className="evidence-search">Search encountered evidence<input type="search" value={search} onChange={event=>setSearch(event.target.value)}/></label>
      {view.sources.length ? <><p className="search-count" role="status">{matchingSources.length} of {view.sources.length} records</p>{matchingSources.length ? <ul>{matchingSources.map(source=><li key={source.id}><strong>{source.title}</strong><OccasionLabel record={source}/><span className="source-kind">{source.kind==='statement'?'Statement':source.kind==='document'?'Document':'Observation'}</span><p>{source.text}</p></li>)}</ul> : <p>No encountered evidence matches this search.</p>}</> : <p>No evidence has been recorded yet.</p>}
    </section>
    <section aria-labelledby="questions-title"><h3 id="questions-title" tabIndex={-1}>Questions to investigate</h3><p>Choose a factual claim and the specific evidence that supports it. Statements are records of what someone said.</p>
      {view.questions.length?view.questions.map(question=>{
        const selected=(selections[question.id]??[]).filter(id=>references.some(ref=>ref.id===id));
        const candidate=candidates[question.id]??'';
        return <form key={question.id} onSubmit={event=>{event.preventDefault();onAction({type:'submitDeduction',questionId:question.id,candidateId:candidate,selectedRefs:selected});}}>
          <fieldset disabled={disabled}><legend>{question.text}</legend>
            <div className="claim-options">{question.candidates.map(option=><label key={option.id}><input type="radio" name={`claim-${question.id}`} checked={candidate===option.id} onChange={()=>setCandidates(previous=>({...previous,[question.id]:option.id}))}/><span>{option.text}</span></label>)}</div>
            <details className="evidence-selection"><summary>Select supporting evidence ({selected.length})</summary>{references.map(reference=><label key={reference.id}><input type="checkbox" checked={selected.includes(reference.id)} onChange={event=>setSelections(previous=>({...previous,[question.id]:event.target.checked?[...selected,reference.id]:selected.filter(id=>id!==reference.id)}))}/><span>{reference.label}</span></label>)}{!references.length&&<p>No evidence is available to select.</p>}</details>
            <button disabled={!question.candidates.some(option=>option.id===candidate)||selected.length===0}>Submit this claim and evidence</button>
          </fieldset>
        </form>;
      }):<p>No unresolved factual questions are available here.</p>}
    </section>
    <section aria-labelledby="conclusions-title"><h3 id="conclusions-title">Supported conclusions</h3>{view.deductions.length?<ul>{view.deductions.map(deduction=><li key={deduction.id}><OccasionLabel record={deduction}/><p>{deduction.text}</p><details><summary>Evidence submitted</summary><ul>{deduction.selectedRefs.map(id=><li key={id}>{references.find(reference=>reference.id===id)?.label??'Previously recorded support'}</li>)}</ul></details></li>)}</ul>:<p>No conclusions have been submitted.</p>}</section>
    <section aria-labelledby="readings-title"><h3 id="readings-title">Possible readings</h3><p>These offer ways to think about what you have encountered. They do not establish another fact.</p>{view.readingsAvailable.map(reading=><button className="quiet" disabled={disabled} key={reading.id} onClick={()=>onAction({type:'reviewInterpretation',interpretationId:reading.id})}>{reading.title}<OccasionLabel record={reading}/></button>)}{view.interpretations.map(reading=><p key={reading.id}><OccasionLabel record={{occasionLabel:reading.originOccasionLabel??reading.occasionLabel}}/>{reading.text}</p>)}</section>
    <section aria-labelledby="hints-title"><h3 id="hints-title">Investigation help</h3>{view.hintsAvailable.length?view.hintsAvailable.map(hint=><button className="quiet" disabled={disabled} key={hint.id} onClick={()=>onAction({type:'requestHint',hintId:hint.id})}>{hint.label}{hint.reveals?' (reveals evidence)':''}</button>):<p>No hints are available here.</p>}{view.hints.map(hint=><p key={hint.id}><OccasionLabel record={hint}/>{hint.text}</p>)}</section>
    <section aria-labelledby="relationships-title"><h3 id="relationships-title">Interpersonal decisions</h3>{view.relationships.length?<ul>{view.relationships.map(record=><li key={record.id}><OccasionLabel record={record}/>{record.text}</li>)}</ul>:<p>Nothing recorded yet.</p>}</section>
  </div>;
}
