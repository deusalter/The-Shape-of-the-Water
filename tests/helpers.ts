import { fixtureContent } from '../src/content/fixture';
import { applyChoice, availableChoices, confirmationFor, type GameState } from '../src/engine/game';
export function move(state: GameState,choiceId:string,content=fixtureContent,id=`command.${state.revision}`):GameState {
  const command={id,choiceId,expectedRevision:state.revision},choice=availableChoices(content,state).find(choice=>choice.id===choiceId);
  const result=applyChoice(content,state,choice?.ending||choice?.irreversible?{...command,confirmation:confirmationFor(state,command)}:command);
  if(!result.ok)throw new Error(`${result.error.code}: ${result.error.message}`);return result.state;
}
