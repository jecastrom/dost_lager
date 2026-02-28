import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { CONTAINERS, queryItems, getItem, upsertItem, deleteItem } from "../utils/cosmos.js";

const CONTAINER = CONTAINERS.SUPPLIERS;

/**
 * GET /api/suppliers          → All suppliers
 * GET /api/suppliers/:id      → Single supplier
 * POST /api/suppliers         → Create/update a supplier
 * PUT /api/suppliers/:id      → Update a supplier
 * DELETE /api/suppliers/:id   → Delete a supplier
 */
async function suppliersHandler(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  try {
    const id = request.params.id;

    // GET
    if (request.method === "GET") {
      if (id) {
        const item = await getItem(CONTAINER, id, id);
        if (!item) return { status: 404, jsonBody: { error: "Supplier not found" } };
        return { status: 200, jsonBody: item };
      }
      const items = await queryItems(CONTAINER);
      return { status: 200, jsonBody: items };
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
      if (!id) return { status: 400, jsonBody: { error: "Missing supplier ID" } };
      await deleteItem(CONTAINER, id, id);
      return { status: 204 };
    }

    return { status: 405, jsonBody: { error: "Method not allowed" } };
  } catch (error: any) {
    context.error(`Suppliers API error: ${error.message}`);
    return { status: 500, jsonBody: { error: error.message } };
  }
}

app.http("suppliers", {
  methods: ["GET", "POST", "PUT", "DELETE"],
  authLevel: "anonymous",
  route: "suppliers/{id?}",
  handler: suppliersHandler,
});
