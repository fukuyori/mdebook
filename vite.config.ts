import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'MDebook',
      fileName: (format) => `mdebook.${format}.js`,
      formats: ['iife', 'es'],
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'pdfmake/build/pdfmake', 'pdfmake/build/vfs_fonts'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          'pdfmake/build/pdfmake': 'pdfMake',
          'pdfmake/build/vfs_fonts': 'pdfMakeVfs',
        },
      },
    },
  },
  server: {
    port: 3000,
    open: true,
  },
});
