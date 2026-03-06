/**
 * ProcureFlow Offline Cache Layer (Step 5a)
 *
 * Uses IndexedDB to cache API responses for offline fallback.
 * Each collection (stock, orders, receipts, tickets) is stored
 * as individual documents keyed by their `id` field.
 * A `_meta` store tracks last-sync timestamps per collection.
 *
 * Why IndexedDB over localStorage:
 * - localStorage: ~5-10 MB limit, synchronous, blocks main thread
 * - IndexedDB: ~hundreds of MB, async, structured data, better for 800+ items
 */

const DB_NAME = 'procureflow-cache';
const DB_VERSION = 3; // v3: added audits store (Phase D)

// Collections that mirror the API
const STORES = ['stock', 'orders', 'receipts', 'tickets', 'audits'] as const;
export type CacheCollection = typeof STORES[number];

// ============================================================================
// DATABASE INITIALIZATION (shared singleton — also used by offlineQueue.ts)
// ============================================================================

let dbPromise: Promise<IDBDatabase> | null = null;

export function getDb(): Promise<IDBDatabase> {
    if (dbPromise) return dbPromise;

    dbPromise = new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;

            // Step 5a: Data cache stores
            for (const store of STORES) {
                if (!db.objectStoreNames.contains(store)) {
                    db.createObjectStore(store, { keyPath: 'id' });
                }
            }

            // Step 5a: Meta store for sync timestamps
            if (!db.objectStoreNames.contains('_meta')) {
                db.createObjectStore('_meta', { keyPath: 'collection' });
            }

            // Step 5b: Write queue store
            if (!db.objectStoreNames.contains('_writeQueue')) {
                const qStore = db.createObjectStore('_writeQueue', { keyPath: 'id' });
                qStore.createIndex('timestamp', 'timestamp', { unique: false });
            }
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => {
            console.warn('IndexedDB open failed:', request.error);
            dbPromise = null;
            reject(request.error);
        };
    });

    return dbPromise;
}

// ============================================================================
// CLEAR ALL: Wipe entire IndexedDB (logout cleanup)
// ============================================================================

