# ProcureFlow — Cloud Migration Status
## Date: 2026-03-04

---

## ARCHITECTURE OVERVIEW

**App:** ProcureFlow (aka "DOST Lager") — German warehouse management PWA
**Stack:** React 19/TypeScript + Vite (frontend), Azure Functions v4 (API), Azure Cosmos DB (database)
**Hosting:** Azure Static Web Apps (free tier) with managed Functions
**Live URL:** https://mango-beach-0bdbc9710.1.azurestaticapps.net
**Repo:** github.com/jecastrom/dost_lager (private, master branch)
**Subscription:** Pay_Go_Dost_Project (20fb7306-d8e2-4ffb-bb7e-e80744d0a078)
**Resource Group:** rg-procureflow-prod (West Europe)
**Version:** v0.4.0

### Azure Resources
- **SWA:** swa-procureflow (free tier, deploys via GitHub Actions)
- **Cosmos DB:** cosmos-procureflow (free tier, database: procureflow-db)
- **Key Vault:** kv-procureflow (stores connection string)
- **Entra ID:** (provisioned, not yet used for auth)

### Cosmos DB Containers (all created)
| Container | Partition Key | Content |
|---|---|---|
| stock | /id | Inventory items (795 seeded) |
| purchase-orders | /id | Purchase orders |
| receipts | /poId | ReceiptMasters, ReceiptHeaders, ReceiptItems, ReceiptComments (distinguished by docType field) |
| tickets | /poId | Tickets (case management) |
| delivery-logs | /receiptId | Delivery logs |
| suppliers | /id | Supplier data |
| notifications | /userId | (future use) |

---

## MIGRATION PLAN (Path B: Multi-User Backend)

### ✅ STEP 1: API Foundation (COMPLETE)
- Created `api/` folder with Azure Functions v4 project
- TypeScript compilation issues resolved (unknown→any, generic constraints)
- `api/src/utils/cosmos.ts` — Cosmos DB client singleton with helpers (queryItems, getItem, upsertItem, deleteItem, bulkUpsert)
- `api/src/functions/health.ts` — GET /api/health (tests DB connectivity)
- GitHub Actions workflow updated: `api_location: "api"` in `.github/workflows/azure-static-web-apps-mango-beach-0bdbc9710.yml`
- `staticwebapp.config.json` — navigation fallback, API routing
- COSMOS_CONNECTION set as SWA app setting (reads from Key Vault in production)
- **Verified:** /api/health returns `{"status":"healthy","database":"connected"}`

### ✅ STEP 2: Seed Script (COMPLETE)
- `api/src/scripts/seed-inventory.ts` — uploads warehouse-inventory.json to Cosmos DB
- Maps SharePoint export fields → StockItem interface
- BOM stripping for Windows/SharePoint exports
- Illegal character fix: `/` replaced with `_` in document IDs
- **Result:** 795 items uploaded, 0 failures
- **Run command:** `cd api && $env:COSMOS_CONNECTION=$conn && npx ts-node --project tsconfig.seed.json src/scripts/seed-inventory.ts`
- Helper config: `api/tsconfig.seed.json` (extends tsconfig with module: commonjs)
- **Known issue:** 182 duplicate Artikel Nummer values (Unbekannt, ?, Geheim, etc.) — Cosmos keeps last-write-wins (~613 unique docs). To be addressed in production data cleanup phase.

### ✅ STEP 3: CRUD Endpoints (COMPLETE)
All endpoints deployed and verified:
| Endpoint | Methods | Container |
|---|---|---|
| /api/stock | GET, POST | stock |
| /api/orders | GET, POST | purchase-orders |
| /api/receipts | GET, POST, POST /bulk | receipts |
| /api/tickets | GET, POST | tickets |
| /api/delivery-logs | GET, POST | delivery-logs |
| /api/suppliers | GET, POST | suppliers |
| /api/health | GET | (diagnostic) |

Notes:
- GET supports query params (e.g., `?poId=X&docType=Y` for receipts)
- POST is upsert (create or update)
- `/api/receipts/bulk` accepts array body for batch writes
- Health endpoint strips Cosmos metadata server-side; other endpoints return raw docs (frontend `cleanDocs()` handles cleanup)

### ✅ STEP 4a: Frontend API Integration — READ (COMPLETE)
- `api.ts` — service layer with typed helpers: `stockApi`, `ordersApi`, `receiptsApi`, `ticketsApi`
- `loadAllData()` — master fetch function with 3-tier fallback:
  1. API call → success → cache in IndexedDB → source: "api"
  2. API failed → read IndexedDB cache → source: "cache"
  3. Cache empty → mock data from data.ts → source: "mock"
