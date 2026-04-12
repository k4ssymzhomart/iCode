import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const projectRoot = path.resolve(__dirname, "..");

export default defineConfig({
  root: __dirname,
  envDir: projectRoot,
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "@backend": path.resolve(projectRoot, "backend"),
      "@shared": path.resolve(projectRoot, "shared"),
    },
  },
  server: {
    host: "0.0.0.0",
    fs: {
      allow: [projectRoot],
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
});
