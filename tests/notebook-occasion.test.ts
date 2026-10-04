import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {describe,it,expect} from 'vitest';
import {InvestigationNotebook} from '../src/components/InvestigationNotebook';
import {occasionFixture as content} from '../src/engine/evidence-occasion-fixture';
import {applyCommandV2,createGameV2,type GameStateV2} from '../src/engine/evidence-v2';

const render=(state:GameStateV2)=>renderToStaticMarkup(createElement(InvestigationNotebook,{content,state,disabled:false,onAction:()=>{}}));
function choose(state:GameStateV2,choiceId:string){
  const result=applyCommandV2(content,state,{type:'choose',choiceId,id:`ui.${state.revision}`,expectedRevision:state.revision});
  if(!result.ok)throw new Error(result.error.message);
  return result.state;
}
function firstReturn(){
  let state=createGameV2(content);
  for(const id of ['inspect-old-film','prepare-chair','front-departure','first-crossing'])state=choose(state,id);
  return state;
}
describe('encountered occasion labels in the real notebook',()=>{
  it('does not render future labels, hidden actors, secret exhibits or unearned readings',()=>{
    for(const state of [createGameV2(content),firstReturn()]){
      const markup=render(state);
      expect(markup).toContain('First visit');
      expect(markup).not.toContain('UNSEEN_');
      expect(markup).not.toContain('PRIVATE_TITLE');
      expect(markup).not.toContain('npcState');
    }
  });
  it('distinguishes earlier inspection, current inspection and current recollection in selectable labels',()=>{
    let state=firstReturn();
    state=choose(state,'inspect-current-film');state=choose(state,'recall-film');
    const markup=render(state);
    expect(markup).toContain('Earlier recording (First visit)');
    expect(markup).toContain('Currently inspected recording (After the return)');
    expect(markup).toContain('Told from memory (After the return)');
    expect(markup).toContain('ORIGINAL_FILM_TEXT');
    expect(markup).toContain('CURRENT_FILM_TEXT');
    expect(markup).not.toContain('UNSEEN_');
  });
  it('keeps an earlier reading identified by its origin when opened after the return',()=>{
    const state=firstReturn();
    const result=applyCommandV2(content,state,{type:'reviewInterpretation',interpretationId:'o0.reading',id:'ui.read',expectedRevision:state.revision});
    if(!result.ok)throw new Error(result.error.message);
    expect(render(result.state)).toContain('<span class="occasion-label">First visit</span>Only this actually selected reading');
    expect(result.state.interpretations[0].occasionLabel).toBe('After the return');
    expect(result.state.interpretations[0].originOccasionLabel).toBe('First visit');
  });
});