- `cleanDocs()` strips Cosmos metadata (_rid, _self, _etag, _attachments, _ts)
- App.tsx calls `loadAllData()` on mount, stores `dataSource` in state
- **Bug found & fixed:** InventoryView crashed with "Rendered fewer hooks than expected" when search filtered items inside a `.map()` with inline hooks. Fixed by extracting `MobileInventoryCard` as proper React component.

### ✅ STEP 4b: Frontend API Integration — WRITE (COMPLETE)

**Implementation: Optimistic UI + fire-and-forget API calls**
- React state updates immediately (optimistic UI)
- API call fires in background: `apiXxx.upsert(newValue).catch(console.warn)`
- If API fails, write is automatically queued by offline queue (Step 5b)
- Receipt documents include `docType` + `poId` (partition key) on every write

**All handlers with API write-through:**

**Stock/Inventory:** ✅
- `handleStockUpdate` → `stockApi.upsert(item)`
- `handleUpdateItem` → `stockApi.upsert(item)`
- `handleCreateItem` → `stockApi.upsert(item)`

**Purchase Orders:** ✅
- `handleCreateOrder` → `ordersApi.upsert(order)` + auto-creates receipt header/master
- `handleUpdateOrder` → `ordersApi.upsert(order)` + recalculates receipt status
- `handleArchiveOrder` → `ordersApi.upsert(updatedOrder)`
- `handleCancelOrder` → cascades: order + receipt master + headers + closes tickets

**Receipts:** ✅
- `handleReceiptSuccess` → inline persistence in setState callbacks (no setTimeout):
  - PO update persisted inside `setPurchaseOrders` callback
  - Receipt master persisted inside `setReceiptMasters` callback
  - Stock items persisted inside `setInventory` callback
  - Header + items via `receiptsApi.bulkUpsert()` (constructed before state updates)
  - Auto-comments + auto-tickets persisted via `receiptsApi.upsert()` / `handleAddTicket()`
- `handleReceiptStatusUpdate` → `receiptsApi.upsert(header)`
- `handleRevertReceipt` → reverses stock, PO, receipt master + header
- `handleDeliveryRefusal` → updates master + creates ticket + auto-comments

**Returns (handleProcessReturn):** ✅
- Stock subtraction persisted inline in `setInventory` callback
- PO status update persisted inline in `setPurchaseOrders` callback
- Receipt master + delivery log persisted inline in `setReceiptMasters` callback
- Return header + items via `receiptsApi.bulkUpsert()`
- Auto-comment posted to Historie & Notizen (rich formatted)
- Dedicated return ticket auto-created via `handleAddTicket()`
- Cross-posted to existing open tickets for same PO

**Tickets:** ✅
- `handleAddTicket` → `ticketsApi.upsert(ticket)` with poId fallback chain
- `handleUpdateTicket` → `ticketsApi.upsert(ticket)`

**Comments:** ✅
- `handleAddComment` → `receiptsApi.upsert(comment)` with docType: "comment"
- Auto-comments (inspection + returns) persisted via `receiptsApi.upsert()`

**Stale closure fix (critical bug resolved):**
Original implementation used `setTimeout(() => {...}, 100)` to "let React state settle" before reading updated values for API persistence. But `setTimeout` captures stale closures — variables inside callback point to old state. **Fix:** All API calls moved **inside** `setState` callbacks where computed/updated values are immediately available.

**Multi-device sync (real-time):**
- `visibilitychange` listener: re-fetches all data when user returns to tab/PWA
- 10-second polling: `setInterval(10000)` calls `syncFromApi()` while tab is visible
- Polling pauses when tab hidden (saves bandwidth)
- Shared `syncFromApi()` function calls `loadAllData()` and updates all state

**Auto-ticket/comment improvements:**
- Return processing now creates dedicated return tickets (was missing)
- Return auto-comments posted to Historie & Notizen in rich format
- Rich formatting: bold labels, `──` section separators, item details with SKU/qty/reason/shipping
- All auto-generated messages use consistent structured format

### ✅ STEP 4c: UI Polish & Bug Fixes (COMPLETE)

**Desktop: Sticky table headers**
- OrderManagement, ReceiptManagement, InventoryView (list view)
- `max-h-[calc(100vh-300px)] overflow-y-auto` on table container
- `sticky top-0 z-10` on `<thead>` element

**Mobile: Compact sticky headers**
- OrderManagement + ReceiptManagement list views
- Title scaled 2xl→base, buttons py-2.5→py-1.5 + text-xs, search py-3→py-2 + text-xs, icons 18→14px
- Entire top section (title + search + filters) sticky on mobile
- Card list area uses `flex-1 overflow-y-auto min-h-0` for independent scrolling

**Archive toggle (OrderManagement)**
- Changed from full checkbox+text button to discrete icon button
- Icon-only on mobile with blue dot indicator when active

