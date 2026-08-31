import type { IncomingMessage, ServerResponse } from "node:http";
import { apiState, handleNewsAsk } from "../server/hotspotCore";

export const config = { maxDuration: 30 };

export default function handler(req: IncomingMessage, res: ServerResponse) {
  void handleNewsAsk(req, res, apiState);
}
