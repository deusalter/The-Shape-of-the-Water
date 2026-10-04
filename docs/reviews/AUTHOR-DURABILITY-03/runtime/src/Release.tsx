import { EvidencePlayer } from './components/EvidencePlayer';
import { installedCase, replayContext } from './content/load-evidence';

export function Release() {
  if (!installedCase.ok) return <main><h1>This story could not be opened</h1><p role="alert">The installed story failed validation. Your saved runs remain in browser storage.</p><details><summary>Validation details</summary><ul>{installedCase.errors.map((error,index)=><li key={index}>{error}</li>)}</ul></details></main>;
  return <EvidencePlayer content={installedCase.value} context={replayContext}/>;
}
