# ProcureFlow — Cloud Migration Status
## Date: 2026-02-28

---

## ARCHITECTURE OVERVIEW

**App:** ProcureFlow (aka "DOST Lager") — German warehouse management PWA
**Stack:** React/TypeScript + Vite (frontend), Azure Functions v4 (API), Azure Cosmos DB (database)
**Hosting:** Azure Static Web Apps (free tier) with managed Functions
**Live URL:** https://mango-beach-0bdbc9710.1.azurestaticapps.net
**Repo:** github.com/jecastrom/dost_lager (private, master branch)
**Subscription:** Pay_Go_Dost_Project (20fb7306-d8e2-4ffb-bb7e-e80744d0a078)
**Resource Group:** rg-procureflow-prod (West Europe)

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

### ✅ STEP 3: CRUD API Endpoints (COMPLETE)
All 6 endpoints deployed and working:

| File | Route | Methods | Partition Key |
|---|---|---|---|
| `api/src/functions/stock.ts` | /api/stock/{id?} | GET, POST, PUT, DELETE | /id |
| `api/src/functions/orders.ts` | /api/orders/{id?} | GET, POST, PUT, DELETE | /id |
| `api/src/functions/receipts.ts` | /api/receipts/{*path} | GET, POST | /poId |
| `api/src/functions/tickets.ts` | /api/tickets/{id?} | GET, POST, PUT | /poId |
| `api/src/functions/delivery-logs.ts` | /api/delivery-logs/{id?} | GET, POST, PUT | /receiptId |
| `api/src/functions/suppliers.ts` | /api/suppliers/{id?} | GET, POST, PUT, DELETE | /id |

**Special endpoints:**
- `POST /api/receipts/bulk` — bulk upsert for batch receipt operations
- Receipts use `docType` field to distinguish: "master", "header", "item", "comment"
- Query params: `?poId=`, `?docType=`, `?receiptId=`

**Note:** `stock.ts` has `stripMeta()` helper to remove Cosmos DB system fields (_rid, _self, _etag, _attachments, _ts). Other endpoints still return raw Cosmos docs — the frontend `api.ts` service layer has `cleanDocs()` that strips metadata for all endpoints.

### ✅ STEP 4a: Frontend API Integration — READ (COMPLETE)
- `api.ts` — Service layer at project root (next to App.tsx, data.ts)
  - Generic `apiFetch<T>()` helper
  - Typed API objects: `stockApi`, `ordersApi`, `receiptsApi`, `ticketsApi`, `deliveryLogsApi`, `suppliersApi`, `healthApi`
  - `loadAllData()` — fetches stock + orders + receipts + tickets in parallel
  - `cleanDoc()` / `cleanDocs()` — strips Cosmos metadata from responses
  - Returns `null` if API unreachable (triggers fallback to local data)
- `App.tsx` changes:
  - Added `import { loadAllData } from './api'`
  - Added `isLoading` and `apiConnected` state
  - Added `useEffect` that calls `loadAllData()` on mount
  - Splits receipts by `docType` into masters/headers/items/comments
  - Shows loading spinner ("Daten werden geladen...") while fetching
  - Falls back silently to MOCK_* data if API unreachable (offline mode)
- `data.ts` change:
  - `id: raw["Artikel Nummer"] ? \`${raw["Artikel Nummer"]}__${index}\` : \`generated-id-${index}\`` — appends index to prevent duplicate React keys

