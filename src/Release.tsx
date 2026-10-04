import { useEffect, useState } from 'react';
import { EvidencePlayer } from './components/EvidencePlayer';
import { otherStoryEditions, storyEditionFromSearch } from './content/edition-catalog';
import { loadStoryEdition, type LoadedStoryEdition } from './content/load-story';

export function Release() {
  const [edition] = useState(() => storyEditionFromSearch(location.search));
  const [loaded, setLoaded] = useState<LoadedStoryEdition>();
  const [loadError, setLoadError] = useState(false);
  useEffect(() => {
    let active = true;
    setLoadError(false);
    void loadStoryEdition(edition).then(result => { if (active) setLoaded(result); }).catch(() => { if (active) setLoadError(true); });
    return () => { active = false; };
  }, [edition]);
  if (loadError) return <main><h1>This story could not be opened</h1><p role="alert">The selected story could not be downloaded. Your saved runs remain in browser storage.</p><button onClick={() => location.reload()}>Try opening the story again</button></main>;
  if (!loaded) return <main><h1>Opening the story</h1><p role="status">Loading the selected text…</p></main>;
  const selected=loaded.content;
  const alternatives=otherStoryEditions(edition);
  if (!selected.ok) return <main><h1>This story could not be opened</h1><p role="alert">The selected story failed validation. Your saved runs remain in browser storage.</p><details><summary>Validation details</summary><ul>{selected.errors.map((error,index)=><li key={index}>{error}</li>)}</ul></details></main>;
  return <><EvidencePlayer content={selected.value} context={loaded.context}/>{alternatives.length>0&&<nav className="edition-nav" aria-label="Saved editions">{alternatives.map(alternative=><p key={alternative.id}><a href={alternative.href}>{alternative.label}</a></p>)}<p>Each edition keeps its own saved runs.</p></nav>}</>;
}
