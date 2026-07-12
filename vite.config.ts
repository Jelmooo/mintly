import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // Relative base so the built assets resolve under Capacitor's file:// origin.
  base: './',
  plugins: [react()],
});
