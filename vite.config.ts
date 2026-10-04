import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { cpSync } from 'node:fs';

export default defineConfig(({mode})=>({
  plugins:[react(),{
    name:'studio-illustrations',
    apply:'build' as const,
    closeBundle(){if(mode==='studio')cpSync('public/art','dist-studio/art',{recursive:true});},
  }],
  base:'./',
  // Author preview gets the shared illustrations, but never the player's worker.
  publicDir:mode==='studio'?false:'public',
  build:{outDir:mode==='studio'?'dist-studio':'dist-player',rollupOptions:{input:mode==='studio'?'studio.html':'index.html'}},
}));
