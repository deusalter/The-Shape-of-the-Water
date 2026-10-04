import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { EvidenceStudio } from './studio/EvidenceStudio';
import { storyEditionFromSearch } from './content/edition-catalog';
import { loadInstalledReplayContext, loadStoryEdition, type LoadedStoryEdition } from './content/load-story';
import './styles.css';
function StudioRelease() {
  const [edition] = useState(() => storyEditionFromSearch(location.search));
  const [loaded, setLoaded] = useState<LoadedStoryEdition>();
  const [loadError, setLoadError] = useState(false);
  useEffect(() => {
    let active = true;
    setLoadError(false);
    void Promise.all([loadStoryEdition(edition), loadInstalledReplayContext()]).then(([story, context]) => {
      if (active) setLoaded({ ...story, context });
    }).catch(() => { if (active) setLoadError(true); });
    return () => { active = false; };
  }, [edition]);
  if (loadError) return <main><h1>The studio could not be opened</h1><p role="alert">The selected text or its installed compatibility mapping could not be downloaded. Saved drafts and runs remain in browser storage.</p><button onClick={() => location.reload()}>Try opening the studio again</button></main>;
  if (!loaded) return <main><h1>Opening the studio</h1><p role="status">Loading the selected text and installed compatibility mapping…</p></main>;
  const selected = loaded.content;
  return selected.ok ? <EvidenceStudio initial={selected.value} context={loaded.context}/> : <main><h1>Installed content is invalid</h1><p role="alert">{selected.errors.join(' ')}</p></main>;
}
createRoot(document.getElementById('root')!).render(<React.StrictMode><StudioRelease /></React.StrictMode>);
