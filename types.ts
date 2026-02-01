
export interface StockItem {
  id: string;
  name: string;
  sku: string;
  system: string;
  category: string;
  stockLevel: number;
  minStock: number;
  warehouseLocation?: string;
  manufacturer?: string;
  isAkku?: boolean;
  capacityAh?: number;
  notes?: string;
  lastUpdated?: number;
  lieferscheinNr?: string;
  status?: string;
}

export interface ReceiptHeader {
  batchId: string;
  lieferscheinNr: string;
  bestellNr?: string; // Optional Order Number
  lieferdatum: string;
  lieferant: string;
  status: string;
  timestamp: number;
  itemCount: number;
  warehouseLocation?: string;
  createdByName?: string; // Tracks who entered the goods
}

export interface ReceiptItem {
  id: string; // Unique ID for this line item
  batchId: string; // FK to Header
  sku: string; // FK to Master Data
  name: string; // Snapshot of name
  quantity: number;
  targetLocation: string;
  isDamaged?: boolean;
  issueNotes?: string;
}

export interface ReceiptComment {
  id: string;
  batchId: string;
  userId: string;
  userName: string;
  timestamp: number;
  type: 'note' | 'email' | 'call';
  message: string;
}

export type ViewMode = 'grid' | 'list';
export type Theme = 'light' | 'dark';
export type ActiveModule = 'dashboard' | 'create-order' | 'goods-receipt' | 'receipt-management' | 'order-management' | 'settings' | 'documentation';

export const TRANSACTION_STATUS_OPTIONS = [
  'In Bearbeitung', 
  'Geprüft', 
  'Projekt',
  'Quarantäne', 
  'Beschädigt', 
  'Übermenge', 
  'Untermenge', 
  'Teillieferung', 
  'Reklamation', 
  'Abgelehnt', 
  'Rücklieferung', 
  'Falsch geliefert',
  'Gebucht'
];

// --- Purchase Order Types (Process-Driven Workflow) ---

export type PurchaseOrderStatus = 'Offen' | 'Teilweise geliefert' | 'Abgeschlossen' | 'Storniert';

export interface PurchaseOrderItem {
  sku: string;
  name: string;
  quantityExpected: number;
  quantityReceived: number;
}

export interface PurchaseOrder {
  id: string;
  supplier: string;
  status: PurchaseOrderStatus;
  dateCreated: string;
  expectedDeliveryDate?: string;
  items: PurchaseOrderItem[];
  pdfUrl?: string; // URL to the generated or uploaded PDF
}

// --- Case Management / Ticketing Types (Phase 4) ---

export type TicketStatus = 'Open' | 'Closed';
export type TicketPriority = 'Normal' | 'High' | 'Urgent';
export type TicketMessageType = 'user' | 'system';

export interface TicketMessage {
  id: string;
  author: string; // Name of user or 'System'
  text: string;
  timestamp: number;
  type: TicketMessageType;
}

export interface Ticket {
  id: string;
  receiptId: string; // FK to ReceiptHeader.batchId
  subject: string;
  status: TicketStatus;
  priority: TicketPriority;
  messages: TicketMessage[];
}

// --- Data Import Types (Legacy System Support) ---

export interface RawGermanItem {
  "Artikel Bezeichnung": string;
  "Artikel Nummer": string;
  "Kapazität in Ah": number | null;
  "Anzahl": number;
  "Mindestbestand": number | null;
  "System": string | null;
  "Hersteller/Lieferant": string | null;
  "Geändert": string | null;
  "Geändert von": string | null;
  "Objekt": string | null; // Maps to Location
  "Bemerkungen": string | null;
  "Elementtyp": string;
  "Pfad": string;
}