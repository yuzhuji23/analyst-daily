import type { Connect, Plugin } from "vite";
import { apiState, handleHotspot, handleKey, handleSqlReview, handleTerm } from "./hotspotCore";

export { apiState, handleHotspot, handleKey, handleSqlReview, handleTerm } from "./hotspotCore";

export function hotspotApi(apiKey: string): Plugin {
  if (apiKey.trim()) apiState.key = apiKey.trim();
  const attach = (middlewares: Connect.Server) => {
    middlewares.use((req, res, next) => {
      const path = req.url?.split("?")[0];
      if (path === "/api/hotspot") {
        void handleHotspot(req, res, apiState);
        return;
      }
      if (path === "/api/hotspot-key") {
        void handleKey(req, res, apiState);
        return;
      }
      if (path === "/api/term") {
        void handleTerm(req, res, apiState);
        return;
      }
      if (path === "/api/sql-review") {
        void handleSqlReview(req, res, apiState);
        return;
      }
      next();
    });
  };
  return {
    name: "hotspot-api",
    configureServer(server) {
      attach(server.middlewares);
    },
    configurePreviewServer(server) {
      attach(server.middlewares);
    },
  };
}
