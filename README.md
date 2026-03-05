# ProcureFlow (DOST Lager) — Project Status
## Version: v0.4.0 | March 2026

---

## WHAT IT IS

German-language warehouse management PWA covering the full Procure-to-Pay lifecycle: purchase orders, goods receipt & inspection, supplier evaluation, stock management, inventory auditing, and audit logging. Offline-first for underground warehouses and vans without signal.

**Live:** https://mango-beach-0bdbc9710.1.azurestaticapps.net
**Repo:** github.com/jecastrom/dost_lager (private, master branch)

---

## TECH STACK

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS |
| Backend | Azure Functions v4 (Node.js 20) |
| Database | Azure Cosmos DB (NoSQL, free tier) |
| Hosting | Azure Static Web Apps (free tier) |
| Auth | Microsoft Entra ID (SWA built-in OAuth) |
| Offline | IndexedDB, Service Worker, Offline Write Queue |
| CI/CD | GitHub Actions (auto-deploy on push to master) |

---

## AZURE RESOURCES

| Resource | Name | Tier |
|---|---|---|
| Static Web App | swa-procureflow | Free |
| Cosmos DB | cosmos-procureflow (procureflow-db) | Free |
| Key Vault | kv-procureflow | ~€0.03/mo |
| Entra ID App | ProcureFlow (741fb362-c5ed-45f3-a138-ae2219ea246d) | Included |
| Resource Group | rg-procureflow-prod (West Europe) | — |
| Subscription | Pay_Go_Dost_Project (20fb7306-...) | — |

---

## COSMOS DB CONTAINERS (9)

| Container | Partition Key | Content |
|---|---|---|
| stock | /id | Inventory items (~795) |
| purchase-orders | /id | Purchase orders |
| receipts | /poId | Multi-type: master, header, item, comment (docType field) |
| tickets | /poId | Case management |
| delivery-logs | /receiptId | Delivery logs |
| suppliers | /id | Supplier data |
| audits | /id | Audit sessions (inventory counts) |
| user-profiles | /id | User profiles (auth + roles) |
| notifications | /userId | (future use) |

---

## API ENDPOINTS

| Endpoint | Methods | Container |
|---|---|---|
| /api/stock | GET, POST, PUT, DELETE | stock |
| /api/orders | GET, POST, PUT, DELETE | purchase-orders |
| /api/receipts | GET, POST, POST /bulk | receipts |
| /api/tickets | GET, POST, PUT | tickets |
| /api/delivery-logs | GET, POST | delivery-logs |
| /api/suppliers | GET, POST, PUT, DELETE | suppliers |
| /api/audits | GET, POST, PUT, DELETE | audits |
| /api/user-profiles | GET, POST, PUT, DELETE | user-profiles |
| /api/health | GET | (diagnostic) |

---

## CURRENT FEATURES

- **Auth:** Microsoft Entra ID OAuth, role-based (admin/team), feature toggles, email auto-linking
- **Dashboard:** 4 KPI cards, activity feed, insights row
- **Orders:** Create/edit/archive/cancel with cascade, Smart Import, Lager + Projekt modes
- **Goods Receipt:** Full inspection wizard, 3-badge status system, returns with auto-tickets
- **Inventory:** ~800 items, grid/list view, inline +/−, CSV export, ComboboxSelect locations
- **Audit Module (NEW):** Shopping-cart style inventory counting, Quick/Normal modes, blind mode, manager approval flow, confetti on perfect match, swipe gestures, haptic feedback, full Lagerprotokoll integration
- **Stock Log:** 5 filter tabs (Alle/Manuell/PO-Normal/PO-Projekt/Inventur), audit badges
- **Suppliers:** Automatic scoring 0-100 based on delivery history
- **Tickets:** Auto/manual on deviations, configurable per type
- **Notifications:** Bell icon with badge, audit event notifications
- **Offline:** IndexedDB cache, write queue, Service Worker, 4-layer sync guard, iOS Safari support
- **Themes:** Light, Soft (Frosted Aura), Dark
- **Team Management:** User CRUD, feature toggles, activate/deactivate

---

## ⚠️ KNOWN ISSUES & TECHNICAL DEBT

### 🟡 MEDIUM — Should fix for reliability

| Code | Issue | Fix |
|---|---|---|
| K6 | Duplicate SKU IDs in seed data (182 dupes, ~613 unique) | UUID-based IDs |
| K8 | Receipts container holds 4 doc types (expensive queries at scale) | Split containers |
| K9 | Only /api/health strips Cosmos metadata server-side | Add stripMeta() to all endpoints |
| K10 | lagerortCategories, audit trail, stockLogs in localStorage only | Persist to Cosmos DB |
| K13 | delivery-logs and suppliers not loaded on mount | Add to loadAllData() |
| K15 | syncFromApi won't sync empty collections | Change length check to undefined check |
| K16 | archivedReceiptGroups synced via localStorage focus event | Lift to React state + API |
| K19 | SettingsPage import creates non-unique IDs | Use UUID |
| K21 | handleArchiveOrder/handleCancelOrder read stale closures | Move API calls inside setState |
| K22 | No input sanitization on API endpoints | Add zod validation |