export async function clearAllCaches(): Promise<void> {
    try {
        const db = await getDb();
        const storeNames: CacheCollection[] = ['stock', 'orders', 'receipts', 'tickets', 'audits'];
        const tx = db.transaction([...storeNames, '_meta', '_writeQueue'], 'readwrite');
        for (const name of [...storeNames, '_meta', '_writeQueue']) {
            tx.objectStore(name).clear();
        }
        return new Promise((resolve, reject) => {
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    } catch (err) {
        console.warn('[OfflineDB] Failed to clear all caches:', err);
    }
}

// ============================================================================
// WRITE: Cache a full collection (replaces all docs in that store)
// ============================================================================

export async function cacheCollection(collection: CacheCollection, docs: any[]): Promise<void> {
    try {
        const db = await getDb();
        const tx = db.transaction([collection, '_meta'], 'readwrite');
        const store = tx.objectStore(collection);
        const metaStore = tx.objectStore('_meta');

        // Clear old data and write new
        store.clear();
        for (const doc of docs) {
            // Ensure every doc has an `id` field for the keyPath
            if (doc.id) {
                store.put(doc);
            }
        }

        // Update sync timestamp
        metaStore.put({ collection, lastSync: Date.now() });

        return new Promise((resolve, reject) => {
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    } catch (err) {
        console.warn(`[OfflineDB] Failed to cache ${collection}:`, err);
    }
}

// ============================================================================
// READ: Get all docs from a cached collection
// ============================================================================

export async function getCachedCollection(collection: CacheCollection): Promise<any[]> {
    try {
        const db = await getDb();
        const tx = db.transaction(collection, 'readonly');
        const store = tx.objectStore(collection);
        const request = store.getAll();

        return new Promise((resolve, reject) => {
            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => reject(request.error);
        });
    } catch (err) {
        console.warn(`[OfflineDB] Failed to read ${collection}:`, err);
        return [];
    }
}

// ============================================================================
// READ: Get all cached data (mirrors loadAllData shape)
// ============================================================================

export async function getCachedAppData(): Promise<{
    stock: any[];
    orders: any[];
    receipts: any[];
    tickets: any[];
    audits: any[];
} | null> {
    try {
        const [stock, orders, receipts, tickets, audits] = await Promise.all([
            getCachedCollection('stock'),
            getCachedCollection('orders'),
            getCachedCollection('receipts'),
            getCachedCollection('tickets'),
            getCachedCollection('audits'),
        ]);

        // Only return if we actually have cached data
        const hasData = stock.length > 0 || orders.length > 0 || receipts.length > 0 || tickets.length > 0 || audits.length > 0;
        if (!hasData) return null;

        return { stock, orders, receipts, tickets, audits };
    } catch (err) {
        console.warn('[OfflineDB] Failed to read cached app data:', err);
        return null;
    }
}

// ============================================================================
// META: Get last sync timestamp for a collection
// ============================================================================

export async function getLastSyncTime(collection: CacheCollection): Promise<number | null> {
    try {
        const db = await getDb();
        const tx = db.transaction('_meta', 'readonly');
        const store = tx.objectStore('_meta');
        const request = store.get(collection);

        return new Promise((resolve, reject) => {
            request.onsuccess = () => resolve(request.result?.lastSync || null);
            request.onerror = () => reject(request.error);
        });
    } catch {
        return null;
    }
}

// ============================================================================
// META: Get overall last sync time (most recent across all collections)
// ============================================================================

export async function getOverallLastSync(): Promise<number | null> {
    try {
        const times = await Promise.all(STORES.map(s => getLastSyncTime(s)));
        const valid = times.filter((t): t is number => t !== null);
        return valid.length > 0 ? Math.max(...valid) : null;
    } catch {
        return null;
    }
}

// ============================================================================
// AUDIT DRAFT: Auto-save/load active audit session to survive page refreshes
// ============================================================================

const AUDIT_DRAFT_KEY = 'audit-draft-session';

export async function saveAuditDraft(session: any): Promise<void> {
    try {
        const db = await getDb();
        const tx = db.transaction('_meta', 'readwrite');
        tx.objectStore('_meta').put({ collection: AUDIT_DRAFT_KEY, data: JSON.stringify(session), lastSync: Date.now() });
        return new Promise((resolve, reject) => {
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    } catch (err) {
        console.warn('[OfflineDB] Failed to save audit draft:', err);
    }
}

export async function loadAuditDraft(): Promise<any | null> {
    try {
        const db = await getDb();
        const tx = db.transaction('_meta', 'readonly');
        const request = tx.objectStore('_meta').get(AUDIT_DRAFT_KEY);
        return new Promise((resolve, reject) => {
            request.onsuccess = () => {
                const result = request.result;
                if (result?.data) {
                    try { resolve(JSON.parse(result.data)); } catch { resolve(null); }
                } else {
                    resolve(null);
                }
            };
            request.onerror = () => reject(request.error);
        });
    } catch (err) {
        console.warn('[OfflineDB] Failed to load audit draft:', err);
        return null;
    }
}

export async function clearAuditDraft(): Promise<void> {
    try {
        const db = await getDb();
        const tx = db.transaction('_meta', 'readwrite');
        tx.objectStore('_meta').delete(AUDIT_DRAFT_KEY);
        return new Promise((resolve, reject) => {
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    } catch (err) {
        console.warn('[OfflineDB] Failed to clear audit draft:', err);
    }
}

// ============================================================================
// CACHE ALL: Cache the full AppData response from the API
// ============================================================================

export async function cacheAllData(data: { stock: any[]; orders: any[]; receipts: any[]; tickets: any[]; audits: any[] }): Promise<void> {
    await Promise.all([
        cacheCollection('stock', data.stock),
        cacheCollection('orders', data.orders),
        cacheCollection('receipts', data.receipts),
        cacheCollection('tickets', data.tickets),
        cacheCollection('audits', data.audits),
    ]);
}

// ============================================================================
// CLEAR: Wipe all cached data (useful for logout or manual reset)
// ============================================================================

export async function clearCache(): Promise<void> {
    try {
        const db = await getDb();
        const tx = db.transaction([...STORES, '_meta'], 'readwrite');
        for (const store of STORES) {
            tx.objectStore(store).clear();
        }
        tx.objectStore('_meta').clear();

        return new Promise((resolve, reject) => {
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    } catch (err) {
        console.warn('[OfflineDB] Failed to clear cache:', err);
    }
}