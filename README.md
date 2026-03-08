# ProcureFlow (DOST Lager)
## v0.5.0 | March 2026

German-language warehouse management PWA for the **operational procurement cycle (Procure-to-Stock)** — purchase orders, goods receipt & inspection, quality control, supplier evaluation, stock management, inventory auditing, and system logging.

**Not included:** No invoicing, payments, budgets, or accounting. Operational goods process only.

Custom-built for DOST-INFOSYS GmbH. Offline-first for underground warehouses.

---

## Links

| | |
|---|---|
| **Live (Test)** | https://brave-wave-06ee56d03.4.azurestaticapps.net |
| **Repo** | github.com/jecastrom/dost_lager (private, master branch) |
| **Issues & Roadmap** | [GitHub Issues](https://github.com/jecastrom/dost_lager/issues) |
| **Deployment** | [DEPLOYMENT-GUIDE.md](./DEPLOYMENT-GUIDE.md) |
| **Session Context** | [HANDOFF-PROMPT.md](./HANDOFF-PROMPT.md) |
| **In-App Docs** | Settings → Dokumentation (bilingual DE/EN) |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS |
| Backend | Azure Functions v4 (Node.js 20) |
| Database | Azure Cosmos DB (NoSQL, free tier) — 12 containers |
| Hosting | Azure Static Web Apps (free tier) |
| Auth | Microsoft Entra ID (SWA built-in OAuth) |
| Offline | IndexedDB, Service Worker, Offline Write Queue |
| Sync | cosmosSync.ts — write-through to Cosmos, localStorage fallback |
| CI/CD | GitHub Actions (auto-deploy on push to master) |

---

## Features

- **Auth** — Microsoft Entra ID OAuth, role-based (admin/team), feature toggles, "sign in with different account"
- **Dashboard** — KPI cards, activity feed, insights
- **Orders** — Create/edit/archive/cancel with cascade, Smart Import, Lager + Projekt modes
- **Goods Receipt** — Full inspection wizard, 3-badge status system, returns with auto-tickets
- **Inventory** — ~800 items, grid/list, inline +/−, CSV export
- **Audit** — Shopping-cart inventory counting, Quick/Normal modes, blind mode, approval flow, offline draft auto-save
- **Stock Log** — 5 filter tabs, audit badges, persisted to Cosmos DB
- **Suppliers** — Auto-scoring 0–100 based on delivery history
- **Tickets** — Auto/manual on deviations, configurable per type
- **Notifications** — Bell icon with badge, synced across devices via Cosmos
- **Themes** — Light, Soft, Dark, Auto (OS preference), persists across logout
- **Offline** — IndexedDB cache, write queue, Service Worker, 4-layer sync guard, iOS Safari support
- **Team Management** — User CRUD, feature toggles, activate/deactivate
- **User Avatar** — Microsoft Graph photo with initials fallback

---

## Cosmos DB Containers (12)

| Container | PK | Purpose |
|---|---|---|
| stock | /id | Inventory items (~795) |
| purchase-orders | /id | Purchase orders |
| receipts | /poId | Multi-type: master, header, item, comment |
| tickets | /poId | Case management |
| delivery-logs | /receiptId | Delivery logs |
| suppliers | /id | Supplier data |
| audits | /id | Audit sessions |
| user-profiles | /id | User profiles + preferences (prefs:{userId}) |
| app-settings | /settingId | Org-wide settings (always "global") |
| stock-logs | /id | Stock movements (append-only) |
| audit-trail | /id | System action log (append-only) |
| notifications | /userId | Legacy — unused (migrated to user-prefs) |

---

## API Endpoints (14)

| Endpoint | Methods |
|---|---|
| /api/stock | GET, POST, PUT, DELETE |
| /api/orders | GET, POST, PUT, DELETE |
| /api/receipts | GET, POST, POST /bulk |
| /api/tickets | GET, POST, PUT |
| /api/delivery-logs | GET, POST |
| /api/suppliers | GET, POST, PUT, DELETE |
| /api/audits | GET, POST, PUT, DELETE |
| /api/user-profiles | GET, POST, PUT, DELETE |
| /api/app-settings | GET, PUT (?key=) |
| /api/user-prefs | GET, PUT (?userId=) |
| /api/stock-logs | GET (?limit, offset), POST |
| /api/audit-trail | GET (?limit, offset), POST |
| /api/user-photo | GET (Microsoft Graph proxy) |
| /api/health | GET (diagnostic) |

---

## Project Structure

```
dost_lager/
├── .github/workflows/     CI/CD pipeline + infrastructure provisioning
├── api/src/functions/      14 Azure Functions (REST endpoints)
│        /utils/            cosmos.ts (DB client + helpers)
│        /scripts/          seed-inventory.ts
├── components/             30+ React components
├── App.tsx                 Central state (~40 handlers)
├── api.ts                  REST client with 3-tier fallback (API → IndexedDB → mock)
├── cosmosSync.ts           Cosmos write-through + load helpers
├── offlineDb.ts            IndexedDB v3 cache layer
├── offlineQueue.ts         Offline write queue (auto-flush)
├── types.ts                All TypeScript interfaces
├── data/data.ts            Mock database fallback (~800 items)
└── public/                 PWA manifest + Service Worker
```

---

## Key Patterns

1. **Write-through** — API calls inside `setState()` prevent stale closures. Cosmos sync fires in parallel, fire-and-forget.
2. **3-tier fallback** — API → IndexedDB → mock data. `dataSource` tracks active tier.
3. **Offline queue** — Failed writes → IndexedDB `_writeQueue` → auto-flush on reconnect.
4. **K14 sync guard** — 4 layers: `!navigator.onLine` → `pendingWrites > 0` → 15s cooldown → `source === 'api'` only.
5. **Portal architecture** — Dropdowns use `createPortal(document.body)` to escape `backdrop-blur` containing blocks.
6. **Cosmos sync** — localStorage writes immediately; Cosmos in background. Load from Cosmos on mount after auth.
7. **Theme persistence** — `theme-preference` survives logout. Auto follows OS. User override permanent.
8. **Auth flow** — Normal logout = SWA-only. Different account = Azure AD logout → fresh login (account picker).
9. **German UI, English code** — All user-facing strings in German with correct umlauts.

---

## Issues & Roadmap

All tracked in [GitHub Issues](https://github.com/jecastrom/dost_lager/issues) with milestones:

| Milestone | Focus |
|---|---|
| Security (do first) | Key rotation |
| Quick Wins | Bug fixes, small improvements |
| Phase B | Product & UX overhaul |
| Phase C | Module enhancements |
| Production-Ready | Technical debt cleanup |

---

*Deployment: [DEPLOYMENT-GUIDE.md](./DEPLOYMENT-GUIDE.md) · Changelog: [CHANGELOG.md](./CHANGELOG.md) · Session context: [HANDOFF-PROMPT.md](./HANDOFF-PROMPT.md)*