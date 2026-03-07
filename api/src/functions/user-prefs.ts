import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { getItem, upsertItem } from "../utils/cosmos.js";

const CONTAINER = "user-profiles";

interface UserPrefs {
  id: string;           // "prefs:{userId}"
  docType: "user-prefs";
  themePreference: string;
  inventoryViewMode: string;
  notifications: unknown[];
  updatedAt: number;
}

const DEFAULTS: Omit<UserPrefs, "id" | "updatedAt"> = {
  docType: "user-prefs",
  themePreference: "auto",
  inventoryViewMode: "grid",
  notifications: [],
};

// GET  /api/user-prefs?userId=xxx   → read prefs (returns defaults if none saved)
// PUT  /api/user-prefs?userId=xxx   → partial update prefs
app.http("user-prefs", {
  methods: ["GET", "PUT"],
  authLevel: "anonymous",
  route: "user-prefs",
  handler: async (req: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
    try {
      const method = req.method.toUpperCase();
      const userId = req.query.get("userId");

      if (!userId) {
        return { status: 400, jsonBody: { error: "Missing 'userId' query parameter" } };
      }

      const docId = `prefs:${userId}`;

      // --- GET ---
      if (method === "GET") {
        const doc = await getItem<UserPrefs>(CONTAINER, docId, docId);
        if (!doc) {
          // Return defaults — no document saved yet
          return {
            status: 200,
            jsonBody: { id: docId, ...DEFAULTS, updatedAt: 0 },
          };
        }
        return { status: 200, jsonBody: doc };
      }

      // --- PUT: Partial update ---
      if (method === "PUT") {
        const body = await req.json() as Record<string, unknown>;

        // Read existing or start from defaults
        const existing = await getItem<UserPrefs>(CONTAINER, docId, docId);
        const current = existing || { id: docId, ...DEFAULTS, updatedAt: 0 };

        // Only allow known fields to be updated
        const ALLOWED_FIELDS = ["themePreference", "inventoryViewMode", "notifications"];
        for (const field of ALLOWED_FIELDS) {
          if (body[field] !== undefined) {
            (current as any)[field] = body[field];
          }
        }
        current.updatedAt = Date.now();

        const result = await upsertItem(CONTAINER, current);
        return { status: 200, jsonBody: result };
      }

      return { status: 405, jsonBody: { error: "Method not allowed" } };

    } catch (err: any) {
      context.error("[user-prefs] Error:", err);
      return { status: 500, jsonBody: { error: err.message || "Internal server error" } };
    }
  },
});