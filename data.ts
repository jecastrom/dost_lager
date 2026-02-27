import { StockItem, ReceiptHeader, ReceiptItem, ReceiptComment, PurchaseOrder, Ticket, ReceiptMaster } from './types';

// Raw data structure interface matching the JSON provided
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

// ------------------------------------------------------------------
// DATA INTEGRATION
// ------------------------------------------------------------------

const FULL_INVENTORY: RawStockItem[] = [
    { 
        "Artikel Bezeichnung": "Polkappe für Bleiakku M5/M6 Rot", 
        "Artikel Nummer": "4000069", 
        "System": "Service", 
        "Hersteller/Lieferant": "Battery Kutter",
        "Kapazität in Ah": 0, "Anzahl": 100, "Mindestbestand": 10, "Geändert": null, "Geändert von": null, "Objekt": null, "Bemerkungen": null, "Elementtyp": "Item", "Pfad": ""
    },
    { 
        "Artikel Bezeichnung": "SB12-45V0", 
        "Artikel Nummer": "2030855", 
        "System": "Service", 
        "Hersteller/Lieferant": "SUN / Battery Kutter",
        "Kapazität in Ah": 45, "Anzahl": 20, "Mindestbestand": 5, "Geändert": null, "Geändert von": null, "Objekt": null, "Bemerkungen": null, "Elementtyp": "Item", "Pfad": ""
    },
    { 
        "Artikel Bezeichnung": "SB12-2.3V0", 
        "Artikel Nummer": "2037507", 
        "System": "Service", 
        "Hersteller/Lieferant": "SUN / Battery-Kutter",
        "Kapazität in Ah": 2.3, "Anzahl": 50, "Mindestbestand": 10, "Geändert": null, "Geändert von": null, "Objekt": null, "Bemerkungen": null, "Elementtyp": "Item", "Pfad": ""
    },
    { 
        "Artikel Bezeichnung": "Brandmeldeleitung JY-(st)Y ", 
        "Artikel Nummer": "UnBEKANNT", 
        "System": "Material", 
        "Hersteller/Lieferant": "Unbekannt",
        "Kapazität in Ah": 0, "Anzahl": 200, "Mindestbestand": 50, "Geändert": null, "Geändert von": null, "Objekt": null, "Bemerkungen": null, "Elementtyp": "Item", "Pfad": ""
    },
    { 
        "Artikel Bezeichnung": "Transport Box Batterien Rot", 
        "Artikel Nummer": "Unbekannt", 
        "System": "Material", 
        "Hersteller/Lieferant": "Würth",
        "Kapazität in Ah": 0, "Anzahl": 15, "Mindestbestand": 2, "Geändert": null, "Geändert von": null, "Objekt": null, "Bemerkungen": null, "Elementtyp": "Item", "Pfad": ""
    }
];

// Helper to parse ASP.NET AJAX Date format "/Date(1732871995000)/"
const parseAspDate = (dateStr: string | null): number | undefined => {
  if (!dateStr) return undefined;
  const match = dateStr.match(/\/Date\((\d+)\)\//);
  return match ? parseInt(match[1]) : undefined;
};

export const MOCK_ITEMS: StockItem[] = FULL_INVENTORY.map((raw, index) => {
  return {
    id: raw["Artikel Nummer"] || `generated-id-${index}`,
    name: raw["Artikel Bezeichnung"],
    sku: raw["Artikel Nummer"],
    system: raw["System"] || "Sonstiges",
    category: "Material",
    stockLevel: raw["Anzahl"],
    minStock: raw["Mindestbestand"] || 0,
    warehouseLocation: raw["Objekt"] || undefined,
    manufacturer: raw["Hersteller/Lieferant"] || undefined,
    isAkku: raw["Kapazität in Ah"] !== null && raw["Kapazität in Ah"] !== undefined && raw["Kapazität in Ah"] > 0,
    capacityAh: raw["Kapazität in Ah"] || undefined,
    notes: raw["Bemerkungen"] || undefined,
    lastUpdated: parseAspDate(raw["Geändert"]),
    status: "Active"
  };
});

export const MOCK_RECEIPT_HEADERS: ReceiptHeader[] = [];

export const MOCK_RECEIPT_ITEMS: ReceiptItem[] = [];

export const MOCK_COMMENTS: ReceiptComment[] = [];

// ------------------------------------------------------------------
// PROCESS-DRIVEN WORKFLOW MOCK DATA (PHASE 1)
// ------------------------------------------------------------------

export const MOCK_PURCHASE_ORDERS: PurchaseOrder[] = [];

export const MOCK_RECEIPT_MASTERS: ReceiptMaster[] = [];

// ------------------------------------------------------------------
// CASE MANAGEMENT MOCK DATA (PHASE 4)
// ------------------------------------------------------------------

export const MOCK_TICKETS: Ticket[] = [];
