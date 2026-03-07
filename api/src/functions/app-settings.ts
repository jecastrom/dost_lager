import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { getItem, upsertItem, queryItems } from "../utils/cosmos.js";

const CONTAINER = "app-settings";

// Valid setting keys — prevents arbitrary writes
const VALID_KEYS = [
  "lagerort-categories",
  "ticket-config",
  "timeline-config",
  "global-blind-mode",
  "status-column-first",
] as const;

type SettingKey = typeof VALID_KEYS[number];

interface AppSetting {
  id: string;
  settingId: string;  // partition key — always "global"
  data: unknown;
  updatedAt: number;
}

// GET /api/app-settings?key=lagerort-categories  → single setting
// GET /api/app-settings                          → all settings
// PUT /api/app-settings?key=lagerort-categories  → upsert setting
app.http("app-settings", {
  methods: ["GET", "PUT"],
  authLevel: "anonymous",
  route: "app-settings",
  handler: async (req: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
    try {
      const method = req.method.toUpperCase();
      const key = req.query.get("key") as SettingKey | null;

      // --- GET ---
      if (method === "GET") {
        if (key) {
          if (!VALID_KEYS.includes(key)) {
            return { status: 400, jsonBody: { error: `Invalid key. Valid keys: ${VALID_KEYS.join(", ")}` } };
          }
          const doc = await getItem<AppSetting>(CONTAINER, key, "global");
          if (!doc) {
            return { status: 404, jsonBody: { error: `Setting '${key}' not found` } };
          }
          return { status: 200, jsonBody: doc };
        }

        // Return all settings
        const all = await queryItems<AppSetting>(CONTAINER, "SELECT * FROM c WHERE c.settingId = 'global'");
        return { status: 200, jsonBody: all };
      }

      // --- PUT ---
      if (method === "PUT") {
        if (!key) {
          return { status: 400, jsonBody: { error: "Missing 'key' query parameter" } };
        }
        if (!VALID_KEYS.includes(key)) {
          return { status: 400, jsonBody: { error: `Invalid key. Valid keys: ${VALID_KEYS.join(", ")}` } };
        }

        const body = await req.json() as any;
        if (body.data === undefined) {
          return { status: 400, jsonBody: { error: "Request body must include 'data' field" } };
        }

        const doc: AppSetting = {
          id: key,
          settingId: "global",
          data: body.data,
          updatedAt: Date.now(),
        };

        const result = await upsertItem(CONTAINER, doc);
        return { status: 200, jsonBody: result };
      }

      return { status: 405, jsonBody: { error: "Method not allowed" } };

    } catch (err: any) {
      context.error("[app-settings] Error:", err);
      return { status: 500, jsonBody: { error: err.message || "Internal server error" } };
    }
  },
});