import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: "/triangle-localization-simulator",
  server: {
    host: "0.0.0.0",
    watch: {
      usePolling: true,
    },
    hmr: { host: "0.0.0.0" },
  },
});
