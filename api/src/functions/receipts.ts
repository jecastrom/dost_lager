import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { CONTAINERS, getContainer, queryItems, upsertItem } from "../utils/cosmos.js";

const CONTAINER = CONTAINERS.RECEIPTS;

/**
 * The receipts container stores multiple document types, distinguished by a "docType" field:
 *   - "master"   → ReceiptMaster (partition key: poId)
 *   - "header"   → ReceiptHeader (partition key: poId via bestellNr)
 *   - "item"     → ReceiptItem   (partition key: poId via lookup)
 *   - "comment"  → ReceiptComment (partition key: poId via lookup)
 *
 * GET /api/receipts                    → All receipt documents
 * GET /api/receipts?poId=PO-001       → All receipts for a specific PO
 * GET /api/receipts?docType=master    → All receipt masters
 * POST /api/receipts                   → Upsert a receipt document
 * POST /api/receipts/bulk              → Bulk upsert multiple documents
 */
async function receiptsHandler(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  try {
    const url = new URL(request.url);
    const poId = url.searchParams.get("poId");
    const docType = url.searchParams.get("docType");

    // GET
    if (request.method === "GET") {
      let query = "SELECT * FROM c";
      const params: { name: string; value: any }[] = [];

      if (poId && docType) {
        query = "SELECT * FROM c WHERE c.poId = @poId AND c.docType = @docType";
        params.push({ name: "@poId", value: poId });
        params.push({ name: "@docType", value: docType });
      } else if (poId) {
        query = "SELECT * FROM c WHERE c.poId = @poId";
        params.push({ name: "@poId", value: poId });
      } else if (docType) {
        query = "SELECT * FROM c WHERE c.docType = @docType";
        params.push({ name: "@docType", value: docType });
      }

      const items = await queryItems(CONTAINER, query, params);
      return { status: 200, jsonBody: items };
    }

    // POST
    if (request.method === "POST") {
      // Check if it's a bulk operation
      const pathParts = url.pathname.split("/");
      const isBulk = pathParts[pathParts.length - 1] === "bulk";

      if (isBulk) {
        const body = await request.json() as any[];
        if (!Array.isArray(body)) {
          return { status: 400, jsonBody: { error: "Bulk endpoint expects an array" } };
        }

        const container = getContainer(CONTAINER);
        let success = 0;
        let failed = 0;

        for (const doc of body) {
          try {
            if (!doc.id || !doc.poId) {
              failed++;
              continue;
            }
            await container.items.upsert(doc);
            success++;
          } catch {
            failed++;
          }
        }

        return { status: 200, jsonBody: { success, failed, total: body.length } };
      }

      // Single upsert
      const body = await request.json() as any;
      if (!body.id) return { status: 400, jsonBody: { error: "Missing 'id' field" } };
      if (!body.poId) return { status: 400, jsonBody: { error: "Missing 'poId' field (partition key)" } };
      const result = await upsertItem(CONTAINER, body);
      return { status: 200, jsonBody: result };
    }

    return { status: 405, jsonBody: { error: "Method not allowed" } };
  } catch (error: any) {
    context.error(`Receipts API error: ${error.message}`);
    return { status: 500, jsonBody: { error: error.message } };
  }
}

app.http("receipts", {
  methods: ["GET", "POST"],
  authLevel: "anonymous",
  route: "receipts/{*path}",
  handler: receiptsHandler,
});
