import React from 'react';
import { createRoot } from 'react-dom/client';
import { EvidenceStudio } from './studio/EvidenceStudio';
import { replayContext } from './content/load-evidence';
import { editionFromSearch } from './content/editions';
import './styles.css';
const selected=editionFromSearch(location.search).content;
createRoot(document.getElementById('root')!).render(<React.StrictMode>{selected.ok ? <EvidenceStudio initial={selected.value} context={replayContext}/> : <main><h1>Installed content is invalid</h1><p role="alert">{selected.errors.join(' ')}</p></main>}</React.StrictMode>);
