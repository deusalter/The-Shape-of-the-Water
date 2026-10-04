/* The build tool injects the content hash; no remote services are used. */
const CACHE = 'literary-detective-__BUILD_VERSION__';
const BUILD_VERSION = '__BUILD_VERSION__';
const scoped = path => new URL(path, self.registration.scope).href;
const digest = async response => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',await response.clone().arrayBuffer())),byte=>byte.toString(16).padStart(2,'0')).join('');
function validManifest(manifest) { return manifest.version === BUILD_VERSION && Array.isArray(manifest.files) && manifest.files.length>0 && manifest.files.every(file=>typeof file==='string'&&!file.startsWith('/')&&!file.includes('..')&&typeof manifest.hashes?.[file]==='string') && (manifest.contentHashes===undefined||Array.isArray(manifest.contentHashes)&&manifest.contentHashes.length<=9&&manifest.contentHashes.includes(manifest.contentHash)&&manifest.contentHashes.every(hash=>typeof hash==='string'&&/^[a-f0-9]{64}$/.test(hash))); }
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const response = await fetch(scoped('asset-manifest.json'), { cache: 'no-store' });
    if (!response.ok) throw new Error('Offline manifest unavailable');
    const manifest = await response.json();
    if(!validManifest(manifest))throw new Error('Offline manifest does not match this build');
    const cache = await caches.open(CACHE);
    for(const file of manifest.files){const asset=await fetch(scoped(file),{cache:'no-store'});if(!asset.ok||await digest(asset)!==manifest.hashes[file])throw new Error(`Offline verification failed for ${file}`);await cache.put(scoped(file),asset);}
    await cache.put(scoped('asset-manifest.json'), new Response(JSON.stringify(manifest), { headers: { 'Content-Type': 'application/json' } }));
  })());
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    // Updates wait until tabs using the prior worker close. Existing caches are retained.
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    // These are same-origin immutable build assets, verified against the manifest.
    // Vite preview's Vary: Origin otherwise misses module requests while offline.
    const cached = await cache.match(event.request,{ignoreVary:true});
    if (cached) return cached;
    try { return await fetch(event.request); }
    catch (error) { if (event.request.mode === 'navigate') { const index = await cache.match(scoped('index.html')); if (index) return index; } throw error; }
  })());
});
self.addEventListener('message', event => {
  if (event.data?.type !== 'CHECK_READY' || !event.ports[0]) return;
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE), response = await cache.match(scoped('asset-manifest.json'));
    let ready = false;
    let contentMismatch=false;
    if (response) { const manifest = await response.json();if(validManifest(manifest)){contentMismatch=manifest.contentHash!==event.data.contentHash&&!manifest.contentHashes?.includes(event.data.contentHash);ready=!contentMismatch;for(const file of manifest.files){const asset=await cache.match(scoped(file));if(!asset||await digest(asset)!==manifest.hashes[file]){ready=false;break;}}} }
    event.ports[0].postMessage({ ready,version:BUILD_VERSION,contentMismatch });
  })());
});
