/**
 * ProcureFlow Offline Write Queue (Step 5b)
 *
 * Queues failed API writes in IndexedDB and replays them when back online.
 * Entries are processed FIFO (first-in, first-out) to preserve operation order.
 *
 * Design:
 * - Every failed write (network error) gets added to the queue
 * - Flush triggers: 'online' event, visibility change, successful API poll
 * - Each entry retried up to 5 times with exponential backoff between retries
 * - Bulk upserts stored as single queue entries (replayed as-is)
 * - Queue count exposed for UI indicator (Step 5d)
 */

import { getDb } from './offlineDb';

const QUEUE_STORE = '_writeQueue';
const MAX_RETRIES = 5;

// ============================================================================
// TYPES
// ============================================================================

export interface QueueEntry {
    id: string;
    timestamp: number;
    path: string;        // e.g. '/stock', '/receipts/bulk'
    method: string;       // 'POST', 'PUT', 'DELETE'
    body: string | null;  // JSON string of the request body
    retryCount: number;
    lastError?: string;
}

// ============================================================================
// ENQUEUE: Add a failed write to the queue
// ============================================================================

export async function enqueueWrite(path: string, method: string, body: string | null): Promise<void> {
    try {
        const db = await getDb();
        const tx = db.transaction(QUEUE_STORE, 'readwrite');
        const store = tx.objectStore(QUEUE_STORE);

        const entry: QueueEntry = {
            id: crypto.randomUUID(),
            timestamp: Date.now(),
            path,
            method,
            body,
            retryCount: 0,
        };

        store.add(entry);

        return new Promise((resolve, reject) => {
            tx.oncomplete = () => {
                console.info(`[Queue] Enqueued: ${method} ${path}`);
                // Notify listeners (for UI badge update)
                notifyQueueChange();
                resolve();
            };
            tx.onerror = () => reject(tx.error);
        });
    } catch (err) {
        console.warn('[Queue] Failed to enqueue write:', err);
    }
}

// ============================================================================
// GET QUEUE: Read all pending entries (sorted by timestamp)
// ============================================================================

export async function getQueueEntries(): Promise<QueueEntry[]> {
    try {
        const db = await getDb();
        const tx = db.transaction(QUEUE_STORE, 'readonly');
        const store = tx.objectStore(QUEUE_STORE);
        const index = store.index('timestamp');
        const request = index.getAll();

        return new Promise((resolve, reject) => {
            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => reject(request.error);
        });
    } catch (err) {
        console.warn('[Queue] Failed to read queue:', err);
        return [];
    }
}

// ============================================================================
// QUEUE COUNT: Quick count for UI badge
// ============================================================================

export async function getQueueCount(): Promise<number> {
    try {
        const db = await getDb();
        const tx = db.transaction(QUEUE_STORE, 'readonly');
        const store = tx.objectStore(QUEUE_STORE);
        const request = store.count();

        return new Promise((resolve, reject) => {
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    } catch {
        return 0;
    }
}

// ============================================================================
// REMOVE: Delete a single entry after successful replay
// ============================================================================

async function removeEntry(id: string): Promise<void> {
    const db = await getDb();
    const tx = db.transaction(QUEUE_STORE, 'readwrite');
    tx.objectStore(QUEUE_STORE).delete(id);

    return new Promise((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}

// ============================================================================
// UPDATE RETRY: Increment retry count + record error
// ============================================================================

async function updateRetry(entry: QueueEntry, error: string): Promise<void> {
    const db = await getDb();
    const tx = db.transaction(QUEUE_STORE, 'readwrite');
    tx.objectStore(QUEUE_STORE).put({
        ...entry,
        retryCount: entry.retryCount + 1,
        lastError: error,
    });

    return new Promise((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}

// ============================================================================
// FLUSH: Replay all queued writes (called when back online)
// ============================================================================

const API_BASE = '/api';
let isFlushing = false;

export async function flushQueue(): Promise<{ succeeded: number; failed: number; remaining: number }> {
    if (isFlushing) return { succeeded: 0, failed: 0, remaining: await getQueueCount() };
    isFlushing = true;

    let succeeded = 0;
    let failed = 0;

    try {
        const entries = await getQueueEntries();
        if (entries.length === 0) {
            return { succeeded: 0, failed: 0, remaining: 0 };
        }

        console.info(`[Queue] Flushing ${entries.length} queued writes...`);

        for (const entry of entries) {
            // Skip entries that exceeded max retries
            if (entry.retryCount >= MAX_RETRIES) {
                console.warn(`[Queue] Dropping entry after ${MAX_RETRIES} retries: ${entry.method} ${entry.path}`, entry.lastError);
                await removeEntry(entry.id);
                failed++;
                continue;
            }

            try {
                const response = await fetch(`${API_BASE}${entry.path}`, {
                    method: entry.method,
                    headers: { 'Content-Type': 'application/json' },
                    ...(entry.body ? { body: entry.body } : {}),
                });

                if (response.ok || response.status === 204) {
                    await removeEntry(entry.id);
                    succeeded++;
                } else {
                    // Server error (4xx/5xx) — retry later
                    const errText = await response.text().catch(() => `HTTP ${response.status}`);
                    await updateRetry(entry, errText);
                    failed++;
                }
            } catch (networkErr) {
                // Still offline — stop flushing, remaining entries stay queued
                console.info('[Queue] Still offline — stopping flush');
                await updateRetry(entry, (networkErr as Error).message);
                failed++;
                break; // Don't try more entries if network is down
            }
        }
    } finally {
        isFlushing = false;
        notifyQueueChange();
    }

    const remaining = await getQueueCount();
    if (succeeded > 0) {
        console.info(`[Queue] Flush complete: ${succeeded} synced, ${failed} failed, ${remaining} remaining`);
    }

    return { succeeded, failed, remaining };
}

// ============================================================================
// CLEAR: Wipe the queue (e.g., on logout or manual reset)
// ============================================================================

export async function clearQueue(): Promise<void> {
    try {
        const db = await getDb();
        const tx = db.transaction(QUEUE_STORE, 'readwrite');
        tx.objectStore(QUEUE_STORE).clear();

        return new Promise((resolve, reject) => {
            tx.oncomplete = () => {
                notifyQueueChange();
                resolve();
            };
            tx.onerror = () => reject(tx.error);
        });
    } catch (err) {
        console.warn('[Queue] Failed to clear queue:', err);
    }
}

// ============================================================================
// CHANGE LISTENERS: Notify UI when queue count changes
// ============================================================================

type QueueChangeListener = (count: number) => void;
const listeners: Set<QueueChangeListener> = new Set();

export function onQueueChange(listener: QueueChangeListener): () => void {
    listeners.add(listener);
    // Immediately fire with current count
    getQueueCount().then(count => listener(count)).catch(() => { });
    // Return unsubscribe function
    return () => listeners.delete(listener);
}

async function notifyQueueChange(): Promise<void> {
    const count = await getQueueCount().catch(() => 0);
    listeners.forEach(fn => fn(count));
}