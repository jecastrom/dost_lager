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

## ⏳ STEP 4b: Frontend API Integration — WRITE (NEXT)

**Goal:** When the user creates/updates/deletes data in the app, persist those changes to Cosmos DB via the API. Currently all handlers only update React state — data is lost on page refresh.

### Handlers that need API write-through:

**Stock/Inventory:**
- `handleStockUpdate(id, newLevel)` → `stockApi.upsert(item)` 
- `handleUpdateItem(item)` → `stockApi.upsert(item)`
- `handleCreateItem(item)` → `stockApi.upsert(item)`

**Purchase Orders:**
- `handleCreateOrder(order)` → `ordersApi.upsert(order)`
- `handleUpdateOrder(order)` → `ordersApi.upsert(order)`
- `handleArchiveOrder(orderId)` → `ordersApi.upsert(updatedOrder)`
- `handleCancelOrder(orderId)` → `ordersApi.upsert(updatedOrder)`

**Receipts (most complex):**
- `handleReceiptSuccess(...)` → creates ReceiptMaster + ReceiptHeader + ReceiptItems + updates PO + updates stock levels → multiple API calls or bulk upsert
- `handleReceiptStatusUpdate(batchId, newStatus)` → `receiptsApi.upsert(header)`
- `handleRevertReceipt(batchId)` → multiple updates (master, PO, stock reversal)
- `handleDeliveryRefusal(poId, reason, notes)` → updates master + PO

**Tickets:**
- `handleAddTicket(ticket)` → `ticketsApi.upsert(ticket)`
- `handleUpdateTicket(ticket)` → `ticketsApi.upsert(ticket)`

**Comments:**
- `handleAddComment(batchId, type, message)` → `receiptsApi.upsert(comment)` (with docType: "comment")

### Implementation approach:
1. Keep React state as primary (optimistic UI — update state immediately)
2. Fire API call in background (fire-and-forget with error logging)
3. If API fails, log warning but don't break UI
4. Pattern: `setStateXxx(newValue); apiXxx.upsert(newValue).catch(console.warn);`

### Important considerations:
- Receipt documents need `docType` field added when saving to API
- Receipt documents need `poId` field (partition key) — must be included
- Stock updates from goods receipt flow update multiple items — use batch approach
- Archived orders: `isArchived: true` flag, never deleted
- Audit trail stays in localStorage (not migrated to API yet)

---

## 🔮 STEP 5: Offline Resilience (FUTURE)

- Cache last-fetched API data in localStorage
- Queue failed writes when offline
- Sync queue on reconnect
- Service worker background sync

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