**Return picker portal fix (ReceiptManagement)**
- Fixed Rücksendung button in master receipt list opening under the slide-in detail panel
- Used `createPortal(modal, document.body)` for proper z-index stacking

### ✅ STEP 4d: Mobile Navigation Overhaul (COMPLETE)

**Bottom Navigation (BottomNav.tsx — new file)**
- 5 tabs: Lager, Artikel, Bestell., Eingang, Audit (placeholder)
- Active tab: `text-[#0077B5]`
- Hidden during full-screen flows (CreateOrderWizard, GoodsReceiptFlow)
- **Scroll-aware auto-hide:** Touch event detection on `document`
  - Finger up (scroll down) → hide, finger down (scroll up) → show
  - 12px dead-zone, direction locking, 1.5s idle timeout re-show

**Sidebar Rewrite (Sidebar.tsx)**
- Desktop: CSS hover-expand overlay (68px collapsed → 256px expanded)
- Mobile: Slide-in drawer from right (triggered by ⋮ button in header)
- Both modes share same nav items + settings button

**Header Cleanup**
- Removed hamburger from left side
- Logo (icon + DOST INFOSYS) sits clean on left
- Added `MoreVertical` (⋮) on right → opens sidebar drawer
- Content bottom padding: `pb-24` on mobile, `lg:pb-8` on desktop

### ✅ STEP 5: Offline Resilience (COMPLETE)

**5a: IndexedDB Cache Layer**
- **Module:** `offlineDb.ts`
- Database: `procureflow-cache` (version 2)
- Object stores: `stock`, `orders`, `receipts`, `tickets`, `_meta`, `_writeQueue`
- Functions: `cacheCollection()`, `getCachedCollection()`, `getCachedAppData()`, `cacheAllData()`, `clearCache()`, `getLastSyncTime()`
- Integrated into `api.ts` `loadAllData()` — API success caches to IndexedDB; API failure reads from IndexedDB; both empty falls back to mock

**5b: Offline Write Queue**
- **Module:** `offlineQueue.ts`
- Failed API writes (network TypeError) automatically enqueued in IndexedDB `_writeQueue` store
- FIFO processing, max 5 retries per entry
- **Flush triggers:** `online` event, `visibilitychange` event, app startup
- `onQueueChange()` listener notifies UI → `pendingWrites` state in App.tsx
- Replaces silent `.catch(console.warn)` — writes are now durable

**5c: Service Worker**
- **File:** `public/sw.js`
- Registered in `index.html` before `</body>`
- Pre-cached app shell: `/`, `/index.html`, `/index.css`, `/manifest.json`
- **Caching strategies:**
  - App shell (HTML): Stale-while-revalidate
  - Static assets (JS/CSS/images): Cache-first
  - CDN (esm.sh, Google Fonts, Tailwind): Cache-first (content-hashed)
  - API (`/api/*`): Network-first with cache fallback
  - Writes (POST/PUT/DELETE): Passthrough (managed by offlineQueue.ts)
- Cache versioning: bump `CACHE_VERSION` in sw.js → old caches deleted on activate
- Auto-update: checks for new SW on `visibilitychange`
- `staticwebapp.config.json` updated: `/sw.js` excluded from navigation fallback, global cache headers added

**5d: Sync Status Indicator**
- Always visible in Header
- States: Connected (green), Pending writes (amber), Offline/cache (orange), Local/mock (gray)
- Click opens dropdown with: connection status, pending writes count, explanatory text
- `pendingWrites` state driven by `onQueueChange()` listener

---

## ✅ PHASE A: Bug Fixes & Persistence (COMPLETE)

### ✅ A1: Settings Persistence Fix
**Root cause:** Theme initializer hardcoded to `'light'`, never reads from localStorage. `toggleTheme` and `onSetTheme` never persist.
**Fix applied:**
- Theme initializer reads from localStorage on mount (with 'dark'/'light'/'soft' validation)
- `toggleTheme` 3-way cycle persists to localStorage
- `onSetTheme` (SettingsPage picker) also persists to localStorage
- **Verified:** Change theme → hard refresh → survives

### ✅ A2: Warehouse Log (StockLog) Persistence
**Root cause:** `stockLogs` state always empty array on mount. `handleLogStock` only updated in-memory state — zero persistence.
**Fix applied:**
- `stockLogs` initializer reads from localStorage on mount (with Date object restoration from ISO strings)
- `handleLogStock` persists to localStorage after each entry (capped at 500 entries)
- **Verified:** Log stock change → refresh → logs survive

