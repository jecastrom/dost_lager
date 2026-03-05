##############################################################################
# ProcureFlow — GitHub Issues, Labels, Milestones & Release Setup
# Run this ONCE from your repo root after installing GitHub CLI
#
# PREREQUISITES:
#   1. Install GitHub CLI: https://cli.github.com
#   2. Authenticate: gh auth login
#   3. Be in the dost_lager repo directory
#
# USAGE:
#   cd C:\path\to\dost_lager
#   .\setup-github-project.ps1
#
# WHAT THIS CREATES:
#   - 8 labels (color-coded)
#   - 3 milestones (Phase B, C, Production-Ready)
#   - 10 K-code bug/debt issues
#   - 8 roadmap enhancement issues
#   - 2 security issues
#   - v0.4.0 release with full notes
##############################################################################

$ErrorActionPreference = "Continue"  # Don't stop on label-already-exists errors

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  ProcureFlow — GitHub Project Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verify gh is installed and authenticated
try {
    $null = gh auth status 2>&1
    Write-Host "  ✓ GitHub CLI authenticated" -ForegroundColor Green
} catch {
    Write-Host "  ✗ GitHub CLI not found or not authenticated" -ForegroundColor Red
    Write-Host "    Install: https://cli.github.com" -ForegroundColor Yellow
    Write-Host "    Then run: gh auth login" -ForegroundColor Yellow
    exit 1
}

# ============================================================================
# STEP 1: LABELS
# ============================================================================
Write-Host ""
Write-Host "  [1/5] Creating labels..." -ForegroundColor Cyan

$labels = @(
    @{ name = "bug";          color = "d73a4a"; description = "Something isn't working" }
    @{ name = "tech-debt";    color = "fbca04"; description = "Technical debt — should fix for reliability" }
    @{ name = "enhancement";  color = "0077B5"; description = "New feature or improvement" }
    @{ name = "security";     color = "e11d48"; description = "Security concern" }
    @{ name = "phase-b";      color = "7c3aed"; description = "Phase B: Product & UX Overhaul" }
    @{ name = "phase-c";      color = "2563eb"; description = "Phase C: Module Enhancements" }
    @{ name = "high";         color = "ff6b35"; description = "High priority" }
    @{ name = "medium";       color = "fbbf24"; description = "Medium priority" }
    @{ name = "low";          color = "86efac"; description = "Low priority — nice to have" }
    @{ name = "offline";      color = "f97316"; description = "Related to offline/sync functionality" }
)

foreach ($label in $labels) {
    gh label create $label.name --color $label.color --description $label.description --force 2>$null
    Write-Host "    ✓ $($label.name)" -ForegroundColor Green
}

# ============================================================================
# STEP 2: MILESTONES
# ============================================================================
Write-Host ""
Write-Host "  [2/5] Creating milestones..." -ForegroundColor Cyan

$milestones = @(
    @{ title = "Phase B: Product & UX Overhaul"; description = "Item editing redesign, filter enhancement, URL creation" }
    @{ title = "Phase C: Module Enhancements"; description = "Suppliers upgrade, Excel import, fast inspection" }
    @{ title = "Production-Ready"; description = "Fix all medium K-codes, security rotation, input validation" }
)

foreach ($ms in $milestones) {
    gh api repos/{owner}/{repo}/milestones -f title="$($ms.title)" -f description="$($ms.description)" -f state="open" 2>$null
    Write-Host "    ✓ $($ms.title)" -ForegroundColor Green
}

# ============================================================================
# STEP 3: K-CODE ISSUES (BUGS & TECH DEBT)
# ============================================================================
Write-Host ""
Write-Host "  [3/5] Creating K-code issues..." -ForegroundColor Cyan

# K6
gh issue create --title "K6: Duplicate SKU IDs in seed data" --body @"
**Problem:** 182 duplicate Artikel Nummer values in seed data. Cosmos keeps last-write-wins (~613 unique docs out of 795).

