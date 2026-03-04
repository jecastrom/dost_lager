import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { queryItems, upsertItem, getItem, deleteItem } from "../utils/cosmos.js";

const CONTAINER = "user-profiles";

// GET /api/user-profiles?userId=xxx  → single user lookup
// GET /api/user-profiles              → list all (admin only — frontend enforced)
app.http("user-profiles", {
    methods: ["GET", "POST", "PUT", "DELETE"],
    authLevel: "anonymous",
    route: "user-profiles",
    handler: async (req: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
        try {
            const method = req.method.toUpperCase();

            // --- GET: Lookup or List ---
            if (method === "GET") {
                const userId = req.query.get("userId");

                if (userId) {
                    // Single user lookup by ID
                    try {
                        const user = await getItem(CONTAINER, userId, userId);
                        return { status: 200, jsonBody: user };
                    } catch (err: any) {
                        if (err.code === 404) {
                            return { status: 404, jsonBody: { error: "User not found" } };
                        }
                        throw err;
                    }
                }

                // List all users
                const users = await queryItems(CONTAINER, "SELECT * FROM c ORDER BY c.lastName ASC");
                return { status: 200, jsonBody: users };
            }

            // --- POST / PUT: Create or Update user profile ---
            if (method === "POST" || method === "PUT") {
                const body = await req.json() as any;

                if (!body.id || !body.email || !body.role) {
                    return { status: 400, jsonBody: { error: "Missing required fields: id, email, role" } };
                }

                // Ensure featureAccess defaults
                if (!body.featureAccess) {
                    body.featureAccess = body.role === 'admin'
                        ? ['stock', 'audit', 'receipts', 'orders', 'suppliers', 'settings', 'global-settings']
                        : ['stock', 'audit'];
                }

                const doc = {
                    ...body,
                    docType: 'user-profile',
                    updatedAt: Date.now(),
                };

                const result = await upsertItem(CONTAINER, doc);
                return { status: method === "POST" ? 201 : 200, jsonBody: result };
            }

            // --- DELETE: Remove user profile ---
            if (method === "DELETE") {
                const userId = req.query.get("userId");
                if (!userId) {
                    return { status: 400, jsonBody: { error: "Missing userId query parameter" } };
                }

                await deleteItem(CONTAINER, userId, userId);
                return { status: 200, jsonBody: { deleted: true, id: userId } };
            }

            return { status: 405, jsonBody: { error: "Method not allowed" } };

        } catch (err: any) {
            context.error("[user-profiles] Error:", err);
            return { status: 500, jsonBody: { error: err.message || "Internal server error" } };
        }
    },
});