### 🟢 LOW — Cleanup / nice to have

| Code | Issue | Fix |
|---|---|---|
| K11 | GoodsReceiptFlow has 15+ props | Context or useReducer |
| K12 | stock.ts partition key docs may say /sku (actual is /id) | Verify live container |

### 🔒 SECURITY

- Rotate Cosmos DB key (exposed in terminal during debugging)
- Rotate Azure client secret (exposed in terminal during debugging)

---

## 🔮 ROADMAP

### PHASE B: Product & UX Overhaul

| ID | Feature | Priority |
|---|---|---|
| B1 | Item editing redesign (unlock SKU, inline editing, bulk adjust) | 🟡 MEDIUM |
| B2 | Product filter enhancement (debounce, chips, URL persistence) | 🟡 MEDIUM |
| B3 | Item creation from URL (scrape product page) | 🟢 LOW |

### PHASE C: Module Enhancements

| ID | Feature | Priority |
|---|---|---|
| C1 | Suppliers info tab (website, emails) | 🟡 MEDIUM |
| C2 | Excel import tool (replace JSON upload) | 🟡 MEDIUM |
| C3 | Fast one-click inspection ("Schnellbuchung") | 🟡 MEDIUM |

### Cross-cutting

- Persist lagerortCategories, audit trail, user preferences to Cosmos DB
- Navigation guard (prevent programmatic access to hidden modules)
- Replace remaining bottom sheets with ComboboxSelect

---

## PROJECT FILE STRUCTURE

```
dost_lager/
├── .github/workflows/
│   └── azure-static-web-apps-mango-beach-0bdbc9710.yml
├── api/src/functions/     (health, stock, orders, receipts, tickets, delivery-logs, suppliers, audits, user-profiles)
│        /scripts/         (seed-inventory.ts)
│        /utils/           (cosmos.ts)
├── components/            (30+ components — see CHANGELOG.md for details)
│   ├── AuditModule.tsx    ← NEW: Full audit module (5 sub-views, swipe, confetti)
│   ├── Header.tsx         ← Updated: notification bell
│   ├── StockLogView.tsx   ← Updated: Inventur filter tab + audit badges
│   └── ...
├── api.ts                 (service layer + auditsApi)
├── offlineDb.ts           (IndexedDB v3 — now includes audits store)
├── offlineQueue.ts        (offline write queue)
├── App.tsx                (central state + handleAuditComplete + notifications)
├── types.ts               (AuditSession, AuditItem, AppNotification, + expanded StockLog)
└── ...
```

---

## KEY TECHNICAL NOTES

1. **Partition keys:** stock/orders/suppliers/audits use `/id`, receipts use `/poId`, tickets use `/poId`, delivery-logs use `/receiptId`, user-profiles use `/id`
2. **Receipts multi-doc:** Single container, differentiated by `docType`. Always include `docType` + `poId` on writes.
3. **Write-through pattern:** API calls inside `setState(prev => { ... })` — never `setTimeout`. Prevents stale closures.
4. **3-tier fallback:** API → IndexedDB → mock data. `dataSource` state tracks active tier.
5. **Offline queue:** Failed writes → IndexedDB `_writeQueue` → auto-flush on `online` event / visibility change / app start.
6. **K14 sync guard:** 4 layers: `!navigator.onLine` → `pendingWritesRef > 0` → 15s cooldown → `source === 'api'` only.
7. **iOS Safari:** Network error is `"Load failed"`, not `"Failed to fetch"`. Detected in `api.ts`.
8. **Theme toggle:** Icon = destination. Sunrise→Soft, Moon→Dark, Sun→Light.
9. **UI language:** German. Code/comments English.
10. **Cosmos imports in API:** Must use `.js` extension (e.g., `from "../utils/cosmos.js"`).
11. **React hooks:** Never inside `.map()` — extract to named components (lesson from InventoryView crash).
12. **Audit module:** `handleAuditComplete()` handles both Quick (instant stock update) and Normal (approval-gated). Uses `markWrite()` for K14 protection. Logs with `'audit-quick'`/`'audit-normal'` context + `auditSessionId`, `countedByName`, `approvedByName`.

---

*For complete history of resolved issues and migration steps, see [CHANGELOG.md](./CHANGELOG.md)*
*For deployment instructions, see [DEPLOYMENT-GUIDE.md](./DEPLOYMENT-GUIDE.md.md)*
*For session handoff context, see [HANDOFF-PROMPT.md](./HANDOFF-PROMPT.md)*