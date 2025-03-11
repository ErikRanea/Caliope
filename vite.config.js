import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';
import { copyFileSync, existsSync } from 'fs';

export default defineConfig({
  plugins: [vue()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'src/main.js'),
        'vue-app': resolve(__dirname, 'src/vue-app.js')
      },
      output: {
        entryFileNames: '[name].js',
        format: 'es'
      }
    }
  }
});

// Copiar archivos manualmente después del build
const filesToCopy = ['manifest.json', 'background.js'];
filesToCopy.forEach(file => {
  const srcPath = resolve(__dirname, file);
  const destPath = resolve(__dirname, 'dist', file);

  if (existsSync(srcPath)) {
    copyFileSync(srcPath, destPath);
    console.log(`✅ Copiado ${file} a dist/`);
  } else {
    console.error(`❌ ERROR: No se encontró ${file} en el directorio raíz.`);
  }
});
