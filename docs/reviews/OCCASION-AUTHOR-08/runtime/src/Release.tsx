import { EvidencePlayer } from './components/EvidencePlayer';
import { installedCase, firstNightCase, replayContext } from './content/load-evidence';

export function Release() {
  const earlier=new URLSearchParams(location.search).get('edition')==='first-night';
  const selected=earlier?firstNightCase:installedCase;
  if (!selected.ok) return <main><h1>This story could not be opened</h1><p role="alert">The selected story failed validation. Your saved runs remain in browser storage.</p><details><summary>Validation details</summary><ul>{selected.errors.map((error,index)=><li key={index}>{error}</li>)}</ul></details></main>;
  return <><EvidencePlayer content={selected.value} context={replayContext}/>{installedCase.ok&&installedCase.value.occasions&&<nav className="edition-nav" aria-label="Saved editions"><a href={earlier?'./':'?edition=first-night'}>{earlier?'Open the expanded story':'Open the earlier first-night edition'}</a><p>Each edition keeps its own saved runs.</p></nav>}</>;
}
