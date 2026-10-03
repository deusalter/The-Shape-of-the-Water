import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig(({mode})=>({plugins:[react()],base:'./',publicDir:mode==='studio'?false:'public',build:{outDir:mode==='studio'?'dist-studio':'dist-player',rollupOptions:{input:mode==='studio'?'studio.html':'index.html'}}}));
