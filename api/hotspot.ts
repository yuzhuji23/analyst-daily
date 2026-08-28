import type { IncomingMessage, ServerResponse } from "node:http";
import { apiState, handleHotspot } from "../server/hotspotCore";

export const config = { maxDuration: 60 };

export default function handler(req: IncomingMessage, res: ServerResponse) {
  void handleHotspot(req, res, apiState);
}
