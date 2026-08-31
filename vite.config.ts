import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { IncomingMessage, ServerResponse } from "node:http";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv, type Plugin } from "vite";
import { hotspotApi } from "./server/hotspotApi";

const root = path.dirname(fileURLToPath(import.meta.url));
const webrDir = path.join(root, "node_modules/webr/dist");

const MIME: Record<string, string> = {
  ".js": "text/javascript",
  ".wasm": "application/wasm",
  ".so": "application/octet-stream",
  ".map": "application/json",
  ".metadata": "application/json",
  ".conf": "text/plain",
  ".pem": "application/x-pem-file",
  ".TAG": "text/plain",
};

function webrAssets(): Plugin {
  const send = (req: IncomingMessage, res: ServerResponse, next: () => void) => {
    const raw = req.url?.split("?")[0] ?? "";
    if (!raw.startsWith("/webr/")) {
      next();
      return;
    }
    const rel = decodeURIComponent(raw.slice("/webr/".length));
    if (!rel || rel.includes("..")) {
      next();
      return;
    }
    const file = path.join(webrDir, rel);
    if (!file.startsWith(webrDir) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
      next();
      return;
    }
    res.setHeader("Content-Type", MIME[path.extname(file)] || "application/octet-stream");
    res.setHeader("Cache-Control", "public, max-age=31536000");
    fs.createReadStream(file).pipe(res);
  };
  return {
    name: "webr-assets",
    configureServer(server) {
      server.middlewares.use(send);
    },
    configurePreviewServer(server) {
      server.middlewares.use(send);
    },
    closeBundle() {
      const dest = path.join(root, "dist/webr");
      fs.cpSync(webrDir, dest, {
        recursive: true,
        filter: (src) => !src.includes("/tests") && !src.includes("/repl") && !src.endsWith(".map"),
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const key = env.DEEPSEEK_API_KEY || process.env.DEEPSEEK_API_KEY || "";
  return {
    plugins: [react(), hotspotApi(key), webrAssets()],
    base: "./",
    resolve: {
      alias: {
        webr: path.join(root, "node_modules/webr/dist/webr.js"),
      },
    },
    optimizeDeps: { include: ["sql.js"], exclude: ["webr"] },
    build: {
      outDir: "dist",
    },
  };
});
