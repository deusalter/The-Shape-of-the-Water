import React from 'react';
import { createRoot } from 'react-dom/client';
import { EvidenceStudio } from './studio/EvidenceStudio';
import { installedCase, replayContext } from './content/load-evidence';
import './styles.css';
createRoot(document.getElementById('root')!).render(<React.StrictMode>{installedCase.ok ? <EvidenceStudio initial={installedCase.value} context={replayContext}/> : <main><h1>Installed content is invalid</h1><p role="alert">{installedCase.errors.join(' ')}</p></main>}</React.StrictMode>);