**Impact:** Stock items may be silently overwritten. Affects ~23% of seeded data.

**Fix:** UUID-based IDs or composite keys for production data. Run dedup script against live Cosmos container.

**Container:** stock (/id)
"@ --label "tech-debt,medium" 2>$null
Write-Host "    ✓ K6: Duplicate SKU IDs" -ForegroundColor Green

# K8
gh issue create --title "K8: Receipts container holds 4 doc types" --body @"
**Problem:** Single ``receipts`` container holds ReceiptMaster, ReceiptHeader, ReceiptItem, and ReceiptComment documents, distinguished only by ``docType`` field.

**Impact:** Cross-partition queries get expensive at scale. All queries must filter by docType.

**Fix:** Split into separate containers: receipt-masters, receipt-headers, receipt-items, receipt-comments. This is a breaking change requiring data migration + API + frontend updates.

**Container:** receipts (/poId)
"@ --label "tech-debt,medium" 2>$null
Write-Host "    ✓ K8: Receipts container overload" -ForegroundColor Green

# K9
gh issue create --title "K9: Only /api/health strips Cosmos metadata server-side" --body @"
**Problem:** ``/api/health`` uses ``stripMeta()`` but all other endpoints return raw Cosmos documents with ``_rid``, ``_self``, ``_etag``, ``_attachments``, ``_ts`` fields.

**Impact:** Frontend ``cleanDocs()`` handles it, but adds unnecessary payload size on every request.

**Fix:** Add ``stripMeta()`` to all endpoint handlers (stock, orders, receipts, tickets, delivery-logs, suppliers). The audits endpoint already has it — use as reference.
"@ --label "tech-debt,medium" 2>$null
Write-Host "    ✓ K9: stripMeta missing on endpoints" -ForegroundColor Green

# K10
gh issue create --title "K10: localStorage as source of truth for some data" --body @"
**Problem:** Several data types are only in localStorage, not persisted to Cosmos DB:
- ``lagerortCategories`` (warehouse location groupings)
- ``auditTrail`` (system action log, max 500)
- ``stockLogs`` (stock movement log, max 500)
- ``notifications`` (in-app notifications, max 50)
- User preferences (theme, view mode)

**Impact:** Data lost on browser clear. Not available on other devices. No server-side backup.

**Fix:** Create Cosmos DB ``user-prefs`` container (partition /userId). Sync on write + load on mount.
"@ --label "tech-debt,medium" 2>$null
Write-Host "    ✓ K10: localStorage data" -ForegroundColor Green

# K13
gh issue create --title "K13: delivery-logs and suppliers not loaded on mount" --body @"
**Problem:** ``loadAllData()`` in api.ts only fetches stock, orders, receipts, tickets, audits. The ``deliveryLogsApi`` and ``suppliersApi`` exist in api.ts but are not called during app boot.

**Impact:** Delivery logs and supplier data only available if manually fetched. Not cached in IndexedDB.

**Fix:** Add both to the ``Promise.all`` in ``loadAllData()``. Update ``AppData`` interface. Add to ``cacheAllData()`` and ``getCachedAppData()`` in offlineDb.ts.
"@ --label "bug,medium" 2>$null
Write-Host "    ✓ K13: Missing data on mount" -ForegroundColor Green

# K15
gh issue create --title "K15: syncFromApi won't sync empty collections" --body @"
**Problem:** ``syncFromApi()`` uses ``if (data.stock.length > 0)`` to guard state updates. If a collection is legitimately empty (e.g., all orders archived), the state won't update — stale data persists.

**Fix:** Change to ``if (data.stock !== undefined)`` or ``if (Array.isArray(data.stock))``.
"@ --label "bug,medium" 2>$null
Write-Host "    ✓ K15: Empty collection sync" -ForegroundColor Green

# K16
gh issue create --title "K16: archivedReceiptGroups synced via localStorage" --body @"
**Problem:** ``archivedReceiptGroups`` is written by App.tsx to localStorage, then read by ReceiptManagement via a ``focus`` event listener. This is fragile — depends on timing and browser focus behavior.

