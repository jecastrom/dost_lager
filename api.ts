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
  const method = options?.method || 'GET';
  const body = options?.body as string | undefined;

  try {
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
  } catch (error) {
    // Queue write operations if it's a network failure (not a server error)
    // Detection: TypeError from fetch (message varies by browser — "Load failed" on Safari,
    // "Failed to fetch" on Chrome, "NetworkError" on Firefox), OR device reports offline
    const isNetworkError = !navigator.onLine
      || (error instanceof TypeError && (
        error.message.includes('fetch')
        || error.message.includes('Load failed')
        || error.message.includes('network')
        || error.message.includes('internet')
        || error.message.includes('NetworkError')
      ));
    const isWriteOp = method !== 'GET';

    if (isNetworkError && isWriteOp) {
      await enqueueWrite(path, method, body || null).catch(console.warn);
      console.info(`[API] Write queued for offline sync: ${method} ${path}`);
      // Return undefined so the optimistic UI stays intact
      return undefined as T;
    }

    throw error;
  }
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

export const auditsApi = {
  getAll: () => apiFetch<any[]>('/audits'),
  getByStatus: (status: string) => apiFetch<any[]>(`/audits?status=${encodeURIComponent(status)}`),
  getByCreator: (userId: string) => apiFetch<any[]>(`/audits?createdBy=${encodeURIComponent(userId)}`),
  getById: (id: string) => apiFetch<any>(`/audits/${encodeURIComponent(id)}`),
  upsert: (session: any) => apiFetch<any>('/audits', { method: 'POST', body: JSON.stringify(session) }),
  delete: (id: string) => apiFetch<void>(`/audits/${encodeURIComponent(id)}`, { method: 'DELETE' }),
};

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
  audits: any[];
}

import { cacheAllData, getCachedAppData } from './offlineDb';
import { enqueueWrite } from './offlineQueue';

/**
 * Fetch all data needed for app initialization.
 * Returns null if API is unreachable (triggers fallback to local data).
 */
export type DataSource = 'api' | 'cache' | 'mock';

export interface LoadResult {
  data: AppData;
  source: DataSource;
}

/**
 * Fetch all data needed for app initialization.
 * 
 * Strategy:
 * 1. Try API → cache response in IndexedDB → return { source: 'api' }
 * 2. If API fails → try IndexedDB cache → return { source: 'cache' }
 * 3. If cache empty → return null (caller falls back to mock data)
 */
export async function loadAllData(): Promise<LoadResult | null> {
  // Attempt 1: Live API
  try {
    const [stock, orders, receipts, tickets, audits] = await Promise.all([
      stockApi.getAll(),
      ordersApi.getAll(),
      receiptsApi.getAll(),
      ticketsApi.getAll(),
      auditsApi.getAll(),
    ]);

    const data: AppData = {
      stock: cleanDocs(stock),
      orders: cleanDocs(orders),
      receipts: cleanDocs(receipts),
      tickets: cleanDocs(tickets),
      audits: cleanDocs(audits),
    };

    // Cache in IndexedDB for offline fallback (fire-and-forget)
    cacheAllData(data).catch(err => console.warn('[Cache] Failed to cache API data:', err));

    return { data, source: 'api' };
  } catch (error) {
    console.warn('API unreachable — trying IndexedDB cache:', error);
  }

  // Attempt 2: IndexedDB cache
  try {
    const cached = await getCachedAppData();
    if (cached) {
      console.info('[Cache] Loaded from IndexedDB cache');
      return { data: cached, source: 'cache' };
    }
  } catch (err) {
    console.warn('[Cache] IndexedDB read failed:', err);
  }

  // Attempt 3: Nothing — caller uses mock data
  return null;
}
