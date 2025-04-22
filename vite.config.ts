import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target: "https://localhost:5000",
        changeOrigin: true,
        secure: false, // не проверять self-signed сертификат
        rewrite: (path) => path.replace(/^\/api/, "/v1/api"),
      },
    },
  },
});