### ✅ A3: Dashboard Activity Feed Enhancement
**Root cause:** Dashboard "Letzte Aktivitäten" only read `stockLogs` (which was empty due to A2).
**Fix applied:**
- New `ActivityEntry` type aggregating stock logs, orders, receipts, and tickets
- `recentActivity` computed from all 4 sources, sorted by timestamp, top 10
- Icon/color coding per type: green=add, red=remove, blue=order, amber=receipt, orange=ticket
- Mobile card view renders combined feed with fallback to legacy `recentLogs`
- Empty state: "Keine Aktivitäten verzeichnet"

---

## ✅ PHASE A+: Theme & UI Polish (COMPLETE — current session)

### ✅ Theme Toggle Logic Fix
**Old behavior:** Icon showed current mode (confusing — Moon in soft mode implied "you're in night mode").
**New rule:** "The icon I see is the mode I want" (icon = destination).
| Currently in | Icon shown | Tooltip | Click → |
|---|---|---|---|
| Light | Sunrise | "Soft Mode" | Soft |
| Soft | Moon | "Dark Mode" | Dark |
| Dark | Sun | "Light Mode" | Light |

**Changes:**
- `App.tsx`: Cycle order changed from Light→Dark→Soft to Light→Soft→Dark
- `Header.tsx`: Replaced `SunMedium` import with `Sunrise`. Icon/tooltip logic updated to destination-based.

### ✅ Soft Theme Overhaul — "Frosted Aura"
**Problem:** Soft mode was nearly identical to Light mode — too much pure white, no visual distinction.
**Solution:** Applied "Frosted Aura" color palette (cool blue-gray tones):

| Role | Old (≈ Light) | New (Frosted Aura) |
|---|---|---|
| Page background | `#F5F5F6` | `#E8EDF0` |
| Card surfaces | `white` (shared) | `#F0F3F6` (via CSS override) |
| Sidebar / Bottom nav | `#F5F5F6` | `#E2E7EB` |
| Header | `white/50` (shared) | `#E8EDF0/80` (frosted glass) |
| Borders | `#E6E7EB` | `#D4DDE2` |
| Primary text | `#323338` | `#2C3E47` (dark steel) |
| Icon/muted text | `#86888A` | `#5C7E8F` (blue-gray accent) |
| Pewter/disabled | `#86888A` | `#A2A2A2` |
| Hover backgrounds | `#E6E7EB` | `#D4DDE2` |

**Implementation:**
- `index.css` (new file): Global CSS overrides activated by `.theme-soft` class. Catches all `bg-white`, `bg-slate-50`, `bg-slate-100`, `border-slate-200`, `hover:bg-slate-50/100`, input fields, and dividers — no need for `isSoft` branches in every component.
- `App.tsx`: Root wrapper adds `theme-soft` class + new bg/text colors when soft mode active
- `Header.tsx`: Dedicated soft mode styles for header bg, ⋮ button, profile ring, sync dropdown
- `Sidebar.tsx`: Updated bg, border, inactive text, hover, settings active/inactive colors
- `BottomNav.tsx`: Updated bg, border, inactive color
- `SettingsPage.tsx`: Theme preview button updated with new soft palette
- `OrderManagement.tsx` + `ReceiptManagement.tsx`: Sticky mobile header bg updated

### ✅ Documentation Page Rewrite
**Problem:** K17 — DocumentationPage was stale (still said "runs in browser, planned: Firebase/Supabase").
**Fix:** Complete rewrite of `DocumentationPage.tsx`:
- **2 new sections:** Cloud & API (Azure infrastructure, Cosmos containers, API endpoints, data loading strategy) and Offline & Sync (4-layer architecture: IndexedDB, write queue, Service Worker, sync indicator)
- **Updated sections:** Overview (Azure stack, PWA, Frosted Aura theme), all modules (API persistence, returns, activity feed), orders (cascading actions, Smart Import), receipt (full returns flow, API persistence pattern), data model (Cosmos containers + partition keys), business logic (write-through pattern, stale closure explanation), settings (all current settings including ticket automation, lagerort categories, audit trail)
- Version bumped to v0.3.0, March 2026

---
---

## ✅ AUTHENTICATION & ACCESS CONTROL (March 2026)

### ✅ K1 RESOLVED: Azure Entra ID Authentication
- Azure SWA built-in OAuth via `/.auth/login/aad` (Entra ID app registration: ProcureFlow, client ID: 741fb362-c5ed-45f3-a138-ae2219ea246d)
- User profiles stored in Cosmos DB `user-profiles` container (partition key: /id)
- API endpoint: `api/src/functions/user-profiles.ts` — GET by userId/email, GET all, POST/PUT upsert, DELETE
- **Email-based auto-linking:** Admin creates user by email in Team Management → user signs in with Microsoft → app tries userId lookup → falls back to email match → auto-links profile to real userId → deletes placeholder. Zero manual steps for new users.
- Auth flow in App.tsx: check `/.auth/me` → lookup by userId → fallback to email → auto-link → set `currentUser` state
- Three auth states: authenticated (full access), NOT_PROVISIONED ("Zugang ausstehend" screen), ACCOUNT_DEACTIVATED (login page with error)
- Role-based: admin (all features + global settings + team management) vs team (configurable feature toggles)
- LoginPage component with DOST LAGER branding, Microsoft login button

