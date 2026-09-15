import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // During local dev, forward /api calls to the Vercel dev server if used.
      // If you're not using `vercel dev`, run the app with `npm run dev` and
      // the built-in fallback intake engine will handle everything locally.
    },
  },
  build: {
    outDir: "dist",
  },
});
