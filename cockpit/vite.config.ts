import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react()],

  // Production optimizations
  build: {
    // Disable source maps in production to prevent code leak
    sourcemap: mode === 'development',

    // Minify for production
    minify: mode === 'production' ? 'esbuild' : false,

    // Remove console.log in production
    esbuild: mode === 'production' ? {
      drop: ['console', 'debugger'],
    } : undefined,

    // Split chunks for better caching
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          ui: ['framer-motion', 'lucide-react'],
          state: ['zustand', '@supabase/supabase-js'],
        },
      },
    },
  },

  // Define env variables prefix (only VITE_ prefixed vars are exposed)
  envPrefix: 'VITE_',

  // Server config for development
  server: {
    port: 5173,
    strictPort: false,
  },
}))