### ✅ Team Management (TeamManagement.tsx)
- Full CRUD for user management (admin-only)
- Add/edit users: firstName, lastName, email, role (admin/team)
- Feature toggles for team members: stock, audit, receipts, orders, suppliers, settings, global-settings
- Admins get all features automatically
- Activate/deactivate users without deletion
- Accessible from GlobalSettingsPage → Team-Verwaltung button

### ✅ Feature-Based Module Visibility
- Sidebar (desktop) and BottomNav (mobile) filter nav items based on `currentUser.featureAccess`
- Admins see all modules; team members only see modules matching their feature toggles
- Dashboard always visible; Settings always visible; Global Settings only for admin or `global-settings` permission
- Dashboard operative cards (KPI cards): display data for all users, but only clickable/navigable with matching permission. Non-clickable cards show `opacity-75` + no hover effects.
- Dashboard action buttons: Wareneingang button hidden without `receipts` access, Protokoll button hidden without `stock` access
- Debug link removed from Settings page
- Module → feature mapping: `stock` → inventory/stock-logs, `orders` → order-management/create-order, `receipts` → receipt-management/goods-receipt, `suppliers` → suppliers, `audit` → audit (future)

---

## ✅ OFFLINE SYNC FIX (March 2026 — K14 fully resolved)

### Root cause chain (3 bugs)
1. **iOS Safari error detection (THE critical bug):** `api.ts` checked for `error.message.includes('fetch')` to detect network errors. iOS Safari throws `"Load failed"` when offline, not `"Failed to fetch"`. Writes were silently dropped — never queued.
2. **Sync poll overwrites offline state:** `syncFromApi()` ran every 60s even when offline. It loaded stale IndexedDB cache data and overwrote React state containing valid offline edits.
3. **Mount sequence wrong:** On reopening the app online, `loadAllData()` fetched old API data before the write queue had a chance to flush. Changes reached the server but the UI showed stale data.

### Fixes applied

**api.ts — Cross-browser network error detection:**
- Now detects: `navigator.onLine === false`, `"Load failed"` (Safari), `"Failed to fetch"` (Chrome), `"NetworkError"` (Firefox), `"internet"` (misc)
- Ensures writes are queued on ALL browsers/platforms

**App.tsx — 4-layer sync guard in `syncFromApi()`:**
1. `!navigator.onLine` → skip entirely (prevents stale cache overwrite)
2. `pendingWritesRef > 0` → skip (local state ahead of API)
3. `lastWriteTimestamp < 15s` → skip (K14 cooldown)
4. `source !== 'api'` → skip state update (never overwrite from cache, only from live API)

**App.tsx — Flush-before-load on mount:**
- On startup, if online with queued writes: `flushQueue()` runs BEFORE `loadAllData()`
- Ensures API has latest data before the app reads from it

**App.tsx — Real-time online/offline detection:**
- `isOnline` state driven by `window.addEventListener('online'/'offline')`
- Instant indicator update — no waiting for next poll cycle
- Going offline sets `dataSource` to `'cache'` immediately

### Sync indicator visual flow (5 states)
| State | Icon(s) | Color | Label |
|---|---|---|---|
| Connected, synced | Cloud | Green | Verbunden |
| Pending writes | RefreshCw (spinning) | Amber | X ausstehend |
| Device offline | WifiOff + Database | Orange | Offline · X |
| Back online, syncing | Database (pulsing) | Amber | Synchronisiere… |
| Sync done | Cloud | Green | Verbunden |

### Files changed
- `api.ts` — Network error detection (isNetworkError)
- `App.tsx` — syncFromApi guards, pendingWritesRef, isOnline state, flush-before-load, goOffline sets dataSource
- `Header.tsx` — isOnline prop, 5-state indicator rendering with dual icons for offline
- `offlineQueue.ts` — No changes (worked correctly, was just never receiving entries on iOS)
---

## 🔮 ROADMAP — Prioritized by dependency chain & developer efficiency

### PHASE B: Product & UX Overhaul (do next — most daily-use impact)

