# ProcureFlow — Changelog & Resolved Issues
## Complete history of migration steps, fixes, and completed features

---

## MIGRATION STEPS (Path B: Multi-User Backend)

### ✅ STEP 1: API Foundation
- `api/` folder with Azure Functions v4 project
- `api/src/utils/cosmos.ts` — Cosmos DB client singleton (queryItems, getItem, upsertItem, deleteItem, bulkUpsert)
- `api/src/functions/health.ts` — GET /api/health
- GitHub Actions workflow: `api_location: "api"`
- `staticwebapp.config.json` — navigation fallback, API routing
- COSMOS_CONNECTION via Key Vault in production

### ✅ STEP 2: Seed Script
- `api/src/scripts/seed-inventory.ts` — 795 items uploaded from warehouse-inventory.json
- BOM stripping, illegal character fix (`/` → `_`), SharePoint field mapping
- Known: 182 duplicate Artikel Nummer values (~613 unique docs)

### ✅ STEP 3: CRUD Endpoints
- All 9 endpoints: stock, orders, receipts (/bulk), tickets, delivery-logs, suppliers, audits, user-profiles, health
- GET with query params, POST upsert, receipts bulk endpoint

### ✅ STEP 4a: Frontend API Integration — READ
- `api.ts` service layer with typed helpers
- `loadAllData()` — 3-tier fallback: API → IndexedDB → mock data
- `cleanDocs()` strips Cosmos metadata
- Bug fix: InventoryView hooks-in-map crash → extracted MobileInventoryCard

### ✅ STEP 4b: Frontend API Integration — WRITE
- Optimistic UI + fire-and-forget API calls
- All handlers with write-through: Stock (3), Orders (4), Receipts (4), Returns (full cascade), Tickets (2), Comments (2)
- Critical fix: Stale closure bug — moved API calls inside setState callbacks (no setTimeout)
- Auto-ticket/comment improvements for returns

### ✅ STEP 4c: UI Polish & Bug Fixes
- Desktop sticky table headers (OrderManagement, ReceiptManagement, InventoryView)
- Mobile compact sticky headers
- Archive toggle icon button
- Return picker portal fix (createPortal)

### ✅ STEP 4d: Mobile Navigation Overhaul
- BottomNav.tsx: 5 tabs, scroll-aware auto-hide (12px dead-zone, direction lock, 1.5s idle)
- Sidebar.tsx: CSS hover-expand desktop (68px→256px), slide-in drawer mobile
- Header.tsx: Clean logo left, ⋮ right, no hamburger

### ✅ STEP 5: Offline Resilience
- **5a:** offlineDb.ts — IndexedDB cache (procureflow-cache v3, stores: stock, orders, receipts, tickets, audits, _meta, _writeQueue)
- **5b:** offlineQueue.ts — Failed writes auto-queued, FIFO, max 5 retries, flush on online/visibility/startup
- **5c:** public/sw.js — Service Worker with 4 caching strategies (stale-while-revalidate, cache-first, network-first, passthrough)
- **5d:** Header sync indicator — 5 states (Connected, Pending, Offline, Syncing, Local)

---

## PHASE A: Bug Fixes & Persistence

### ✅ A1: Settings Persistence Fix
- Theme initializer reads localStorage on mount
- toggleTheme + onSetTheme persist to localStorage

### ✅ A2: Warehouse Log Persistence
- stockLogs initializer reads localStorage (with Date restoration from ISO strings)
- handleLogStock persists to localStorage (capped 500)

### ✅ A3: Dashboard Activity Feed Enhancement
- ActivityEntry type aggregating stock logs, orders, receipts, tickets
- Top 10 sorted by timestamp, icon/color coding per type

---

## PHASE A+: Theme & UI Polish

### ✅ Theme Toggle Logic Fix
- "Icon I see = mode I want": Sunrise→Soft, Moon→Dark, Sun→Light
- Cycle: Light → Soft → Dark → Light

### ✅ Soft Theme — "Frosted Aura"
- Custom color palette: page bg #E8EDF0, cards #F0F3F6, sidebar #E2E7EB, borders #D4DDE2
- Global CSS overrides in index.css via `.theme-soft` class
- Updated: App.tsx, Header, Sidebar, BottomNav, SettingsPage, OrderManagement, ReceiptManagement

### ✅ Documentation Page Rewrite (K17)
- Complete rewrite with 11 sections, DE/EN toggle, Collapsible cards
- Cloud & API, Offline & Sync, all modules, data model, business logic, settings

---

## AUTHENTICATION & ACCESS CONTROL (March 2026)

### ✅ K1: Azure Entra ID Authentication
- SWA built-in OAuth via /.auth/login/aad
- User profiles in Cosmos DB user-profiles container
- Email-based auto-linking: admin creates by email → user signs in → auto-linked
- Three auth states: authenticated, NOT_PROVISIONED, ACCOUNT_DEACTIVATED
- Role-based: admin (all) vs team (feature toggles)
- LoginPage with DOST LAGER branding

