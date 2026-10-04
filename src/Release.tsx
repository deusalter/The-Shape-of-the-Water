import { EvidencePlayer } from './components/EvidencePlayer';
import { replayContext } from './content/load-evidence';
import { editionFromSearch, otherEditions } from './content/editions';

export function Release() {
  const edition=editionFromSearch(location.search);
  const selected=edition.content;
  const alternatives=otherEditions(edition);
  if (!selected.ok) return <main><h1>This story could not be opened</h1><p role="alert">The selected story failed validation. Your saved runs remain in browser storage.</p><details><summary>Validation details</summary><ul>{selected.errors.map((error,index)=><li key={index}>{error}</li>)}</ul></details></main>;
  return <><EvidencePlayer content={selected.value} context={replayContext}/>{alternatives.length>0&&<nav className="edition-nav" aria-label="Saved editions">{alternatives.map(alternative=><p key={alternative.id}><a href={alternative.href}>{alternative.label}</a></p>)}<p>Each edition keeps its own saved runs.</p></nav>}</>;
}