**B1. Item Management Redesign (#2 + #7)** 🟡 MEDIUM
- B1a: Unlock SKU / Artikel Nummer for editing (currently read-only after creation)
- B1b: Lagerort field → ComboboxSelect with grouped categories (already available via lagerortCategories)
- B1c: Inline editing mode for stock levels in list view (click-to-edit pattern)
- B1d: Bulk stock adjustment tool (select multiple items → apply +/- to all)
- **Depends on:** A1 (settings persistence — DONE)

**B2. Product Filter Enhancement (#9)** 🟡 MEDIUM
- Fix filter performance on 800+ products (debounce search, virtualize list if needed)
- Add filter chips: Warehouse (ComboboxSelect grouped), System (ComboboxSelect grouped), Status
- Filters persist in URL params or session state
- **Depends on:** ComboboxSelect (done)

**B3. Item Creation from URL (#1)** 🟢 LOW (manual works fine)
- Add "Von URL erstellen" option in ItemModal
- Flow: paste URL → loading spinner → backend Azure Function scrapes page → returns: name, product number, box quantity, manufacturer
- **Depends on:** B1 (editing redesign), new API endpoint (`api/src/functions/scrape-product.ts`)
- **Blocker:** Need product URL examples to build scraping rules

---

### PHASE C: Module Enhancements (standalone — can be parallelized)

**C1. Suppliers Section Upgrade (#3)** 🟡 MEDIUM
- Add "Info" tab alongside existing "Performance" scores tab
- Info tab fields: Name, Website (clickable link), Order Email, Inquiry Email
- Store in Supplier interface: `website?`, `orderEmail?`, `inquiryEmail?`
- **Standalone** — no dependencies

**C2. Data Management / Import Tool (#5)** 🟡 MEDIUM
- Move import UI from SettingsPage to GlobalSettingsPage (admin section)
- Replace JSON upload with Excel (.xlsx) upload using SheetJS library
- SharePoint export format mapping, preview step, full overwrite (not merge)
- **Standalone** — touches SettingsPage.tsx + GlobalSettingsPage.tsx

**C3. Fast One-Click Inspection (#8)** 🟡 MEDIUM
- "⚡ Schnellbuchung" button: auto-accept all items at ordered quantities → book to stock/project
- Warehouse resolution: PO warehouse → default warehouse setting → ComboboxSelect picker
- 3-step animation (1.5s): "Prüfe…" → "Buche…" → "Fertig ✓"
- **Depends on:** ComboboxSelect (done)

---

### PHASE D: New Module — Inventory Auditing (#10) (biggest effort — do last)

**D1. Auditing Tool** 🟢 LOW (new feature, large scope)
- New sidebar module: "Inventur"
- **Offline-first architecture:** Cache product list in IndexedDB, all counting offline, queue sync
- **Flow:** Start audit → search/scan → enter physical count → compare → variance report → archive
- **Data model:** `AuditSession { id, name, date, status, items: AuditItem[] }`
- **Cosmos container:** `audits` (partition key: `/id`)
- **Depends on:** Phase A (DONE), Step 5 (DONE)

---

### Ongoing / Cross-cutting

- Replace remaining bottom sheets with ComboboxSelect (supplier picker in CreateOrderWizard)
- Persist lagerortCategories to Cosmos DB (currently localStorage only)
- Persist audit trail to Cosmos DB
- Persist user preferences to Cosmos DB (user-prefs container)
- ~~Wire Microsoft Entra ID authentication~~ ✅ DONE
- Feature-based module visibility: prepared but navigation guard not yet implemented (user can still programmatically access hidden modules)
- Security: Rotate Cosmos DB key and Azure client secret (both were exposed in terminal during debugging)

---

## ⚠️ KNOWN ISSUES & TECHNICAL DEBT — Prioritized

### 🔴 HIGH — Must fix before multi-user production

**~~K1. No authentication~~** ✅ RESOLVED
- ~~Entra ID provisioned but not wired in~~
- **Fix applied:** Azure Entra ID OAuth via SWA built-in auth + Cosmos DB user profiles + email auto-linking + role-based access (admin/team) + feature toggles + Team Management UI. See "Authentication & Access Control" section above.

**~~K5. Aggressive 10-second polling~~** ✅ RESOLVED
- ~~Wastes Cosmos RU/s budget on free tier (1000 RU/s shared)~~
- **Fix applied:** Polling interval increased to 60s. Combined with K14 write-cooldown, reads reduced by 83% (72 reads/min → 12 reads/min for 3 users).

**~~K14. Sync polling overwrites local optimistic updates~~** ✅ RESOLVED
- ~~Race condition: user action → optimistic UI → poll fires before API write lands → fetches old data → overwrites user's change~~
- **Fix applied (v1):** Write-cooldown (15s) via `lastWriteTimestampRef` + `markWrite()` injected into 8 handlers.
- **Fix applied (v2 — full resolution):** 4-layer sync guard (online check, pending writes check, cooldown, source-only-api). Cross-browser network error detection in api.ts (iOS Safari "Load failed" fix). Flush-before-load on mount. Real-time online/offline detection. See "Offline Sync Fix" section above.

### 🟡 MEDIUM — Should fix for reliability.

**K6. Duplicate SKU IDs in seed data** 🟡
- 182 duplicate Artikel Nummer values — Cosmos keeps last-write-wins (~613 unique)
- **Fix:** UUID-based IDs or composite keys for production

**K8. Receipts container overload** 🟡
- Single container holds 4 doc types (master, header, item, comment)
- Cross-partition queries get expensive at scale
- **Fix:** Split into separate containers per doc type (breaking change)

**K9. `/api/health` strips metadata but other endpoints don't** 🟡
- Frontend `cleanDocs()` handles it but adds payload size
- **Fix:** Add `stripMeta()` to all endpoints

**K10. localStorage as source of truth for some data** 🟡
- lagerortCategories, audit trail (500 max), user preferences, stockLogs — all localStorage only
- **Fix:** Persist to Cosmos DB `user-prefs` container

**K13. `delivery-logs` and `suppliers` not loaded on mount** 🟡
- `loadAllData()` only fetches stock, orders, receipts, tickets
- `deliveryLogsApi` and `suppliersApi` exist in api.ts but not imported in App.tsx
- **Fix:** Add to `loadAllData()`, import in App.tsx

**K15. `syncFromApi` won't sync empty collections** 🟡
- Uses `if (data.stock.length > 0)` — legitimately empty collections get stale data
- **Fix:** Change to `if (data.stock !== undefined)` or null-check

**K16. `archivedReceiptGroups` cross-component sync via localStorage** 🟡
- Written by App.tsx, read by ReceiptManagement via focus event — fragile
- **Fix:** Lift into App.tsx React state, pass as prop, persist to API

**K19. SettingsPage import creates non-unique IDs** 🟡
- `handleFileUpload` uses `id: raw["Artikel Nummer"] || generated-id-${index}` — no dedup suffix
- **Fix:** Align with data.ts pattern or use UUID

**K21. `handleArchiveOrder` / `handleCancelOrder` read stale closures** 🟡
- Both read `purchaseOrders.find(...)` outside setState — same bug fixed for handleReceiptSuccess
- **Fix:** Move API calls inside setState callbacks

**K22. No input sanitization on API endpoints** 🟡
- All endpoints accept arbitrary JSON bodies
- **Fix:** Add zod or manual schema validation

### 🟢 LOW — Cleanup / nice to have

**K11. GoodsReceiptFlow prop surface** 🟢
- 15+ props — could benefit from context or useReducer
- Works correctly, just harder to maintain

**K12. stock.ts partition key documentation mismatch** 🟢
- Deploy script may reference `/sku`, actual container uses `/id`
- **Verify:** Check live Cosmos container

**~~K18. Sidebar interface has dead `mode` prop~~** ✅ RESOLVED
- ~~`SidebarProps` still declares `mode?: 'full' | 'slim'`~~
- **Fix applied:** Replaced with `currentUser: AuthUser | null` prop for feature-based visibility.

### ✅ RESOLVED

**K1. No authentication** → ✅ Azure Entra ID + user profiles + email auto-linking + role-based access + Team Management
**K2. No offline write queue** → ✅ Resolved by Step 5b (offlineQueue.ts)
**K3. Fire-and-forget API persistence** → ✅ Resolved by Step 5b (failed writes auto-queued)
**K4. Settings persistence bug** → ✅ Resolved by Phase A1 (localStorage read/write)
**K14. Offline sync data loss** → ✅ 4-layer sync guard + iOS network error detection + flush-before-load + real-time online/offline
**K17. DocumentationPage stale** → ✅ Complete rewrite with current architecture
**K18. Sidebar dead `mode` prop** → ✅ Replaced with `currentUser` prop for feature visibility
**K20. No user-facing API status indicator** → ✅ Resolved by Step 5d (sync indicator in Header)

---

## PROJECT FILE STRUCTURE

```
dost_lager/
├── .github/workflows/
│   └── azure-static-web-apps-mango-beach-0bdbc9710.yml
├── api/
│   ├── src/
│   │   ├── functions/
│   │   │   ├── health.ts
│   │   │   ├── stock.ts
│   │   │   ├── orders.ts
│   │   │   ├── receipts.ts
│   │   │   ├── tickets.ts
│   │   │   ├── delivery-logs.ts
│   │   │   └── suppliers.ts
│   │   ├── scripts/
│   │   │   └── seed-inventory.ts
│   │   └── utils/
│   │       └── cosmos.ts
│   ├── host.json
│   ├── local.settings.json (gitignored)
│   ├── package.json
│   ├── tsconfig.json
│   └── tsconfig.seed.json
├── public/
│   └── sw.js ← Service Worker (Step 5c)
├── components/
│   ├── BottomNav.tsx (mobile bottom navigation)
│   ├── CreateOrderWizard.tsx
│   ├── Dashboard.tsx (enhanced activity feed — A3)
│   ├── DocumentationPage.tsx (rewritten — K17 fix)
│   ├── GlobalSettingsPage.tsx
│   ├── GoodsReceiptFlow.tsx
│   ├── Header.tsx (Sunrise icon, Frosted Aura soft, sync indicator — 5d)
│   ├── InsightsRow.tsx
│   ├── InventoryView.tsx (MobileInventoryCard extracted)
│   ├── ItemModal.tsx
│   ├── LifecycleStepper.tsx
│   ├── LogicInspector.tsx
│   ├── OrderManagement.tsx (Frosted Aura sticky header)
│   ├── ReceiptManagement.tsx (Frosted Aura sticky header)
│   ├── ReceiptStatusBadges.tsx
│   ├── ReceiptStatusConfig.tsx
│   ├── SettingsPage.tsx (Frosted Aura preview button, role-gated Global Settings link)
│   ├── Sidebar.tsx (CSS hover-expand, feature-based nav filtering via currentUser)
│   ├── TeamManagement.tsx (admin user CRUD + feature toggles)
│   ├── LoginPage.tsx (DOST LAGER branding, Microsoft login)
│   ├── StatusDescription.tsx
│   ├── StockCard.tsx
│   ├── StockLogView.tsx
│   ├── SupplierView.tsx
│   └── TicketSystem.tsx
├── data/
│   └── warehouse-inventory.json (795 items)
├── api.ts (service layer — 3-tier fallback with IndexedDB caching)
├── offlineDb.ts ← IndexedDB cache layer (Step 5a)
├── offlineQueue.ts ← Offline write queue (Step 5b)
├── App.tsx (central state, optimistic UI, write-through, scroll detection, theme-soft class)
├── data.ts (mock database fallback)
├── types.ts (all TypeScript interfaces)
├── index.css ← Frosted Aura global CSS overrides (.theme-soft)
├── index.html (SW registration script, index.css link)
├── staticwebapp.config.json (sw.js excluded from fallback, cache headers)
├── manifest.json
├── vite.config.ts
├── tsconfig.json
└── package.json
```

---

## KEY TECHNICAL NOTES

1. **Partition keys matter:** stock/orders/suppliers use `/id`, receipts use `/poId`, tickets use `/poId`, delivery-logs use `/receiptId`. All API calls must include the correct partition key value.

2. **Receipts container is multi-document:** A single container holds masters, headers, items, and comments, differentiated by `docType`. When saving any receipt-related document to the API, always include both `docType` and `poId`.

3. **Stale closure pattern:** Never use `setTimeout` to "wait for state" then read it. Always put API persistence calls inside `setState(prev => { ... })` callbacks where you have the freshly computed values. This was a critical bug fixed in Step 4b.

4. **3-tier data fallback:** API → IndexedDB cache → mock data. The `dataSource` state tracks which tier is active. The sync indicator (Step 5d) displays this to the user.

5. **Offline write queue:** Failed API writes land in IndexedDB `_writeQueue` store. Auto-flushed on `online` event, `visibilitychange`, and app startup. Max 5 retries per entry. UI shows pending count via `onQueueChange()` listener.

6. **Service Worker cache versioning:** Bump `CACHE_VERSION` in `public/sw.js` on every deploy to bust stale caches. Old cache names are cleaned up in the `activate` event.

7. **Soft theme CSS strategy:** The `.theme-soft` class on the root wrapper activates global CSS overrides in `index.css` that catch `bg-white`, `bg-slate-50`, `border-slate-200` etc. This avoids needing `isSoft` ternary branches in every component for card backgrounds, section headers, borders, hovers, and input fields.

8. **Theme toggle convention:** "The icon I see is the mode I want" — Sunrise → Soft, Moon → Dark, Sun → Light. Cycle: Light → Soft → Dark → Light.

9. **StockLogs persistence:** Stored in localStorage (max 500 entries). Date objects serialized as ISO strings, restored on mount. Not yet in Cosmos DB — planned for user-prefs container.

10. **App language:** UI is in German, code/comments in English. All user-facing strings use German throughout components.

11. **Offline write queue — iOS Safari:** The network error message on iOS Safari is `"Load failed"`, not `"Failed to fetch"` (Chrome) or `"NetworkError"` (Firefox). `api.ts` detects all variants plus `navigator.onLine` as fallback. This was the root cause of the K14 offline data loss bug.

12. **Feature-based module visibility:** Sidebar, BottomNav, Dashboard cards, and Dashboard action buttons all check `currentUser.featureAccess`. Admins bypass all checks. The mapping is: stock → inventory/stock-logs, orders → order-management/create-order, receipts → receipt-management/goods-receipt, suppliers → suppliers. Dashboard and personal Settings are always visible.