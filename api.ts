/**
 * ProcureFlow API Service Layer
 * 
 * Handles all communication with the Azure Functions backend.
 * Falls back gracefully if API is unreachable (offline mode).
 */

const API_BASE = '/api';

/** Strip Cosmos DB metadata fields from documents */
function cleanDoc<T>(doc: any): T {
  if (!doc || typeof doc !== 'object') return doc;
  const { _rid, _self, _etag, _attachments, _ts, ...clean } = doc;
  return clean as T;
}

function cleanDocs<T>(docs: any[]): T[] {
  return docs.map(d => cleanDoc<T>(d));
}

// ============================================================================
// GENERIC FETCH HELPER
// ============================================================================

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.error || `API error: ${response.status}`);
  }

  // 204 No Content (e.g., DELETE)
  if (response.status === 204) return undefined as T;

  return response.json();
}

// ============================================================================
// STOCK (Inventory)
// ============================================================================

export const stockApi = {
  getAll: () => apiFetch<any[]>('/stock'),
  getById: (id: string) => apiFetch<any>(`/stock/${encodeURIComponent(id)}`),
  upsert: (item: any) => apiFetch<any>('/stock', { method: 'POST', body: JSON.stringify(item) }),
  delete: (id: string) => apiFetch<void>(`/stock/${encodeURIComponent(id)}`, { method: 'DELETE' }),
};

// ============================================================================
// ORDERS (Purchase Orders)
// ============================================================================

export const ordersApi = {
  getAll: () => apiFetch<any[]>('/orders'),
  getById: (id: string) => apiFetch<any>(`/orders/${encodeURIComponent(id)}`),
  upsert: (order: any) => apiFetch<any>('/orders', { method: 'POST', body: JSON.stringify(order) }),
  delete: (id: string) => apiFetch<void>(`/orders/${encodeURIComponent(id)}`, { method: 'DELETE' }),
};

// ============================================================================
// RECEIPTS (Masters, Headers, Items, Comments)
// ============================================================================

export const receiptsApi = {
  getAll: () => apiFetch<any[]>('/receipts'),
  getByPoId: (poId: string) => apiFetch<any[]>(`/receipts?poId=${encodeURIComponent(poId)}`),
  getByDocType: (docType: string) => apiFetch<any[]>(`/receipts?docType=${docType}`),
  upsert: (doc: any) => apiFetch<any>('/receipts', { method: 'POST', body: JSON.stringify(doc) }),
  bulkUpsert: (docs: any[]) => apiFetch<{ success: number; failed: number; total: number }>(
    '/receipts/bulk', { method: 'POST', body: JSON.stringify(docs) }
  ),
};

// ============================================================================
// TICKETS
// ============================================================================

export const ticketsApi = {
  getAll: () => apiFetch<any[]>('/tickets'),
  getByPoId: (poId: string) => apiFetch<any[]>(`/tickets?poId=${encodeURIComponent(poId)}`),
  getById: (id: string) => apiFetch<any>(`/tickets/${encodeURIComponent(id)}`),
  upsert: (ticket: any) => apiFetch<any>('/tickets', { method: 'POST', body: JSON.stringify(ticket) }),
};

// ============================================================================
// DELIVERY LOGS
// ============================================================================

export const deliveryLogsApi = {
  getAll: () => apiFetch<any[]>('/delivery-logs'),
  getByReceiptId: (receiptId: string) => apiFetch<any[]>(`/delivery-logs?receiptId=${encodeURIComponent(receiptId)}`),
  upsert: (log: any) => apiFetch<any>('/delivery-logs', { method: 'POST', body: JSON.stringify(log) }),
};

// ============================================================================
// SUPPLIERS
// ============================================================================

export const suppliersApi = {
  getAll: () => apiFetch<any[]>('/suppliers'),
  getById: (id: string) => apiFetch<any>(`/suppliers/${encodeURIComponent(id)}`),
  upsert: (supplier: any) => apiFetch<any>('/suppliers', { method: 'POST', body: JSON.stringify(supplier) }),
  delete: (id: string) => apiFetch<void>(`/suppliers/${encodeURIComponent(id)}`, { method: 'DELETE' }),
};

// ============================================================================
// HEALTH CHECK
// ============================================================================

export const healthApi = {
  check: () => apiFetch<{ status: string; database: string; timestamp: string }>('/health'),
};

// ============================================================================
// LOAD ALL DATA (Initial App Boot)
// ============================================================================

export interface AppData {
  stock: any[];
  orders: any[];
  receipts: any[];
  tickets: any[];
}

/**
 * Fetch all data needed for app initialization.
 * Returns null if API is unreachable (triggers fallback to local data).
 */
export async function loadAllData(): Promise<AppData | null> {
  try {
    const [stock, orders, receipts, tickets] = await Promise.all([
      stockApi.getAll(),
      ordersApi.getAll(),
      receiptsApi.getAll(),
      ticketsApi.getAll(),
    ]);

    return {
      stock: cleanDocs(stock),
      orders: cleanDocs(orders),
      receipts: cleanDocs(receipts),
      tickets: cleanDocs(tickets),
    };
  } catch (error) {
    console.warn('API unreachable — using local fallback data:', error);
    return null;
  }
}
