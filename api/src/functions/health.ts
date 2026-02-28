import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { getDatabase } from "../utils/cosmos.js";

/**
 * GET /api/health
 * Simple health check — verifies API is running and Cosmos DB is reachable
 */
async function health(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  context.log("Health check requested");

  try {
    // Test Cosmos DB connectivity
    const db = getDatabase();
    await db.read();

    return {
      status: 200,
      jsonBody: {
        status: "healthy",
        database: "connected",
        timestamp: new Date().toISOString(),
      },
    };
  } catch (error: any) {
    context.error("Health check failed:", error.message);

    return {
      status: 503,
      jsonBody: {
        status: "unhealthy",
        database: "disconnected",
        error: error.message,
        timestamp: new Date().toISOString(),
      },
    };
  }
}

app.http("health", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "health",
  handler: health,
});
