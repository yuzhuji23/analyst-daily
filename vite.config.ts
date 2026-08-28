import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";
import { hotspotApi } from "./server/hotspotApi";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const key = env.DEEPSEEK_API_KEY || process.env.DEEPSEEK_API_KEY || "";
  return {
    plugins: [react(), hotspotApi(key)],
    base: "./",
    optimizeDeps: { include: ["sql.js"] },
    build: {
      outDir: "dist",
    },
  };
});
