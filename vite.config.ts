import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

export default defineConfig({
  plugins: [
    react(),
    ...(process.env.NODE_ENV === "development" 
      ? [runtimeErrorOverlay()]
      : []
    ),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    // Improve build for production
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-toast', '@radix-ui/react-select'],
          utils: ['lucide-react', 'clsx', 'tailwind-merge']
        }
      }
    },
    // Ensure proper asset paths
    assetsDir: 'assets',
    // Reduce chunk size warnings
    chunkSizeWarningLimit: 800,
  },
  // Better dev server configuration
  server: {
    host: true,
    port: 5173,
  },
  // Ensure proper asset handling
  publicDir: path.resolve(import.meta.dirname, "client", "public"),
});
