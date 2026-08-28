import type { IncomingMessage, ServerResponse } from "node:http";
import { apiState, handleKey } from "../server/hotspotCore";

export default function handler(req: IncomingMessage, res: ServerResponse) {
  void handleKey(req, res, apiState);
}