**Fix:** Lift into App.tsx React state, pass as prop to ReceiptManagement, persist to API.
"@ --label "tech-debt,medium" 2>$null
Write-Host "    ✓ K16: archivedReceiptGroups sync" -ForegroundColor Green

# K19
gh issue create --title "K19: SettingsPage import creates non-unique IDs" --body @"
**Problem:** ``handleFileUpload`` in SettingsPage uses ``id: raw['Artikel Nummer'] || 'generated-id-' + index`` — no dedup suffix. Duplicate Artikel Nummer values produce duplicate IDs.

**Fix:** Use ``crypto.randomUUID()`` or align with the data.ts dedup pattern.
"@ --label "bug,medium" 2>$null
Write-Host "    ✓ K19: Non-unique import IDs" -ForegroundColor Green

# K21
gh issue create --title "K21: handleArchiveOrder / handleCancelOrder read stale closures" --body @"
**Problem:** Both handlers read ``purchaseOrders.find(...)`` outside the ``setState`` callback — the same stale closure bug that was fixed for ``handleReceiptSuccess``.

**Impact:** API may persist outdated order data if the order was modified between render and click.

**Fix:** Move the ``find()`` and ``ordersApi.upsert()`` calls inside the ``setState(prev => { ... })`` callback.
"@ --label "bug,medium" 2>$null
Write-Host "    ✓ K21: Stale closures in archive/cancel" -ForegroundColor Green

# K22
gh issue create --title "K22: No input sanitization on API endpoints" --body @"
**Problem:** All Azure Functions API endpoints accept arbitrary JSON bodies without validation. Any shape of data can be written to Cosmos DB.

**Impact:** Malformed data could corrupt the database. No protection against accidental or malicious payloads.

**Fix:** Add ``zod`` schema validation to all POST/PUT handlers. Define schemas matching TypeScript interfaces in types.ts.
"@ --label "tech-debt,medium" 2>$null
Write-Host "    ✓ K22: No input sanitization" -ForegroundColor Green

# ============================================================================
# STEP 4: ROADMAP ISSUES (ENHANCEMENTS)
# ============================================================================
Write-Host ""
Write-Host "  [4/5] Creating roadmap issues..." -ForegroundColor Cyan

# Phase B
gh issue create --title "B1: Item Management Redesign" --body @"
**Scope:**
- B1a: Unlock SKU / Artikel Nummer for editing (currently read-only after creation)
- B1b: Lagerort field → ComboboxSelect with grouped categories (already available)
- B1c: Inline editing mode for stock levels in list view (click-to-edit)
- B1d: Bulk stock adjustment tool (select multiple → apply +/- to all)

**Priority:** Medium
**Depends on:** ComboboxSelect (done), Settings persistence (done)
"@ --label "enhancement,phase-b,medium" 2>$null
Write-Host "    ✓ B1: Item Management Redesign" -ForegroundColor Green

gh issue create --title "B2: Product Filter Enhancement" --body @"
**Scope:**
- Debounce search on 800+ products (currently filters on every keystroke)
- Add filter chips: Warehouse (ComboboxSelect grouped), System (ComboboxSelect grouped), Status
- Filters persist in URL params or session state
- Consider virtualized list if performance still lags

**Priority:** Medium
"@ --label "enhancement,phase-b,medium" 2>$null
Write-Host "    ✓ B2: Product Filter Enhancement" -ForegroundColor Green

gh issue create --title "B3: Item Creation from URL" --body @"
**Scope:**
- Add 'Von URL erstellen' option in ItemModal
- Flow: paste URL → loading spinner → Azure Function scrapes page → returns: name, product number, box quantity, manufacturer
- Needs new API endpoint: ``api/src/functions/scrape-product.ts``
- **Blocker:** Need product URL examples to build scraping rules

**Priority:** Low (manual works fine)
"@ --label "enhancement,phase-b,low" 2>$null
Write-Host "    ✓ B3: Item Creation from URL" -ForegroundColor Green

