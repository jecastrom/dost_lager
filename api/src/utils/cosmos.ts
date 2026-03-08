import { CosmosClient, Database, Container } from "@azure/cosmos";

// ============================================================================
// COSMOS DB CLIENT
// Reads connection string from environment (Key Vault reference in production)
// ============================================================================

const CONNECTION_STRING = process.env.COSMOS_CONNECTION || "";
const DATABASE_NAME = "procureflow-db";

// Container names matching the deployment script
export const CONTAINERS = {
  STOCK: "stock",
  ORDERS: "purchase-orders",
  RECEIPTS: "receipts",
  DELIVERY_LOGS: "delivery-logs",
  TICKETS: "tickets",
  SUPPLIERS: "suppliers",
  NOTIFICATIONS: "notifications",
  AUDITS: "audits",
  APP_SETTINGS: "app-settings",
  USER_PROFILES: "user-profiles",
  STOCK_LOGS: "stock-logs",
  AUDIT_TRAIL: "audit-trail",
} as const;

let client: CosmosClient | null = null;
let database: Database | null = null;

/**
 * Get or create the Cosmos DB client (singleton)
 */
function getClient(): CosmosClient {
  if (!client) {
    if (!CONNECTION_STRING) {
      throw new Error(
        "COSMOS_CONNECTION environment variable is not set. " +
        "Set it in local.settings.json for local dev or via Key Vault in production."
      );
    }
    client = new CosmosClient(CONNECTION_STRING);
  }
  return client;
}

/**
 * Get the database reference
 */
export function getDatabase(): Database {
  if (!database) {
    database = getClient().database(DATABASE_NAME);
  }
  return database;
}

/**
 * Get a container reference by name
 */
export function getContainer(containerName: string): Container {
  return getDatabase().container(containerName);
}

/**
 * Helper: Read all items from a container (with optional query)
 */
export async function queryItems<T>(
  containerName: string,
  query?: string,
  parameters?: { name: string; value: any }[]
): Promise<T[]> {
  const container = getContainer(containerName);

  if (query) {
    const { resources } = await container.items
      .query<T>({ query, parameters: parameters || [] })
      .fetchAll();
    return resources;
  }

  const { resources } = await container.items
    .query<T>("SELECT * FROM c")
    .fetchAll();
  return resources;
}

/**
 * Helper: Get a single item by ID
 */
export async function getItem<T>(
  containerName: string,
  id: string,
  partitionKey: string
): Promise<T | undefined> {
  try {
    const container = getContainer(containerName);
    const { resource } = await container.item(id, partitionKey).read();
    return resource as T | undefined;
  } catch (error: any) {
    if (error.code === 404) return undefined;
    throw error;
  }
}

/**
 * Helper: Create or replace an item (upsert)
 */
export async function upsertItem<T extends { id: string }>(
  containerName: string,
  item: T
): Promise<T> {
  const container = getContainer(containerName);
  const { resource } = await container.items.upsert<T>(item);
  return resource as T;
}

/**
 * Helper: Delete an item
 */
export async function deleteItem(
  containerName: string,
  id: string,
  partitionKey: string
): Promise<void> {
  const container = getContainer(containerName);
  await container.item(id, partitionKey).delete();
}

/**
 * Helper: Bulk upsert items (for seeding / batch operations)
 */
export async function bulkUpsert<T extends { id: string }>(
  containerName: string,
  items: T[]
): Promise<{ success: number; failed: number }> {
  const container = getContainer(containerName);
  let success = 0;
  let failed = 0;

  // Process in batches of 50 to avoid throttling
  const BATCH_SIZE = 50;
  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const batch = items.slice(i, i + BATCH_SIZE);
    const promises = batch.map(async (item) => {
      try {
        await container.items.upsert(item);
        success++;
      } catch {
        failed++;
      }
    });
    await Promise.all(promises);
  }

  return { success, failed };
}
