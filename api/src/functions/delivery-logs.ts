import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { CONTAINERS, queryItems, getItem, upsertItem } from "../utils/cosmos.js";

const CONTAINER = CONTAINERS.DELIVERY_LOGS;

/**
 * GET /api/delivery-logs                        → All delivery logs
 * GET /api/delivery-logs?receiptId=RM-001       → Logs for a specific receipt
 * GET /api/delivery-logs/:id                    → Single log
 * POST /api/delivery-logs                       → Create/update a delivery log
 */
async function deliveryLogsHandler(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  try {
    const id = request.params.id;
    const url = new URL(request.url);
    const receiptId = url.searchParams.get("receiptId");

    // GET
    if (request.method === "GET") {
      if (id) {
        const item = await getItem(CONTAINER, id, id);
        if (!item) return { status: 404, jsonBody: { error: "Delivery log not found" } };
        return { status: 200, jsonBody: item };
      }

      if (receiptId) {
        const items = await queryItems(
          CONTAINER,
          "SELECT * FROM c WHERE c.receiptId = @receiptId",
          [{ name: "@receiptId", value: receiptId }]
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
      if (!body.receiptId) return { status: 400, jsonBody: { error: "Missing 'receiptId' field (partition key)" } };
      const result = await upsertItem(CONTAINER, body);
      return { status: 200, jsonBody: result };
    }

    return { status: 405, jsonBody: { error: "Method not allowed" } };
  } catch (error: any) {
    context.error(`Delivery Logs API error: ${error.message}`);
    return { status: 500, jsonBody: { error: error.message } };
  }
}

app.http("deliveryLogs", {
  methods: ["GET", "POST", "PUT"],
  authLevel: "anonymous",
  route: "delivery-logs/{id?}",
  handler: deliveryLogsHandler,
});