### ✅ Team Management
- TeamManagement.tsx: Full CRUD, feature toggles, activate/deactivate
- Accessible from GlobalSettingsPage → Team-Verwaltung

### ✅ Feature-Based Module Visibility
- Sidebar + BottomNav filter by featureAccess
- Dashboard cards: display-only without permission (opacity-75)
- Dashboard action buttons conditionally hidden
- Module→feature mapping enforced

---

## OFFLINE SYNC FIX (K14 — March 2026)

### Root cause (3 bugs)
1. iOS Safari: `"Load failed"` not detected as network error → writes silently dropped
2. Sync poll overwrites: stale IndexedDB cache overwriting valid offline edits
3. Mount sequence: loadAllData() before queue flush

### Fixes
- **api.ts:** Cross-browser detection: "Load failed" (Safari), "Failed to fetch" (Chrome), "NetworkError" (Firefox)
- **App.tsx:** 4-layer sync guard: !navigator.onLine → pendingWritesRef → 15s cooldown → source===api only
- **App.tsx:** Flush-before-load on mount
- **App.tsx:** Real-time online/offline via window events

---

## PHASE D: AUDIT MODULE (March 2026)

### ✅ D1: Complete Audit Module — 18 Steps
Full shopping-cart style inventory counting module.

**Types & Infrastructure (Steps 1-4):**
- AuditSession, AuditItem, AuditMode, AuditStatus types in types.ts
- StockLog expanded: action 'write-off', contexts 'audit-quick'/'audit-normal', audit metadata fields
- AppNotification type for in-app notifications
- API endpoint: api/src/functions/audits.ts (GET/POST/PUT/DELETE with ?status= and ?createdBy= filters)
- Cosmos container: audits (partition /id), provisioned via YAML + manual az CLI
- auditsApi in api.ts, IndexedDB v3 with audits store, loadAllData() updated
- Navigation: Sidebar + BottomNav + App.tsx routing, feature map 'audit': 'audit'

**Core Module (Steps 5-9):**
- AuditModule.tsx with 5 sub-views: landing, setup, cart, summary, review
- Landing: "Neue Inventur" gradient button, quick stats bar, search, history list with status filter tabs
- Setup: Name input, warehouse grid picker, Quick/Normal mode cards, blind mode toggle
- Cart: Live autocomplete search, AuditCartItem extracted component (no hooks in .map), big +/− steppers (44px), direct qty entry, note toggle, remove button, sticky bottom bar with progress
- Summary: Stats card (Artikel/Gezählt/Differenz), category chips, expandable variance rows (green/amber/red), mode-specific action buttons with confirmation dialogs

**Submit & Approval (Steps 10-13):**
- handleAuditComplete in App.tsx: saves session, persists to Cosmos, updates stock on approval
- Quick Count: immediate stock update + audit-tagged StockLog entries (write-off for shortages, add for overages)
- Normal Audit: saves as pending-review → manager approval view with approve/reject + review comment
- Approval triggers same stock update path with approvedByName = manager
- Rejection updates status only, no stock changes
- K14 protected via markWrite()

**Notifications (Step 14):**
- AppNotification type, bell icon in Header with red badge (max "9+")
- Dropdown panel with notification list, mark read, mark all read, navigate on tap
- Auto-generated: audit submitted (info), approved (audit-approved), rejected (audit-rejected)
- Persisted in localStorage (max 50), per-device

**Lagerprotokoll Integration (Step 15):**
- "Inventur" filter tab in StockLogView
- Purple SCHNELL/INVENTUR badge, red ABSCHREIBUNG badge for write-offs
- Referenz column shows audit name, "Genehmigt von" / "Gezählt von" sub-line
- Both mobile card view and desktop table updated

**Polish (Steps 16-18):**
- Swipe gestures: left = remove (red), right = note (blue), 40px dead zone, vertical scroll priority
- Micro-animations: card entrance bounce, quantity flash, staggered fade-ups, stat pop-in, celebration bounce
- Confetti: Canvas-based particle burst (60 particles, gravity, rotation, brand colors) on perfect match
- Blind mode: hide expected quantities until summary reveal, toggle in setup
- Haptic feedback: navigator.vibrate on Android (5ms stepper, 10ms add, 15ms swipe remove), graceful no-op on iOS

---

## RESOLVED K-CODES (Quick Reference)

| Code | Issue | Resolution |
|---|---|---|
| K1 | No authentication | Azure Entra ID + user profiles + email auto-linking + roles |
| K2 | No offline write queue | offlineQueue.ts (Step 5b) |
| K3 | Fire-and-forget API persistence | Failed writes auto-queued (Step 5b) |
| K4 | Settings persistence bug | localStorage read/write (Phase A1) |
| K5 | Aggressive 10s polling | Increased to 60s + K14 cooldown |
| K14 | Sync polling overwrites local state | 4-layer sync guard + iOS detection + flush-before-load |
| K17 | DocumentationPage stale | Complete rewrite with 11 sections |
| K18 | Sidebar dead mode prop | Replaced with currentUser prop |
| K20 | No user-facing API status indicator | Sync indicator in Header (Step 5d) |