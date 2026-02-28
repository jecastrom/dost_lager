import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { CONTAINERS, queryItems, getItem, upsertItem, deleteItem } from "../utils/cosmos.js";

const CONTAINER = CONTAINERS.STOCK;

/** Strip Cosmos DB system fields */
function stripMeta(doc: any): any {
  if (!doc) return doc;
  const { _rid, _self, _etag, _attachments, _ts, ...clean } = doc;
  return clean;
}

/**
 * GET /api/stock          → All stock items
 * GET /api/stock/:id      → Single stock item by ID
 * POST /api/stock         → Create/update a stock item
 * PUT /api/stock/:id      → Update a stock item
 * DELETE /api/stock/:id   → Delete a stock item
 */
async function stockHandler(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  try {
    const id = request.params.id;

    // GET
    if (request.method === "GET") {
      if (id) {
        const item = await getItem(CONTAINER, id, id);
        if (!item) return { status: 404, jsonBody: { error: "Item not found" } };
        return { status: 200, jsonBody: stripMeta(item) };
      }
      const items = await queryItems(CONTAINER);
      return { status: 200, jsonBody: items.map(stripMeta) };
    }

    // POST / PUT
    if (request.method === "POST" || request.method === "PUT") {
      const body = await request.json() as any;
      if (!body.id) return { status: 400, jsonBody: { error: "Missing 'id' field" } };
      const result = await upsertItem(CONTAINER, body);
      return { status: 200, jsonBody: result };
    }

    // DELETE
    if (request.method === "DELETE") {
      if (!id) return { status: 400, jsonBody: { error: "Missing item ID" } };
      await deleteItem(CONTAINER, id, id);
      return { status: 204 };
    }

    return { status: 405, jsonBody: { error: "Method not allowed" } };
  } catch (error: any) {
    context.error(`Stock API error: ${error.message}`);
    return { status: 500, jsonBody: { error: error.message } };
  }
}

app.http("stock", {
  methods: ["GET", "POST", "PUT", "DELETE"],
  authLevel: "anonymous",
  route: "stock/{id?}",
  handler: stockHandler,
});
