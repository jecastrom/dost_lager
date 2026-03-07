import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { upsertItem, queryItems } from "../utils/cosmos.js";

const CONTAINER = "stock-logs";

// GET  /api/stock-logs?limit=50&offset=0  → paginated, newest first
// POST /api/stock-logs                     → append one or many entries
app.http("stock-logs", {
  methods: ["GET", "POST"],
  authLevel: "anonymous",
  route: "stock-logs",
  handler: async (req: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
    try {
      const method = req.method.toUpperCase();

      // --- GET: Paginated read ---
      if (method === "GET") {
        const limit = Math.min(parseInt(req.query.get("limit") || "50"), 500);
        const offset = parseInt(req.query.get("offset") || "0");

        const results = await queryItems<any>(
          CONTAINER,
          "SELECT * FROM c ORDER BY c.timestamp DESC OFFSET @offset LIMIT @limit",
          [
            { name: "@limit", value: limit },
            { name: "@offset", value: offset },
          ]
        );

        return { status: 200, jsonBody: { items: results, limit, offset, count: results.length } };
      }

      // --- POST: Append entries ---
      if (method === "POST") {
        const body = await req.json() as any;

        // Accept single entry or array
        const entries: any[] = Array.isArray(body) ? body : [body];

        if (entries.length === 0) {
          return { status: 400, jsonBody: { error: "No entries provided" } };
        }

        const results: any[] = [];
        for (const entry of entries) {
          if (!entry.id) {
            entry.id = `sl-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
          }
          if (!entry.timestamp) {
            entry.timestamp = Date.now();
          }
          entry.docType = "stock-log";
          const saved = await upsertItem(CONTAINER, entry);
          results.push(saved);
        }

        return { status: 201, jsonBody: { created: results.length, items: results } };
      }

      return { status: 405, jsonBody: { error: "Method not allowed" } };

    } catch (err: any) {
      context.error("[stock-logs] Error:", err);
      return { status: 500, jsonBody: { error: err.message || "Internal server error" } };
    }
  },
});