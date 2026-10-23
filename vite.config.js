import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base './' permite subir la carpeta dist/ a cualquier hosting, también en una subcarpeta
export default defineConfig({
  base: './',
  plugins: [react()],
});
