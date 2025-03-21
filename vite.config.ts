
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    chunkSizeWarningLimit: 1000, // Увеличиваем лимит предупреждения до 1000 КБ
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: [
            'react', 
            'react-dom', 
            'react-router-dom',
            'date-fns',
            '@radix-ui/react-toast',
            '@radix-ui/react-dropdown-menu',
            '@tanstack/react-query'
          ],
          ui: [
            '@/components/ui',
          ],
          timesheet: [
            '@/components/TimeSheet'
          ]
        }
      }
    }
  }
}));