# Phase C
gh issue create --title "C1: Suppliers Section Upgrade" --body @"
**Scope:**
- Add 'Info' tab alongside existing 'Performance' scores tab
- Fields: Name, Website (clickable), Order Email, Inquiry Email
- New interface fields: ``website?``, ``orderEmail?``, ``inquiryEmail?``

**Priority:** Medium | **Standalone** — no dependencies
"@ --label "enhancement,phase-c,medium" 2>$null
Write-Host "    ✓ C1: Suppliers Upgrade" -ForegroundColor Green

gh issue create --title "C2: Excel Import Tool" --body @"
**Scope:**
- Move import UI from SettingsPage to GlobalSettingsPage (admin only)
- Replace JSON upload with Excel (.xlsx) using SheetJS library
- SharePoint export format mapping, preview step, full overwrite (not merge)

**Priority:** Medium | **Standalone**
"@ --label "enhancement,phase-c,medium" 2>$null
Write-Host "    ✓ C2: Excel Import Tool" -ForegroundColor Green

gh issue create --title "C3: Fast One-Click Inspection (Schnellbuchung)" --body @"
**Scope:**
- Lightning bolt button: auto-accept all items at ordered quantities → book to stock/project
- Warehouse resolution: PO warehouse → default warehouse setting → ComboboxSelect picker
- 3-step animation (1.5s): 'Prüfe...' → 'Buche...' → 'Fertig ✓'

**Priority:** Medium
"@ --label "enhancement,phase-c,medium" 2>$null
Write-Host "    ✓ C3: Fast Inspection" -ForegroundColor Green

# Cross-cutting
gh issue create --title "Persist localStorage data to Cosmos DB" --body @"
**Scope:** Migrate these from localStorage to Cosmos DB ``user-prefs`` container:
- lagerortCategories
- auditTrail (500 max)
- stockLogs (500 max)
- notifications (50 max)
- User preferences (theme, view mode, inventory view mode)

**Related:** K10
"@ --label "enhancement,medium" 2>$null
Write-Host "    ✓ Persist localStorage to Cosmos" -ForegroundColor Green

gh issue create --title "Navigation guard for hidden modules" --body @"
**Problem:** Feature-based module visibility hides nav items, but a user could still programmatically navigate to hidden modules (e.g., by manipulating state or using browser dev tools).

**Fix:** Add a guard in ``handleNavigation()`` that checks ``userHasAccess(module)`` before allowing navigation. Already partially implemented — needs to return early or redirect to dashboard.
"@ --label "enhancement,medium" 2>$null
Write-Host "    ✓ Navigation guard" -ForegroundColor Green

# Security
gh issue create --title "SECURITY: Rotate Cosmos DB connection key" --body @"
**Issue:** Cosmos DB primary key was exposed in terminal output during debugging session.

**Action:** Rotate the key in Azure Portal → Cosmos DB → Keys → Regenerate Primary Key. Then update the Key Vault secret ``CosmosDbConnectionString`` with the new connection string.
"@ --label "security,high" 2>$null
Write-Host "    ✓ Security: Rotate Cosmos key" -ForegroundColor Green

gh issue create --title "SECURITY: Rotate Azure Entra ID client secret" --body @"
**Issue:** Entra ID app client secret was exposed in terminal output during debugging session.

**Action:** Go to Azure Portal → Entra ID → App registrations → ProcureFlow → Certificates & secrets → New client secret. Update Key Vault secret ``EntraClientSecret``.
"@ --label "security,high" 2>$null
Write-Host "    ✓ Security: Rotate client secret" -ForegroundColor Green

# ============================================================================
# STEP 5: RELEASE v0.4.0
# ============================================================================
Write-Host ""
Write-Host "  [5/5] Creating v0.4.0 release..." -ForegroundColor Cyan

# First, create the tag
git tag -a v0.4.0 -m "v0.4.0 — Audit Module + Notifications" 2>$null
git push origin v0.4.0 2>$null

