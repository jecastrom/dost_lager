/**
 * ProcureFlow - Cosmos DB Seed Script
 * Uploads warehouse-inventory.json into the "stock" container
 * 
 * Usage:
 *   cd api
 *   npx ts-node src/scripts/seed-inventory.ts
 * 
 * Requires COSMOS_CONNECTION env var or reads from local.settings.json
 */

import { CosmosClient } from "@azure/cosmos";
import * as fs from "fs";
import * as path from "path";

// ============================================================================
// CONFIGURATION
// ============================================================================
const DATABASE_NAME = "procureflow-db";
const CONTAINER_NAME = "stock";
const BATCH_SIZE = 50;

// Raw data shape from SharePoint export
interface RawStockItem {
    "Artikel Bezeichnung": string;
    "Artikel Nummer": string;
    "Kapazität in Ah": number | null;
    "Anzahl": number;
    "Mindestbestand": number | null;
    "System": string | null;
    "Hersteller/Lieferant": string | null;
    "Geändert": string | null;
    "Geändert von": string | null;
    "Objekt": string | null;
    "Bemerkungen": string | null;
    "Elementtyp": string;
    "Pfad": string;
}

// Target shape for Cosmos DB
interface StockDocument {
    id: string;
    name: string;
    sku: string;
    system: string;
    category: string;
    stockLevel: number;
    minStock: number;
    warehouseLocation: string | null;
    manufacturer: string | null;
    isAkku: boolean;
    capacityAh: number | null;
    packUnits: number;
    notes: string | null;
    lastUpdated: number | null;
    status: string;
}

// ============================================================================
// HELPERS
// ============================================================================

