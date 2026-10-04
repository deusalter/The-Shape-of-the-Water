import { describe,expect,it } from 'vitest';
import { isValidElement,type ReactElement,type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { IDBFactory } from 'fake-indexeddb';
import { occasionFixture } from '../src/engine/evidence-occasion-fixture';
import { evidenceFixture } from '../src/engine/evidence-fixture';
import type { ConditionV2,ProofV2 } from '../src/engine/evidence-v2';
import { ConditionEditor,ProofEditor,OccasionEditor } from '../src/studio/LogicEditors';
import { authorIdPrefix,occasionDefaults,newProofReference } from '../src/studio/occasion-author';
import { newProject,checkedProject,exportProject,compileProject } from '../src/studio/project';
import { injectedPreview } from '../src/studio/preview-scenario';
import { AuthorProjectStore } from '../src/persistence/author-project';

// Exercise actual control handlers without a browser DOM. Browser controls are
// also checked separately against an isolated production build.
function nodes(node:ReactNode):ReactElement<Record<string,any>>[] {
  if(Array.isArray(node))return node.flatMap(nodes);
  if(!isValidElement<Record<string,any>>(node))return [];
  if(typeof node.type==='function')return nodes((node.type as Function)(node.props));
  return [node,...nodes(node.props.children)];
}
function changeLabel(tree:ReactNode,label:string,value:string) {
  const found=nodes(tree).find(node=>node.type==='label'&&nodes(node.props.children).some(item=>item.type==='select'||item.type==='input')&&Array.isArray(node.props.children)&&node.props.children[0]===label);
  if(!found)throw Error(`Missing label ${label}`);
  const control=nodes(found.props.children).find(node=>node.type==='select'||node.type==='input')!;
  control.props.onChange({target:{value}});
}
describe('occasion author controls preserve explicit membership and scopes',()=>{
  it('edits scoped source, deduction and flag guards without dropping scope, including nesting',()=>{
    for(const op of ['hasSource','hasDeduction','flag'] as const){
      let result:ConditionV2={op,id:op==='flag'?'o0.permission':'o0.film',scope:'historical'};
      const tree=ConditionEditor({value:result,content:occasionFixture,onChange:value=>{result=value;}});
      changeLabel(tree,op==='flag'?'Flag ID':'Required reference','o1.film');
      expect(result).toEqual({op,id:'o1.film',scope:'historical'});
      changeLabel(ConditionEditor({value:result,content:occasionFixture,onChange:value=>{result=value;}}),'Evidence scope','encountered');
      expect(result).toEqual({op,id:'o1.film',scope:'encountered'});
    }
    let nested:ConditionV2={op:'all',args:[{op:'hasSource',id:'o0.film',scope:'historical'}]};
    changeLabel(ConditionEditor({value:nested,content:occasionFixture,onChange:value=>{nested=value;}}),'Required reference','o0.ring');
    expect(nested).toEqual({op:'all',args:[{op:'hasSource',id:'o0.ring',scope:'historical'}]});
  });
  it('creates occasion guards and current guards using selected occasion defaults',()=>{
    let result:ConditionV2={op:'always'};
    const render=()=>ConditionEditor({value:result,content:occasionFixture,occasionId:'o1',onChange:value=>{result=value;}});
    changeLabel(render(),'Operator','occasionIs');
    changeLabel(render(),'Required reference','o2');expect(result).toEqual({op:'occasionIs',id:'o2'});
    changeLabel(render(),'Operator','hasSource');expect(result).toEqual({op:'hasSource',id:'o1.private-anchor',scope:'current'});
    changeLabel(render(),'Operator','flag');expect(result).toEqual({op:'flag',id:'o1.new-flag',scope:'current'});
  });
  it('retains historical proof leaves through nested grouping and explicitly scopes added leaves',()=>{
    let result:ProofV2={op:'ref',refId:'o0.film',scope:'historical'};
    const render=()=>ProofEditor({value:result,optedIn:true,refs:['o1.film','o0.film'],onChange:value=>{result=value;}});
    changeLabel(render(),'Proof operator','all');
    expect(result).toEqual({op:'all',args:[{op:'ref',refId:'o0.film',scope:'historical'}]});
    changeLabel(render(),'Evidence or deduction','o0.ring');
    expect(result).toEqual({op:'all',args:[{op:'ref',refId:'o0.ring',scope:'historical'}]});
    const button=nodes(render()).find(node=>node.type==='button'&&node.props.children==='Add alternative or required support')!;
    button.props.onClick();
    expect(result).toEqual({op:'all',args:[{op:'ref',refId:'o0.ring',scope:'historical'},{op:'ref',refId:'o1.film',scope:'current'}]});
  });
  it('shows missing scopes without silently repairing saved drafts and retains unknown occasion IDs',()=>{
    const tree=ConditionEditor({value:{op:'hasSource',id:'o0.film'},content:occasionFixture,onChange:()=>{throw Error('Render must not mutate');}});
    expect(renderToStaticMarkup(tree)).toContain('Missing explicit scope');
    const membership=OccasionEditor({value:'unfinished-occasion',content:occasionFixture,onChange:()=>{throw Error('Render must not mutate');}});
    expect(renderToStaticMarkup(membership)).toContain('unfinished-occasion (undeclared)');
  });
  it('keeps legacy controls and new entity defaults occasion-absent',()=>{
    let result:ConditionV2={op:'always'};
    changeLabel(ConditionEditor({value:result,content:evidenceFixture,onChange:value=>{result=value;}}),'Operator','hasSource');
    expect(result).toEqual({op:'hasSource',id:evidenceFixture.sources[0].id});
    expect(renderToStaticMarkup(ConditionEditor({value:result,content:evidenceFixture,onChange:()=>{}}))).not.toContain('Evidence scope');
    expect(occasionDefaults(evidenceFixture,evidenceFixture.start)).toEqual({});
    expect(authorIdPrefix(evidenceFixture,evidenceFixture.start,'source')).toBe('source');
    expect(newProofReference('film',false)).toEqual({op:'ref',refId:'film'});
    expect(occasionDefaults(occasionFixture,'o1.arrival')).toEqual({occasionId:'o1'});
    expect(authorIdPrefix(occasionFixture,'o1.arrival','source')).toBe('o1.source');
  });
  it('preserves unfinished occasion metadata and null preview through save/export/import',async()=>{
    const project=newProject(occasionFixture);
    project.content.sources[0].sourceKey='';project.content.sources[0].derivedFrom=[''];
    project.content.scenes[0].occasionId='';
    project.content.characters[1].initial.knows=['unfinished'];
    const roundtrip=checkedProject(exportProject(project));expect(roundtrip).toEqual(project);
    expect(compileProject(roundtrip).ok).toBe(false);
    const store=new AuthorProjectStore(new IDBFactory(),'occasion-author-ui-durability');
    await store.save(project,null);expect(await store.load(project.content.id)).toMatchObject({project,lastValid:null});
  });
  it('rejects occasion scenario injection before fabricating history or changing the bundle',()=>{
    const before=JSON.stringify(occasionFixture);
    expect(()=>injectedPreview(occasionFixture,{sceneId:'o2.arrival',flags:[],sourceIds:['o0.film'],characters:[{id:'miriam_exterior',initial:{knows:['o0.film'],believes:[],claims:[]}}]})).toThrow('Scenario injection is unavailable for occasion content');
    expect(JSON.stringify(occasionFixture)).toBe(before);
  });
});
