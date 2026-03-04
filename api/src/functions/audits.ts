import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { CONTAINERS, queryItems, getItem, upsertItem, deleteItem } from "../utils/cosmos.js";

const CONTAINER = CONTAINERS.AUDITS;

/** Strip Cosmos DB system fields */
function stripMeta(doc: any): any {
    if (!doc) return doc;
    const { _rid, _self, _etag, _attachments, _ts, ...clean } = doc;
    return clean;
}

/**
 * GET /api/audits              → All audit sessions
 * GET /api/audits?status=X     → Filter by status
 * GET /api/audits?createdBy=X  → Filter by creator
 * GET /api/audits/:id          → Single audit session by ID
 * POST /api/audits             → Create/update an audit session
 * PUT /api/audits/:id          → Update an audit session
 * DELETE /api/audits/:id       → Delete an audit session
 */
async function auditsHandler(
    request: HttpRequest,
    context: InvocationContext
): Promise<HttpResponseInit> {
    try {
        const id = request.params.id;

        // GET
        if (request.method === "GET") {
            if (id) {
                const item = await getItem(CONTAINER, id, id);
                if (!item) return { status: 404, jsonBody: { error: "Audit session not found" } };
                return { status: 200, jsonBody: stripMeta(item) };
            }

            // Optional filters
            const status = request.query.get("status");
            const createdBy = request.query.get("createdBy");

            if (status) {
                const items = await queryItems(
                    CONTAINER,
                    "SELECT * FROM c WHERE c.status = @status",
                    [{ name: "@status", value: status }]
                );
                return { status: 200, jsonBody: items.map(stripMeta) };
            }

            if (createdBy) {
                const items = await queryItems(
                    CONTAINER,
                    "SELECT * FROM c WHERE c.createdBy = @createdBy",
                    [{ name: "@createdBy", value: createdBy }]
                );
                return { status: 200, jsonBody: items.map(stripMeta) };
            }

            const items = await queryItems(CONTAINER);
            return { status: 200, jsonBody: items.map(stripMeta) };
        }

        // POST / PUT
        if (request.method === "POST" || request.method === "PUT") {
            const body = await request.json() as any;
            if (!body.id) return { status: 400, jsonBody: { error: "Missing 'id' field" } };
            // Ensure docType for multi-type container queries
            if (!body.docType) body.docType = "audit-session";
            const result = await upsertItem(CONTAINER, body);
            return { status: 200, jsonBody: stripMeta(result) };
        }

        // DELETE
        if (request.method === "DELETE") {
            if (!id) return { status: 400, jsonBody: { error: "Missing audit session ID" } };
            await deleteItem(CONTAINER, id, id);
            return { status: 204 };
        }

        return { status: 405, jsonBody: { error: "Method not allowed" } };
    } catch (error: any) {
        context.error(`Audits API error: ${error.message}`);
        return { status: 500, jsonBody: { error: error.message } };
    }
}

app.http("audits", {
    methods: ["GET", "POST", "PUT", "DELETE"],
    authLevel: "anonymous",
    route: "audits/{id?}",
    handler: auditsHandler,
});