# ProcureFlow (DOST Lager) — Deployment Guide

**Version:** 4.0 (Battle-Tested Edition)  
**Last Updated:** March 2026  
**Audience:** System Owner / IT Administrator  
**Time Required:** ~30 minutes (one-time setup)

---

## What This Guide Does

This guide walks you through deploying ProcureFlow from scratch on Microsoft Azure. It was written and tested through an actual deployment — every gotcha and manual step documented here was encountered in real life.

**What gets created:**

| Resource | Purpose | Monthly Cost |
|----------|---------|-------------|
| Azure Static Web App | Hosts web app + API functions | €0 (Free tier) |
| Azure Cosmos DB | Cloud database | €0 (Free tier) |
| Azure Key Vault | Stores secrets securely | ~€0.03 |
| Entra ID App Registration | Microsoft login for users | €0 (included with M365) |
| GitHub Actions Pipeline | Builds and deploys code | €0 |

**Estimated total: €0–2/month**

---

## Before You Begin — Important Notes

### Globally Unique Names

Several Azure resources require **globally unique names** (unique across ALL Azure customers worldwide). The YAML workflow file contains these as environment variables. **You MUST change them** before your first deployment:

| Variable in YAML | Default Value | What It Is | Must Be Unique? |
|-----------------|---------------|-----------|----------------|
| `COSMOS_ACCOUNT` | `cosmos-procureflow` | Cosmos DB account name | **YES — globally** |
| `KEY_VAULT_NAME` | `kv-procureflow` | Key Vault name | **YES — globally** |
| `SWA_NAME` | `swa-procureflow` | Static Web App name | **YES — globally** |
| `RESOURCE_GROUP` | `rg-procureflow-prod` | Resource group name | No (per-subscription) |
| `ENTRA_APP_NAME` | `ProcureFlow` | App registration name | No (per-tenant) |

**Recommendation:** Append your company name or a short identifier, e.g.:
- `cosmos-procureflow-acme`
- `kv-procureflow-acme`
- `swa-procureflow-acme`

### M365 Requirement for Profile Photos

The avatar photo feature (`/api/user-photo`) requires a **Microsoft 365 Business** tenant. Free Outlook.com / consumer Microsoft accounts do not support the Graph API photo endpoint. If you're on a consumer account, avatars will display initials instead — this is a Microsoft platform limitation, not a bug.

### What's Automated vs. Manual

| Step | Automated (YAML) | Manual (You) |
|------|:-:|:-:|
| Resource Group, Cosmos DB, Key Vault, SWA | ✅ | |
| Resource provider registration | ✅ | |
| Cosmos DB containers | ✅ | |
| SWA app settings (COSMOS_CONNECTION) | ✅ | |
| Entra ID App Registration | ❌ | ✅ |
| Graph API permissions + admin consent | ❌ | ✅ |
| Key Vault secrets (Entra credentials) | ❌ | ✅ |
| SWA app settings (Graph credentials) | ❌ | ✅ |
| SWA deploy token → GitHub | ❌ | ✅ |
| GitHub secrets setup | ❌ | ✅ |

> **Why is Entra ID manual?** The GitHub Service Principal has `Contributor` role for Azure resources, but Entra ID (Azure AD) app management requires **directory-level permissions** that `Contributor` doesn't grant. Only a Global Admin or Application Administrator can create app registrations from the CLI.

---

## Prerequisites

