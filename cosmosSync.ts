// ============================================================================
// COSMOS SYNC UTILITY
// Fire-and-forget writes to Cosmos DB with localStorage fallback.
// Reads return Cosmos data or null (caller falls back to localStorage).
// ============================================================================

const API_BASE = '/api';

// ── Helpers ──

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return await res.json() as T;
  } catch {
    return null; // Offline or error — caller uses localStorage
  }
}

async function putJson(url: string, body: unknown): Promise<boolean> {
  try {
    const res = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return res.ok;
  } catch {
    return false; // Offline — localStorage already saved by caller
  }
}

async function postJson(url: string, body: unknown): Promise<boolean> {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// ============================================================================
// APP SETTINGS (org-wide)
// ============================================================================

interface AppSettingDoc {
  id: string;
  settingId: string;
  data: unknown;
  updatedAt: number;
}

/** Load all org-wide settings in one call */
export async function loadAllAppSettings(): Promise<Record<string, unknown>> {
  const docs = await fetchJson<AppSettingDoc[]>(`${API_BASE}/app-settings`);
  if (!docs || !Array.isArray(docs)) return {};
  const map: Record<string, unknown> = {};
  for (const doc of docs) {
    map[doc.id] = doc.data;
  }
  return map;
}

/** Save a single org-wide setting */
export async function syncAppSetting(key: string, data: unknown): Promise<boolean> {
  return putJson(`${API_BASE}/app-settings?key=${encodeURIComponent(key)}`, { data });
}

// ============================================================================
// USER PREFS (per-user)
// ============================================================================

export interface UserPrefsData {
  themePreference: string;
  inventoryViewMode: string;
  notifications: unknown[];
  updatedAt: number;
}

/** Load user preferences */
export async function loadUserPrefs(userId: string): Promise<UserPrefsData | null> {
  return fetchJson<UserPrefsData>(`${API_BASE}/user-prefs?userId=${encodeURIComponent(userId)}`);
}

/** Partial-update user preferences */
export async function syncUserPrefs(userId: string, prefs: Partial<UserPrefsData>): Promise<boolean> {
  return putJson(`${API_BASE}/user-prefs?userId=${encodeURIComponent(userId)}`, prefs);
}

// ============================================================================
// STOCK LOGS (event log)
// ============================================================================

/** Load stock logs (paginated, newest first) */
export async function loadStockLogs(limit = 500): Promise<unknown[] | null> {
  const result = await fetchJson<{ items: unknown[] }>(`${API_BASE}/stock-logs?limit=${limit}`);
  return result?.items ?? null;
}

/** Append one stock log entry */
export async function appendStockLog(entry: unknown): Promise<boolean> {
  return postJson(`${API_BASE}/stock-logs`, entry);
}

// ============================================================================
// AUDIT TRAIL (event log)
// ============================================================================

/** Load audit trail (paginated, newest first) */
export async function loadAuditTrail(limit = 500): Promise<unknown[] | null> {
  const result = await fetchJson<{ items: unknown[] }>(`${API_BASE}/audit-trail?limit=${limit}`);
  return result?.items ?? null;
}

/** Append one audit trail entry */
export async function appendAuditEntry(entry: unknown): Promise<boolean> {
  return postJson(`${API_BASE}/audit-trail`, entry);
}