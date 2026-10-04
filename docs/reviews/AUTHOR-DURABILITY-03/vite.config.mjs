import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({root:process.cwd(),plugins:[react()],base:'./',publicDir:false,build:{outDir:process.env.AUTHOR_DURABILITY_DIST,emptyOutDir:true,rollupOptions:{input:'studio.html'}}});
