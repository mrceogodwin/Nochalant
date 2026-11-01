import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          if (/node_modules\/(react|react-dom|scheduler)\//.test(id)) return "vendor-react";
          if (/node_modules\/(jose|@neondatabase\/auth|@neondatabase\/serverless)\//.test(id)) return "vendor-auth";
        }
      }
    },
    chunkSizeWarningLimit: 650
  }
});