### ✅ BUG FIX: InventoryView Hooks Crash (COMPLETE)
- **Root cause:** `useStockAdjust` hook was called inside a `.map()` loop in the mobile card view (violates Rules of Hooks). When search filtered items, React saw fewer hooks and crashed with "Rendered fewer hooks than expected" (React error #300).
- **Fix:** Extracted inline mobile card JSX into a proper `MobileInventoryCard` component (same pattern as `InventoryProductCard` and `InventoryTableRow`). Moved `StockComponentProps` interface above it.
- **Pre-existing bug** — not caused by API migration.

---

## ✅ STEP 4b: Frontend API Integration — WRITE (COMPLETE)

**Goal:** When the user creates/updates/deletes data in the app, persist those changes to Cosmos DB via the API.

### Implementation: Optimistic UI + fire-and-forget API calls
- React state updates immediately (optimistic UI)
- API call fires in background: `apiXxx.upsert(newValue).catch(console.warn)`
- If API fails, warning logged but UI stays functional
- Receipt documents include `docType` + `poId` (partition key) on every write

### All handlers with API write-through:

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

### Stale closure fix (critical bug resolved):
Original implementation used `setTimeout(() => {...}, 100)` to "let React state settle" before reading updated values for API persistence. But `setTimeout` captures stale closures — variables inside callback point to old state. **Fix:** All API calls moved **inside** `setState` callbacks where computed/updated values are immediately available.

### Multi-device sync (real-time):
- `visibilitychange` listener: re-fetches all data when user returns to tab/PWA
- 10-second polling: `setInterval(10000)` calls `syncFromApi()` while tab is visible
- Polling pauses when tab hidden (saves bandwidth)
- Shared `syncFromApi()` function calls `loadAllData()` and updates all state

### Auto-ticket/comment improvements:
- Return processing now creates dedicated return tickets (was missing)
- Return auto-comments posted to Historie & Notizen in rich format (matching quality issue style)
- Rich formatting: bold labels, `──` section separators, item details with SKU/qty/reason/shipping
- All auto-generated messages use consistent structured format across:
  - Quality issues (inspection) → `📋 Automatische Prüfmeldung`
  - Returns (inspection) → `📦 Rücksendung erfasst`
  - Returns (direct) → `📦 Rücksendung erfasst`
  - Delivery refusal → `📛 Lieferung abgelehnt`
  - Order cancellation → `Ticket automatisch geschlossen`

---

## ✅ STEP 4c: UI Polish & Bug Fixes (COMPLETE)

### Desktop: Sticky table headers
- OrderManagement, ReceiptManagement, InventoryView (list view)
- `max-h-[calc(100vh-300px)] overflow-y-auto` on table container
- `sticky top-0 z-10` on `<thead>` element

### Mobile: Compact sticky headers
- OrderManagement + ReceiptManagement list views
- Title scaled 2xl→base, buttons py-2.5→py-1.5 + text-xs, search py-3→py-2 + text-xs, icons 18→14px
- Entire top section (title + search + filters) sticky on mobile
- Card list area uses `flex-1 overflow-y-auto min-h-0` for independent scrolling
- Desktop layouts completely untouched

### Archive toggle (OrderManagement)
- Changed from full checkbox+text button to discrete icon button (matches ReceiptManagement)
- Icon-only on mobile with blue dot indicator when active
- Full text label preserved on desktop

### Return picker portal fix (ReceiptManagement)
- **Bug:** Rücksendung button in master receipt list silently failed
- **Root cause:** `returnPickerPortal` condition depended on `linkedMaster` which is null on list view (only set when detail is selected)
- **Fix:** Portal now resolves its own master: `returnPickerMaster = receiptMasters.find(m => m.poId === returnPickerPO.id)`
- Works from both list and detail views

---

## 🔮 STEP 5: Offline Resilience (FUTURE)

- Cache last-fetched API data in localStorage
- Queue failed writes when offline
- Sync queue on reconnect
- Service worker background sync

---
## 🔮 ROADMAP — Prioritized by dependency chain & developer efficiency

### PHASE A: Bug Fixes & Persistence (do first — everything else depends on these)

**A1. Settings Persistence Fix (#4)** 🔴 HIGH
- **Bug:** Dark mode + all toggles reset on refresh
- Audit every `useState` initializer in App.tsx + SettingsPage.tsx — verify localStorage read on mount
- Affected settings: theme, sidebarMode, inventoryViewMode, requireDeliveryDate, enableSmartImport, statusColumnFirst, ticketConfig, timelineConfig
- Ensure `handleSet*` functions write to localStorage AND (future) Cosmos DB user-prefs container
- **Test:** Change theme → hard refresh → must survive

**A2. Warehouse Log / Lagerprotokoll (#6)** 🔴 HIGH
- **Bug:** StockLogView shows nothing — debug full pipeline
- Check: is `handleLogStock()` in App.tsx actually called? Are `stockLogs` state entries created?
- Check: are logs persisted to Cosmos DB? If not, add API write-through
- Check: does StockLogView read from state correctly?
- Fix recording (App.tsx) + display (StockLogView.tsx)

**A3. Dashboard Latest Activity (#7)** 🔴 HIGH
- **Bug:** Bottom activity feed shows nothing
- Debug Dashboard.tsx — verify it receives `orders`, `receipts`, `tickets` props
- Build activity list from: recent POs created, receipts checked-in, tickets opened
- Persist activity entries (derive from existing data or add dedicated activity log)
- Sort by timestamp, show last 20 entries

---

### PHASE B: Product UX Overhaul (intertwined — do together)

**B1. Product Editing Redesign (#2)** 🟡 MEDIUM
- **B1a.** Unlock product number (SKU) — remove `disabled` / read-only rule in ItemModal
- **B1b.** Warehouse field → replace `<input>` with `ComboboxSelect` (reuse from Step 4f, pass `lagerortCategories`)
- **B1c.** Form redesign — replace full-screen modal with:
  - **Mobile:** Tap card → inline expand with editable fields (accordion pattern). Swipe-to-edit or tap-reveal on grid/list cards
  - **Desktop:** Click row → inline edit panel slides in (split view or expandable row)
  - Keep modal as fallback for "New Item" creation
- **B1d.** Mobile compact layout — reduce field spacing, use 2-column grid for small fields (minStock, packUnits)
- **Depends on:** ComboboxSelect (done), lagerortCategories (done)

**B2. Product Filter Enhancement (#9)** 🟡 MEDIUM
- Fix filter performance on 800+ products (debounce search, virtualize list if needed)
- Add filter chips: Warehouse (ComboboxSelect grouped), System (ComboboxSelect grouped), Status
- Filters persist in URL params or session state
- Compact filter bar — horizontal scroll on mobile, expandable panel on desktop
- **Depends on:** ComboboxSelect (done), intertwines with B1 (same InventoryView component)

**B3. Item Creation from URL (#1)** 🟢 LOW (manual works fine)
- Add "Von URL erstellen" option alongside manual in ItemModal / InventoryView
- Flow: paste URL → loading spinner → backend Azure Function scrapes page → returns: name, product number, box quantity (default 1), manufacturer
- Auto-assign system category (Object/Service) — needs product URL mapping rules (collect examples first)
- Manual fields remain editable after scrape (user can override)
- **Depends on:** B1 (editing redesign), new API endpoint (`api/src/functions/scrape-product.ts`)
- **Blocker:** Need product URL examples to build scraping rules

---

### PHASE C: Module Enhancements (standalone — can be parallelized)

**C1. Suppliers Section Upgrade (#3)** 🟡 MEDIUM
- Add "Info" tab alongside existing "Performance" scores tab
- Info tab fields: Name, Website (clickable link), Order Email, Inquiry Email (clearly labeled)
- Use tab pattern: `Performance | Info` (like existing receipt detail tabs)
- Store in Supplier interface: `website?: string`, `orderEmail?: string`, `inquiryEmail?: string`
- Update SupplierView.tsx + types.ts
- **Standalone** — no dependencies on other phases

**C2. Data Management / Import Tool (#5)** 🟡 MEDIUM
- Move import UI from SettingsPage to GlobalSettingsPage (admin section)
- Replace JSON upload with Excel (.xlsx) upload using SheetJS library
- SharePoint export format: map columns → StockItem interface (reuse seed-inventory.ts mapping logic)
- On upload: full overwrite of stock data (not merge) — confirm dialog with item count
- Add preview step: parse Excel → show table with row count, flag bad/empty rows in red
- No delete button anywhere — overwrite only
- **Standalone** — touches SettingsPage.tsx + GlobalSettingsPage.tsx

**C3. Fast One-Click Inspection (#8)** 🟡 MEDIUM
- New button on PO detail or receipt list: "⚡ Schnellbuchung" (Quick Booking)
- One click: auto-accept all items at ordered quantities → book to stock or project (based on PO type)
- **Warehouse resolution order:** (1) PO has warehouse set → use it, (2) Default warehouse from settings → use it, (3) Neither → show ComboboxSelect quick picker
- Add "Standard-Lagerort" setting to GlobalSettingsPage (dropdown from lagerortCategories)
- Animation: 3-step progress stepper (1.5s total): "Prüfe…" → "Buche…" → "Fertig ✓"
- Success toast: "Lieferung gebucht — Team wird benachrichtigt" (rectangular, subtle, auto-dismiss 4s)
- **Depends on:** A1 (settings persistence for default warehouse), ComboboxSelect (done)

---

### PHASE D: New Module — Inventory Auditing (#10) (biggest effort — do last)

**D1. Auditing Tool** 🟢 LOW (new feature, large scope)
- **New module:** Add to sidebar as "Inventur" (between Artikel and Bestellungen)
- **Offline-first architecture:**
  - Cache full product list in IndexedDB on module open
  - All counting works offline — queue sync for when back online
  - Service worker background sync for audit submissions
- **Flow:**
  1. Start new audit session (name, date, optional warehouse filter)
  2. Search/scan product → enter physical count (Ist-Bestand)
  3. Build list of audited items with running totals
  4. "Vergleichen" button → system diffs physical vs recorded (Soll vs Ist)
  5. Output: Variance report — surplus (+), shortage (−), match (✓)
  6. "Missing" list: items with negative variance → exportable
  7. Archive completed audits — history with timestamps, user, variance summary
- **Data model:**
  - `AuditSession { id, name, date, status, warehouseFilter?, userId, items: AuditItem[] }`
  - `AuditItem { sku, name, expectedQty, countedQty, variance, notes? }`
- **Reference patterns:** SAP MM cycle count, Oracle WMS count tasks, Fishbowl cycle count
- **Cosmos container:** `audits` (partition key: `/id`)
- **Depends on:** Phase A (persistence fixes), Phase B2 (product filter for search), Step 5 (offline resilience)

---

### Ongoing / Cross-cutting

- Replace remaining bottom sheets with ComboboxSelect (supplier picker in CreateOrderWizard)
- ComboboxSelect in ItemModal for Lagerort field (covered in B1b)
- Combobox grouping for System field (similar pattern)
- Persist lagerortCategories to Cosmos DB (currently localStorage only)
- Persist audit trail to Cosmos DB
- Persist user preferences to Cosmos DB (user-prefs container)
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
├── components/
│   ├── CreateOrderWizard.tsx
│   ├── Dashboard.tsx
│   ├── DocumentationPage.tsx
│   ├── GlobalSettingsPage.tsx
│   ├── GoodsReceiptFlow.tsx
│   ├── Header.tsx
│   ├── InsightsRow.tsx
│   ├── InventoryView.tsx (bug fixed — MobileInventoryCard extracted)
│   ├── ItemModal.tsx
│   ├── LifecycleStepper.tsx
│   ├── LogicInspector.tsx
│   ├── OrderManagement.tsx
│   ├── ReceiptManagement.tsx
│   ├── ReceiptStatusBadges.tsx
│   ├── ReceiptStatusConfig.tsx
│   ├── SettingsPage.tsx
│   ├── Sidebar.tsx
│   ├── StatusDescription.tsx
│   ├── StockCard.tsx
│   ├── StockLogView.tsx
│   ├── SupplierView.tsx
│   └── TicketSystem.tsx
├── data/
│   └── warehouse-inventory.json (795 items)
├── api.ts (service layer — API fetch helpers)
├── App.tsx (main app — loads data from API on mount)
├── data.ts (imports JSON, maps to StockItem[], fallback data)
├── types.ts (all TypeScript interfaces)
├── staticwebapp.config.json
├── index.html
├── vite.config.ts
├── tsconfig.json
└── package.json
```

---

## KEY TECHNICAL NOTES

1. **Partition keys matter:** stock/orders/suppliers use `/id`, receipts use `/poId`, tickets use `/poId`, delivery-logs use `/receiptId`. All API calls must include the correct partition key value.

2. **Receipts container is multi-document:** A single container holds masters, headers, items, and comments, differentiated by `docType`. When saving any receipt-related document to the API, always include both `docType` and `poId`.

3. **Duplicate IDs in source data:** 182 items share Artikel Nummer values like "Unbekannt", "?", "Geheim". In data.ts, IDs are made unique with `__index` suffix. In Cosmos DB, last-write-wins collapsed them to ~613 unique docs. Production fix needed later.

4. **Cosmos metadata:** API responses include `_rid`, `_self`, `_etag`, `_attachments`, `_ts`. The `stock.ts` endpoint strips them server-side. Other endpoints rely on `cleanDocs()` in the frontend `api.ts`. Eventually all endpoints should strip server-side.

5. **Local dev:** `npm run dev` runs on localhost:3000. API is not available locally (returns HTML 404 which triggers fallback to MOCK_* data). For full local testing, would need Azure Functions Core Tools + local Cosmos emulator.

6. **GitHub Actions:** Single workflow deploys both React app (from `/`) and Functions API (from `/api`). Build uses Oryx, detects Node.js + TypeScript automatically.
