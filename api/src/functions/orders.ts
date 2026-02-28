import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { CONTAINERS, queryItems, getItem, upsertItem, deleteItem } from "../utils/cosmos.js";

const CONTAINER = CONTAINERS.ORDERS;

/**
 * GET /api/orders          → All purchase orders
 * GET /api/orders/:id      → Single PO by ID
 * POST /api/orders         → Create/update a PO
 * PUT /api/orders/:id      → Update a PO
 * DELETE /api/orders/:id   → Delete a PO
 */
async function ordersHandler(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  try {
    const id = request.params.id;

    // GET
    if (request.method === "GET") {
      if (id) {
        const item = await getItem(CONTAINER, id, id);
        if (!item) return { status: 404, jsonBody: { error: "Order not found" } };
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
      if (!id) return { status: 400, jsonBody: { error: "Missing order ID" } };
      await deleteItem(CONTAINER, id, id);
      return { status: 204 };
    }

    return { status: 405, jsonBody: { error: "Method not allowed" } };
  } catch (error: any) {
    context.error(`Orders API error: ${error.message}`);
    return { status: 500, jsonBody: { error: error.message } };
  }
}

app.http("orders", {
  methods: ["GET", "POST", "PUT", "DELETE"],
  authLevel: "anonymous",
  route: "orders/{id?}",
  handler: ordersHandler,
});
