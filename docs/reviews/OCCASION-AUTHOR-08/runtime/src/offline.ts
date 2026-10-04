import { useEffect, useState } from 'react';

export function useOfflineStatus(preview = false,contentHash = '') {
  const [status, setStatus] = useState(import.meta.env.DEV ? 'Offline preparation is available in the built app.' : 'Preparing offline play…');
  useEffect(() => {
    if (preview) { setStatus('Studio preview saves are separate from the release player.'); return; }
    if (import.meta.env.DEV) return;
    if (!('serviceWorker' in navigator)) { setStatus('Offline preparation is unavailable in this browser.'); return; }
    let cancelled = false;
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`, { scope: import.meta.env.BASE_URL }).then(() => navigator.serviceWorker.ready).then(registration => {
      const worker = registration.active;
      if (!worker) throw new Error('No active service worker');
      const channel = new MessageChannel();
      const timeout = setTimeout(() => { channel.port1.close(); if (!cancelled) setStatus('Offline preparation could not be verified.'); }, 10000);
      channel.port1.onmessage = async event => {
        clearTimeout(timeout);channel.port1.close();
        const controllerReady = !!navigator.serviceWorker.controller || await new Promise<boolean>(resolve=>{const timeout=setTimeout(()=>resolve(false),5000);navigator.serviceWorker.addEventListener('controllerchange',()=>{clearTimeout(timeout);resolve(true);},{once:true});});
        if(!cancelled)setStatus(event.data?.ready===true&&controllerReady?'Ready for offline play on this device.':event.data?.contentMismatch?'Offline files belong to a different story revision. Close other tabs and reload online to prepare this revision.':event.data?.ready===true?'Offline files verified. Reload once online to activate offline play.':'Offline preparation is incomplete. Keep this page online and reload.');
      };
      worker.postMessage({ type: 'CHECK_READY',contentHash }, [channel.port2]);
    }).catch(() => { if (!cancelled) setStatus('Offline preparation failed. Progress can still be exported.'); });
    return () => { cancelled = true; };
  }, [preview,contentHash]);
  return status;
}
