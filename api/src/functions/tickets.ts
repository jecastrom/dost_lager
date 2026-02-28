import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { CONTAINERS, queryItems, getItem, upsertItem } from "../utils/cosmos.js";

const CONTAINER = CONTAINERS.TICKETS;

/**
 * GET /api/tickets              → All tickets
 * GET /api/tickets?poId=PO-001 → Tickets for a specific PO
 * GET /api/tickets/:id          → Single ticket
 * POST /api/tickets             → Create/update a ticket
 * PUT /api/tickets/:id          → Update a ticket
 */
async function ticketsHandler(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  try {
    const id = request.params.id;
    const url = new URL(request.url);
    const poId = url.searchParams.get("poId");

    // GET
    if (request.method === "GET") {
      if (id) {
        const item = await getItem(CONTAINER, id, id);
        if (!item) return { status: 404, jsonBody: { error: "Ticket not found" } };
        return { status: 200, jsonBody: item };
      }

      if (poId) {
        const items = await queryItems(
          CONTAINER,
          "SELECT * FROM c WHERE c.poId = @poId",
          [{ name: "@poId", value: poId }]
        );
        return { status: 200, jsonBody: items };
      }

      const items = await queryItems(CONTAINER);
      return { status: 200, jsonBody: items };
    }

    // POST / PUT
    if (request.method === "POST" || request.method === "PUT") {
      const body = await request.json() as any;
      if (!body.id) return { status: 400, jsonBody: { error: "Missing 'id' field" } };
      if (!body.poId) return { status: 400, jsonBody: { error: "Missing 'poId' field (partition key)" } };
      const result = await upsertItem(CONTAINER, body);
      return { status: 200, jsonBody: result };
    }

    return { status: 405, jsonBody: { error: "Method not allowed" } };
  } catch (error: any) {
    context.error(`Tickets API error: ${error.message}`);
    return { status: 500, jsonBody: { error: error.message } };
  }
}

app.http("tickets", {
  methods: ["GET", "POST", "PUT"],
  authLevel: "anonymous",
  route: "tickets/{id?}",
  handler: ticketsHandler,
});
