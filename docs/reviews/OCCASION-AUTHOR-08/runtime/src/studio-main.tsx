import React from 'react';
import { createRoot } from 'react-dom/client';
import { EvidenceStudio } from './studio/EvidenceStudio';
import { installedCase, firstNightCase, replayContext } from './content/load-evidence';
import './styles.css';
const selected=new URLSearchParams(location.search).get('edition')==='first-night'?firstNightCase:installedCase;
createRoot(document.getElementById('root')!).render(<React.StrictMode>{selected.ok ? <EvidenceStudio initial={selected.value} context={replayContext}/> : <main><h1>Installed content is invalid</h1><p role="alert">{selected.errors.join(' ')}</p></main>}</React.StrictMode>);