- [ ] An **Azure subscription** (Pay-As-You-Go or Free Trial) — [Create one here](https://azure.microsoft.com/en-us/free/)
- [ ] **Azure CLI** installed — [Download here](https://aka.ms/installazurecli)
- [ ] **GitHub account** with access to the repository
- [ ] You are a **Global Administrator** on your Entra ID tenant (you are automatically if it's your own Azure account)

---

## Phase 1 — Configure the YAML (5 min)

### Step 1.1 — Customize Resource Names

Open the workflow file (`.github/workflows/azure-static-web-apps-mango-beach-0bdbc9710.yml` or `deploy-procureflow.yml`) and edit the `env:` block at the top:

```yaml
env:
  RESOURCE_GROUP: rg-procureflow-prod          # Can keep as-is
  LOCATION: westeurope                          # Change if needed
  SWA_NAME: swa-procureflow-YOURCOMPANY         # ⚠️ MUST be globally unique
  COSMOS_ACCOUNT: cosmos-procureflow-YOURCOMPANY # ⚠️ MUST be globally unique
  COSMOS_DB: procureflow-db                     # Can keep as-is
  KEY_VAULT_NAME: kv-procureflow-YOURCOMPANY    # ⚠️ MUST be globally unique
  ENTRA_APP_NAME: ProcureFlow                   # Can keep as-is
```

### Step 1.2 — Update the Deploy Token Secret Name

In the same YAML, find the `build_and_deploy` job and note the secret name used for `azure_static_web_apps_api_token`. You'll create this secret in GitHub after the SWA is provisioned. If you want a clean name, change it now (e.g., `AZURE_STATIC_WEB_APPS_API_TOKEN_MY_APP`). Remember the name — you'll need it in Phase 3.

Also update the `close_pull_request` job to use the **same** secret name.

Commit and push.

---

## Phase 2 — Azure CLI Setup (10 min)

### Step 2.1 — Login to Azure

Open **PowerShell** (Windows) or **Terminal** (Mac/Linux):

```powershell
az login
```

A browser opens — sign in with your Azure account. Then verify:

```powershell
az account show --query "{name:name, id:id}" -o table
```

If you have multiple subscriptions, switch to the correct one:

```powershell
# List all subscriptions
az account list --output table

# Switch to the one you want
az account set --subscription "Your Subscription Name"
```

### Step 2.2 — Create a Service Principal for GitHub

```powershell
$SUB_ID = az account show --query id -o tsv

az ad sp create-for-rbac `
  --name "github-procureflow" `
  --role Contributor `
  --scopes "/subscriptions/$SUB_ID" `
  --sdk-auth
```

This prints a JSON block. **Copy the ENTIRE output** — you need it for GitHub secrets.

⚠️ Do NOT share this JSON. It grants access to your Azure subscription.

---

## Phase 3 — GitHub Secrets (5 min)

### Step 3.1 — Repository Secrets

Go to: **GitHub repo → Settings → Secrets and variables → Actions → New repository secret**

| Secret Name | Value |
|-------------|-------|
| `AZURE_CREDENTIALS` | The **entire JSON** from Step 2.2 |

> The SWA deploy token secret will be added after Phase 4.

### Step 3.2 — Environment Secrets

Go to: **GitHub repo → Settings → Environments → New environment**

Create an environment called **`Production`**, then add these secrets:

| Secret Name | Value |
|-------------|-------|
| `ADMIN_EMAIL` | Your Azure/M365 email address |
| `ADMIN_FIRST_NAME` | Your first name |
| `ADMIN_LAST_NAME` | Your last name |

---

## Phase 4 — Provision Infrastructure (10 min)

### Step 4.1 — Run the YAML (Partial)

Go to: **GitHub repo → Actions → "ProcureFlow — Deploy & Provision" → Run workflow**

- **What to do:** `provision-infra`
- Leave admin fields empty

Click **"Run workflow"** and wait. This creates: Resource Group, Cosmos DB, Key Vault, and SWA.

> **Expected:** The Entra ID step will likely **fail** — this is normal. The Service Principal doesn't have directory permissions. Everything else should be green. Continue to Step 4.2.

### Step 4.2 — Get the SWA Deploy Token

After the SWA is created (even if the overall job failed on the Entra step), run:

```powershell
az staticwebapp secrets list `
  --name YOUR-SWA-NAME `
  --resource-group rg-procureflow-prod `
  --query "properties.apiKey" -o tsv
```

Copy the output and add it as a **Repository Secret** in GitHub with the name you chose in Step 1.2.

### Step 4.3 — Get Your SWA URL

```powershell
az staticwebapp show `
  --name YOUR-SWA-NAME `
  --resource-group rg-procureflow-prod `
  --query "defaultHostname" -o tsv
```

Note this URL — you need it for the next step (e.g., `brave-wave-06ee56d03.4.azurestaticapps.net`).

---

## Phase 5 — Entra ID App Registration (Manual — 5 min)

This is the step that **must be done manually** by a Global Admin. Run all commands in the **same PowerShell session** so the variables persist.

### Step 5.1 — Create the App Registration

```powershell
# Replace with YOUR SWA URL from Step 4.3
$SWA_URL = "YOUR-SWA-HOSTNAME.azurestaticapps.net"

$APP_JSON = az ad app create `
  --display-name "ProcureFlow" `
  --web-redirect-uris "https://$SWA_URL/.auth/login/aad/callback" `
  --sign-in-audience AzureADMyOrg `
  --output json

$APP_ID = ($APP_JSON | ConvertFrom-Json).appId
$OBJ_ID = ($APP_JSON | ConvertFrom-Json).id
echo "App ID: $APP_ID"
```

### Step 5.2 — Create a Client Secret

```powershell
$SECRET_JSON = az ad app credential reset `
  --id $OBJ_ID `
  --display-name "ProcureFlow-Secret" `
  --years 2 `
  --output json

$CLIENT_SECRET = ($SECRET_JSON | ConvertFrom-Json).password
echo "Secret created (do not share)"
```

### Step 5.3 — Store Credentials in Key Vault

First, grant yourself access to the Key Vault:

```powershell
$MY_OID = az ad signed-in-user show --query id -o tsv

az keyvault set-policy `
  --name YOUR-KEY-VAULT-NAME `
  --resource-group rg-procureflow-prod `
  --object-id $MY_OID `
  --secret-permissions get set list `
  --output none
```

Then store the secrets:

```powershell
az keyvault secret set `
  --vault-name YOUR-KEY-VAULT-NAME `
  --name "EntraClientId" `
  --value "$APP_ID" `
  --output none

# Use file method to avoid special character issues
$CLIENT_SECRET | Out-File -Encoding ascii -NoNewline secret.tmp
az keyvault secret set `
  --vault-name YOUR-KEY-VAULT-NAME `
  --name "EntraClientSecret" `
  --file secret.tmp `
  --output none
Remove-Item secret.tmp

echo "Secrets stored in Key Vault"
```

### Step 5.4 — Add Graph API Permission (for profile photos)

```powershell
az ad app permission add `
  --id $APP_ID `
  --api 00000003-0000-0000-c000-000000000000 `
  --api-permissions df021288-bdef-4463-88db-98f22de89214=Role

az ad app permission admin-consent --id $APP_ID
echo "Admin consent granted"
```

> **Note:** This requires Global Admin. If the consent command fails, go to Azure Portal → Entra ID → App registrations → ProcureFlow → API permissions → click "Grant admin consent".

### Step 5.5 — Set SWA App Settings

```powershell
$TENANT_ID = az account show --query tenantId -o tsv

az staticwebapp appsettings set `
  -n YOUR-SWA-NAME `
  --resource-group rg-procureflow-prod `
  --setting-names `
    "AZURE_TENANT_ID=$TENANT_ID" `
    "AZURE_CLIENT_ID=$APP_ID" `
    "AZURE_CLIENT_SECRET=$CLIENT_SECRET"
```

### Step 5.6 — Update GitHub Environment Secrets

Go to GitHub → **Settings → Environments → Production** and update/add:

| Secret Name | Value |
|-------------|-------|
| `AZURE_AD_TENANT_ID` | The value of `$TENANT_ID` (run `echo $TENANT_ID`) |
| `AZURE_CLIENT_ID` | The value of `$APP_ID` (run `echo $APP_ID`) |
| `AZURE_CLIENT_SECRET` | The value of `$CLIENT_SECRET` (run `echo $CLIENT_SECRET`) |

---

## Phase 6 — Deploy & Seed (5 min)

### Step 6.1 — Deploy the Application

Go to GitHub Actions → Run workflow → **`deploy-only`**

Wait for the green checkmark. Your app is now live at:
👉 `https://YOUR-SWA-HOSTNAME.azurestaticapps.net`

### Step 6.2 — Seed Your Admin Account

Run workflow again → **`seed-admin-only`**

Fill in your admin email, first name, and last name (or leave empty to use the environment secrets).

### Step 6.3 — Sign In and Verify

1. Open your app URL
2. Click **"Mit Microsoft anmelden"**
3. Sign in with the email you used for seeding
4. You should see the ProcureFlow dashboard

**✅ Deployment complete!**

---

## Post-Deployment: What Happens Next

| Action | Result |
|--------|--------|
| Push code to `master` | App automatically rebuilds and deploys (~2 min) |
| Open a Pull Request | Preview build runs |
| Merge a Pull Request | Auto-deploys merged changes |

**No manual deployment steps needed ever again.**

---

## Adding Team Members

As admin, go to **Globale Einstellungen → Team-Verwaltung → Neuer Benutzer**. Enter their Microsoft 365 email, name, and role. They just visit the app URL and sign in — automatic.

---

## Profile Photo Feature

The avatar shows the user's Microsoft 365 profile photo. Requirements:

- Users must be in an **M365 Business** (or higher) tenant — consumer Outlook.com accounts don't support this
- `User.Read.All` application permission must have admin consent (done in Phase 5.4)
- The three `AZURE_*` env vars must be set on the SWA (done in Phase 5.5)
- Users must have a photo set at https://myaccount.microsoft.com

If any condition isn't met, the avatar silently falls back to initials (e.g., "JC"). No errors, no broken UI.

---

## Troubleshooting

### "Zugang ausstehend" (Access Pending) after login
User profile hasn't been created. Run `seed-admin-only` for the admin, or add the user via Team Management.

### Entra ID step fails in YAML
Expected — the Service Principal lacks directory permissions. Complete Phase 5 manually.

### Key Vault "Forbidden" errors
Grant yourself access: `az keyvault set-policy --name YOUR-KV --object-id $(az ad signed-in-user show --query id -o tsv) --secret-permissions get set list`

### "DNS record already taken" for Cosmos/Key Vault
The name is globally taken. Change `COSMOS_ACCOUNT` or `KEY_VAULT_NAME` in the YAML to something unique.

### "MissingSubscriptionRegistration" errors
New subscription needs resource providers registered. The YAML does this automatically now, but if it fails, run manually:
```powershell
az provider register --namespace Microsoft.DocumentDB
az provider register --namespace Microsoft.KeyVault
az provider register --namespace Microsoft.Web
```

### Avatar shows initials instead of photo
Check: (1) M365 Business tenant? (2) User has photo set? (3) `AZURE_TENANT_ID`/`CLIENT_ID`/`CLIENT_SECRET` set on SWA? (4) Admin consent granted for `User.Read.All`?

### Build fails in GitHub Actions
Check the deploy token secret matches the name in the YAML `azure_static_web_apps_api_token` field.

---

## Tearing Down (Delete Everything)

```powershell
# ⚠️ THIS DELETES EVERYTHING — all data will be lost!
az group delete --name rg-procureflow-prod --yes --no-wait
az ad app delete --id $(az ad app list --display-name "ProcureFlow" --query "[0].appId" -o tsv)
az ad sp delete --id $(az ad sp list --display-name "github-procureflow" --query "[0].id" -o tsv)
```

---

## Quick Reference

| Resource | Value |
|----------|-------|
| **App URL** | `https://YOUR-SWA-HOSTNAME.azurestaticapps.net` |
| **GitHub Repo** | https://github.com/jecastrom/dost_lager |
| **GitHub Actions** | https://github.com/jecastrom/dost_lager/actions |
| **Azure Portal** | https://portal.azure.com |
| **Resource Group** | `rg-procureflow-prod` |
| **Region** | West Europe |