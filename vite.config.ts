import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { cpSync } from 'node:fs';

export default defineConfig(({mode})=>({
  plugins:[react(),{
    name:'studio-world-assets',
    apply:'build' as const,
    closeBundle(){if(mode==='studio')for(const folder of ['art','world'])cpSync(`public/${folder}`,`dist-studio/${folder}`,{recursive:true});},
  }],
  base:'./',
  // Author preview gets local world assets, but never the player's service worker.
  publicDir:mode==='studio'?false:'public',
  build:{outDir:mode==='studio'?'dist-studio':'dist-player',rollupOptions:{input:mode==='studio'?'studio.html':'index.html'}},
}));