/** Parse ASP.NET AJAX Date format "/Date(1732871995000)/" */
function parseAspDate(dateStr: string | null): number | null {
    if (!dateStr) return null;
    const match = dateStr.match(/\/Date\((\d+)\)\//);
    return match ? parseInt(match[1]) : null;
}

/** Map raw SharePoint item → Cosmos DB document */
function mapItem(raw: RawStockItem, index: number): StockDocument {
    return {
        id: (raw["Artikel Nummer"] || `generated-id-${index}`).replace(/[\/\\?#]/g, "_"),
        name: raw["Artikel Bezeichnung"] || "Unbekannter Artikel",
        sku: raw["Artikel Nummer"] || "UNKNOWN",
        system: raw["System"] || "Sonstiges",
        category: "Material",
        stockLevel: typeof raw["Anzahl"] === "number" ? raw["Anzahl"] : 0,
        minStock: typeof raw["Mindestbestand"] === "number" ? raw["Mindestbestand"] : 0,
        warehouseLocation: raw["Objekt"] || null,
        manufacturer: raw["Hersteller/Lieferant"] || null,
        isAkku:
            raw["Kapazität in Ah"] !== null &&
            raw["Kapazität in Ah"] !== undefined &&
            raw["Kapazität in Ah"] > 0,
        capacityAh: raw["Kapazität in Ah"] || null,
        packUnits: 1, // Default — real values added later in production
        notes: raw["Bemerkungen"] || null,
        lastUpdated: parseAspDate(raw["Geändert"]),
        status: "Active",
    };
}

/** Get connection string from env or local.settings.json */
function getConnectionString(): string {
    // Check environment variable first
    if (process.env.COSMOS_CONNECTION) {
        return process.env.COSMOS_CONNECTION;
    }

    // Fall back to local.settings.json
    const settingsPath = path.join(__dirname, "../../local.settings.json");
    if (fs.existsSync(settingsPath)) {
        const settings = JSON.parse(fs.readFileSync(settingsPath, "utf-8"));
        if (settings.Values?.COSMOS_CONNECTION) {
            return settings.Values.COSMOS_CONNECTION;
        }
    }

    throw new Error(
        "No connection string found.\n" +
        "Set COSMOS_CONNECTION env var or update api/local.settings.json"
    );
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
    console.log("");
    console.log("╔══════════════════════════════════════════════════╗");
    console.log("║  ProcureFlow — Cosmos DB Seed Script             ║");
    console.log("╚══════════════════════════════════════════════════╝");
    console.log("");

    // 1. Load JSON file
    const jsonPath = path.join(__dirname, "../../../data/warehouse-inventory.json");
    if (!fs.existsSync(jsonPath)) {
        console.error(`✗ File not found: ${jsonPath}`);
        console.error("  Make sure data/warehouse-inventory.json exists in the project root.");
        process.exit(1);
    }

    let fileContent = fs.readFileSync(jsonPath, "utf-8");
    // Strip BOM if present (common in SharePoint/Windows exports)
    if (fileContent.charCodeAt(0) === 0xFEFF) {
        fileContent = fileContent.slice(1);
    }
    const rawData: RawStockItem[] = JSON.parse(fileContent);
    console.log(`  ✓ Loaded ${rawData.length} raw items`);

    // 2. Map to Cosmos DB documents
    const documents = rawData.map(mapItem);
    console.log(`  ✓ Mapped ${documents.length} documents`);

    // Check for duplicate IDs
    const ids = documents.map((d) => d.id);
    const duplicates = ids.filter((id, i) => ids.indexOf(id) !== i);
    if (duplicates.length > 0) {
        console.log(`  ⚠ Found ${duplicates.length} duplicate IDs — they will be overwritten (last wins):`);
        const uniqueDupes = [...new Set(duplicates)];
        uniqueDupes.slice(0, 10).forEach((d) => console.log(`    - ${d}`));
        if (uniqueDupes.length > 10) console.log(`    ... and ${uniqueDupes.length - 10} more`);
    }

    // 3. Connect to Cosmos DB
    const connectionString = getConnectionString();
    console.log(`  ℹ Connecting to Cosmos DB...`);
    const client = new CosmosClient(connectionString);
    const database = client.database(DATABASE_NAME);
    const container = database.container(CONTAINER_NAME);

    // Verify container exists
    try {
        await container.read();
        console.log(`  ✓ Container '${CONTAINER_NAME}' found`);
    } catch (err: any) {
        if (err.code === 404) {
            console.error(`  ✗ Container '${CONTAINER_NAME}' not found in database '${DATABASE_NAME}'`);
            console.error("    Run the deployment script first to create containers.");
            process.exit(1);
        }
        throw err;
    }

    // 4. Upload in batches
    console.log(`  ℹ Uploading ${documents.length} items in batches of ${BATCH_SIZE}...`);
    let success = 0;
    let failed = 0;
    let skipped = 0;

    for (let i = 0; i < documents.length; i += BATCH_SIZE) {
        const batch = documents.slice(i, i + BATCH_SIZE);
        const batchNum = Math.floor(i / BATCH_SIZE) + 1;
        const totalBatches = Math.ceil(documents.length / BATCH_SIZE);

        const promises = batch.map(async (doc) => {
            try {
                await container.items.upsert(doc);
                success++;
            } catch (err: any) {
                failed++;
                console.error(`    ✗ Failed to upsert '${doc.id}': ${err.message}`);
            }
        });

        await Promise.all(promises);
        const pct = Math.round(((i + batch.length) / documents.length) * 100);
        process.stdout.write(`\r  ⏳ Batch ${batchNum}/${totalBatches} — ${pct}% (${success} ok, ${failed} failed)`);
    }

    console.log(""); // New line after progress
    console.log("");
    console.log("  ══════════════════════════════════════════════════");
    console.log(`  ✓ Upload complete`);
    console.log(`    Total:   ${documents.length}`);
    console.log(`    Success: ${success}`);
    console.log(`    Failed:  ${failed}`);
    console.log("  ══════════════════════════════════════════════════");
    console.log("");
}

main().catch((err) => {
    console.error("  ✗ Seed script failed:", err.message);
    process.exit(1);
});