gh release create v0.4.0 --title "v0.4.0 — Audit Module, Notifications & Auth" --notes @"
## What's New in v0.4.0

### 🆕 Audit Module (Phase D — Complete)
Shopping-cart style inventory counting with premium mobile UX.

- **Two modes:** Quick Count (instant stock update) and Normal Audit (manager approval workflow)
- **Blind mode:** Hide expected quantities to prevent confirmation bias
- **Shopping cart flow:** Search → add → count with big thumb-friendly +/- steppers → summary with color-coded variances
- **Manager review:** Approve/reject with comments, stock only updates on approval
- **Lagerprotokoll integration:** Audit entries with purple SCHNELL/INVENTUR badges, red ABSCHREIBUNG badge for write-offs, counter/approver tracking
- **Offline-first:** Full counting works underground — all operations are local state. API writes auto-queue and sync when signal returns
- **Polish:** Swipe gestures (left=remove, right=note), card entrance animations, quantity flash, confetti on perfect match, haptic feedback (Android)

### 🔔 In-App Notifications
- Bell icon in header with unread badge
- Auto-generated notifications: audit submitted, approved, rejected
- Tap to navigate, mark all read

### 🔐 Authentication & Access Control (completed earlier in v0.4.0 cycle)
- Microsoft Entra ID OAuth via Azure SWA
- Role-based access: admin (full) vs team (feature toggles)
- Email-based auto-linking for new users
- Team Management UI for user CRUD

### 📊 Cosmos DB & API
- New container: ``audits`` (partition /id)
- New endpoint: ``/api/audits`` (GET/POST/PUT/DELETE with query filters)
- IndexedDB v3 with audits store
- ``loadAllData()`` now fetches 5 collections in parallel

### 🐛 Bug Fixes & Improvements
- StockLog expanded: ``write-off`` action, ``audit-quick``/``audit-normal`` contexts, audit metadata fields
- StockLogView: new Inventur filter tab with audit badges
- BottomNav: Audit placeholder replaced with real navigation
- Sidebar: Inventur nav item with ClipboardCheck icon
- Documentation page: Full audit section with offline capability infographic

### Infrastructure
- GitHub Actions YAML: ``audits`` container in provisioning
- ``deploy-procureflow-v2.ps1`` removed (YAML handles everything)
"@ 2>$null
Write-Host "    ✓ v0.4.0 release created" -ForegroundColor Green

# ============================================================================
# DONE
# ============================================================================
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "  Created:" -ForegroundColor White
Write-Host "    - 10 labels (color-coded)" -ForegroundColor Gray
Write-Host "    - 3 milestones" -ForegroundColor Gray
Write-Host "    - 10 K-code issues (bug/tech-debt)" -ForegroundColor Gray
Write-Host "    - 8 roadmap issues (enhancement)" -ForegroundColor Gray
Write-Host "    - 2 security issues" -ForegroundColor Gray
Write-Host "    - v0.4.0 release with notes" -ForegroundColor Gray
Write-Host ""
Write-Host "  Next steps:" -ForegroundColor White
Write-Host "    1. View issues: gh issue list" -ForegroundColor Gray
Write-Host "    2. View release: gh release view v0.4.0" -ForegroundColor Gray
Write-Host "    3. Assign milestones to issues in GitHub UI" -ForegroundColor Gray
Write-Host "       (gh CLI can't assign milestones by name easily)" -ForegroundColor Gray
Write-Host "    4. Bookmark: https://github.com/jecastrom/dost_lager/issues" -ForegroundColor Gray
Write-Host ""
Write-Host "  Going forward:" -ForegroundColor White
Write-Host "    - New bug? 'gh issue create --label bug'" -ForegroundColor Gray
Write-Host "    - Fixed something? 'gh issue close 42'" -ForegroundColor Gray
Write-Host "    - New release? 'gh release create v0.5.0 --generate-notes'" -ForegroundColor Gray
Write-Host ""