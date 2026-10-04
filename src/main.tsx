import React from 'react';
import { createRoot } from 'react-dom/client';
import { Release } from './Release';
import './styles.css';

createRoot(document.getElementById('root')!).render(<React.StrictMode><Release /></React.StrictMode>);
