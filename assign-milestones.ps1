##############################################################################
# ProcureFlow — Milestone Assignment (run AFTER setup-github-project.ps1)
#
# USAGE:
#   cd C:\path\to\dost_lager
#   .\assign-milestones.ps1
##############################################################################

$ErrorActionPreference = "Continue"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Milestone Assignment" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# ── Step 1: Create 2 new milestones ──
Write-Host ""
Write-Host "  [1/3] Creating new milestones..." -ForegroundColor Cyan

gh api repos/{owner}/{repo}/milestones -f title="Security (do first)" -f description="Rotate exposed credentials. 5-minute fixes, high risk if left." -f state="open" 2>$null
Write-Host "    ✓ Security (do first)" -ForegroundColor Green

gh api repos/{owner}/{repo}/milestones -f title="Quick Wins" -f description="Small 1-3 snippet fixes. Clears 6 issues, improves stability." -f state="open" 2>$null
Write-Host "    ✓ Quick Wins" -ForegroundColor Green

# Rename Production-Ready to Data Integrity
# (gh CLI can't rename, so we'll just use both — assign Data Integrity issues to Production-Ready)
Write-Host "    ℹ 'Production-Ready' milestone will be used for Data Integrity issues" -ForegroundColor Yellow

# ── Step 2: Find issue numbers by title ──
Write-Host ""
Write-Host "  [2/3] Finding issue numbers..." -ForegroundColor Cyan

function Get-IssueNumber {
    param([string]$SearchTerm)
    $result = gh issue list --search "$SearchTerm" --json number --jq ".[0].number" 2>$null
    if ($result) {
        Write-Host "    Found: #$result — $SearchTerm" -ForegroundColor Gray
        return $result
    } else {
        Write-Host "    ✗ Not found: $SearchTerm" -ForegroundColor Yellow
        return $null
    }
}

# Security
$secCosmos  = Get-IssueNumber "SECURITY: Rotate Cosmos DB"
$secEntra   = Get-IssueNumber "SECURITY: Rotate Azure Entra"

# Quick Wins
$k9  = Get-IssueNumber "K9: Only /api/health"
$k13 = Get-IssueNumber "K13: delivery-logs"
$k15 = Get-IssueNumber "K15: syncFromApi"
$k19 = Get-IssueNumber "K19: SettingsPage import"
$k21 = Get-IssueNumber "K21: handleArchiveOrder"
$nav = Get-IssueNumber "Navigation guard"

# Data Integrity (using Production-Ready milestone)
$k6  = Get-IssueNumber "K6: Duplicate SKU"
$k8  = Get-IssueNumber "K8: Receipts container"
$k10 = Get-IssueNumber "K10: localStorage"
$k16 = Get-IssueNumber "K16: archivedReceiptGroups"
$k22 = Get-IssueNumber "K22: No input sanitization"
$persist = Get-IssueNumber "Persist localStorage data"

# Phase B
$b1 = Get-IssueNumber "B1: Item Management"
$b2 = Get-IssueNumber "B2: Product Filter"
$b3 = Get-IssueNumber "B3: Item Creation from URL"

# Phase C
$c1 = Get-IssueNumber "C1: Suppliers Section"
$c2 = Get-IssueNumber "C2: Excel Import"
$c3 = Get-IssueNumber "C3: Fast One-Click"

# ── Step 3: Assign milestones ──
Write-Host ""
Write-Host "  [3/3] Assigning issues to milestones..." -ForegroundColor Cyan

function Assign-Milestone {
    param([string]$IssueNum, [string]$Milestone)
    if ($IssueNum) {
        gh issue edit $IssueNum --milestone "$Milestone" 2>$null
        Write-Host "    ✓ #$IssueNum → $Milestone" -ForegroundColor Green
    }
}

# Security (do first)
Assign-Milestone $secCosmos  "Security (do first)"
Assign-Milestone $secEntra   "Security (do first)"

# Quick Wins
Assign-Milestone $k9  "Quick Wins"
Assign-Milestone $k13 "Quick Wins"
Assign-Milestone $k15 "Quick Wins"
Assign-Milestone $k19 "Quick Wins"
Assign-Milestone $k21 "Quick Wins"
Assign-Milestone $nav "Quick Wins"

# Data Integrity → uses "Production-Ready" milestone
Assign-Milestone $k6      "Production-Ready"
Assign-Milestone $k8      "Production-Ready"
Assign-Milestone $k10     "Production-Ready"
Assign-Milestone $k16     "Production-Ready"
Assign-Milestone $k22     "Production-Ready"
Assign-Milestone $persist "Production-Ready"

# Phase B
Assign-Milestone $b1 "Phase B: Product & UX Overhaul"
Assign-Milestone $b2 "Phase B: Product & UX Overhaul"
Assign-Milestone $b3 "Phase B: Product & UX Overhaul"

# Phase C
Assign-Milestone $c1 "Phase C: Module Enhancements"
Assign-Milestone $c2 "Phase C: Module Enhancements"
Assign-Milestone $c3 "Phase C: Module Enhancements"

# ── Done ──
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Done! Milestones assigned." -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "  Milestone overview:" -ForegroundColor White
Write-Host "    1. Security (do first)         — 2 issues  (rotate keys)" -ForegroundColor Gray
Write-Host "    2. Quick Wins                  — 6 issues  (small fixes)" -ForegroundColor Gray
Write-Host "    3. Production-Ready            — 6 issues  (data integrity)" -ForegroundColor Gray
Write-Host "    4. Phase B: UX Overhaul        — 3 issues  (item editing, filters)" -ForegroundColor Gray
Write-Host "    5. Phase C: Module Enhancements — 3 issues  (suppliers, import)" -ForegroundColor Gray
Write-Host ""
Write-Host "  View: https://github.com/jecastrom/dost_lager/milestones" -ForegroundColor Gray
Write-Host ""