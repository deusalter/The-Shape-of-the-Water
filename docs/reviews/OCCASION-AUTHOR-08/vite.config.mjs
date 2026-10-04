import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({root:process.cwd(),plugins:[react()],base:'./',publicDir:'public',build:{outDir:'../dist',emptyOutDir:true,rollupOptions:{input:'studio.html'}}});
