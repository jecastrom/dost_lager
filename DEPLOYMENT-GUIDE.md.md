# ProcureFlow (DOST Lager) — Deployment Guide

**Version:** 3.0  
**Last Updated:** March 2026  
**Audience:** System Owner / IT Administrator  
**Time Required:** ~20 minutes (one-time setup)

---

## What This Guide Does

This guide walks you through deploying ProcureFlow from scratch on Microsoft Azure.  
After completing these steps, the app will be live and auto-deploy on every code update.

**What gets created automatically:**

| Resource | Purpose | Monthly Cost |
|----------|---------|-------------|
| Azure Static Web App | Hosts the web application | €0 (Free tier) |
| Azure Cosmos DB | Cloud database | €0 (Free tier) |
| Azure Key Vault | Stores secrets securely | ~€0.03 |
| Entra ID App Registration | Microsoft login for users | €0 (included with M365) |
| GitHub Actions Pipeline | Builds and deploys code | €0 (Free for public/private repos) |

**Estimated total: €0–2/month**

---

## Prerequisites

Before you begin, make sure you have:

- [ ] An **Azure subscription** (Pay-As-You-Go or Free Trial)  
      → [Create one here](https://azure.microsoft.com/en-us/free/) if needed
- [ ] **Azure CLI** installed on your computer  
      → [Download here](https://aka.ms/installazurecli)
- [ ] **GitHub account** with access to the `jecastrom/dost_lager` repository
- [ ] The **admin email address** — this is the email address tied to your Azure / Microsoft 365 subscription (e.g., `j.castro@dost-infosys.de`)

---

## Step 1 — Login to Azure CLI

Open **PowerShell** (Windows) or **Terminal** (Mac/Linux).

**First, check if you're already logged in:**

```powershell
az account show --query "{name:name, id:id}" -o table
```

**If you see your subscription name and ID → you're already logged in. Skip to the verification step below.**

**If you get an error ("Please run 'az login'") → run this:**

```powershell
az login
```

> A browser window will open automatically. Select your Azure account and sign in.  
> If the browser doesn't open, or you're on a machine without a browser, use:  
> `az login --use-device-code`  
> (This shows a code and URL — open the URL in any browser and enter the code.)

**Verify you're on the correct subscription:**

```powershell
az account show --query "{name:name, id:id}" -o table
```

You should see your subscription name and ID. If it's wrong, switch with:

```powershell
az account set --subscription "YOUR_SUBSCRIPTION_NAME"
```

---

## Step 2 — Create a Service Principal for GitHub

This creates a secure identity that allows GitHub Actions to manage your Azure resources.

**Copy and paste this command exactly:**

```powershell
az ad sp create-for-rbac `
  --name "github-procureflow" `
  --role Contributor `
  --scopes /subscriptions/$(az account show --query id -o tsv) `
  --sdk-auth
```

**⚠️ IMPORTANT:** This will print a JSON block like this:

```json
{
  "clientId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "clientSecret": "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "subscriptionId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "tenantId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  ...
}
```

**Copy the ENTIRE JSON output.** You will need it in the next step.  
⚠️ Do NOT share this with anyone. It grants access to your Azure subscription.

---

## Step 3 — Add Secrets to GitHub

Go to: **https://github.com/jecastrom/dost_lager/settings/secrets/actions**

Click **"New repository secret"** and add these secrets one by one:

| Secret Name | Value |
|-------------|-------|
| `AZURE_CREDENTIALS` | The **entire JSON output** from Step 2 |

> **Note:** The `AZURE_STATIC_WEB_APPS_API_TOKEN_MANGO_BEACH_0BDBC9710` secret should already exist from the initial SWA setup. If it doesn't, you'll get it in Step 5.

---

## Step 4 — Add the Workflow File

The deployment pipeline is a single file. Place it in your repository at:

```
.github/workflows/deploy-procureflow.yml
```

> This file replaces the old `azure-static-web-apps-mango-beach-0bdbc9710.yml` workflow.  
> You can delete the old file after adding the new one.

**How to add it:**

1. Copy the `deploy-procureflow.yml` file provided with this guide
2. In your local repository, place it at `.github/workflows/deploy-procureflow.yml`
3. If the old workflow file exists, delete `.github/workflows/azure-static-web-apps-mango-beach-0bdbc9710.yml`
4. Commit and push:

```powershell
git add .github/workflows/
git commit -m "feat: unified deployment pipeline v3"
git push
```

---

## Step 5 — Run Infrastructure Provisioning

1. Go to: **https://github.com/jecastrom/dost_lager/actions**
2. In the left sidebar, click **"ProcureFlow — Deploy & Provision"**
3. Click the **"Run workflow"** button (top right)
4. In the dropdown:
   - **What to do:** Select **`provision-infra`**
   - Leave other fields empty
5. Click **"Run workflow"**

**⏳ This takes 5–10 minutes.** It will:

- Create the Azure Resource Group
- Create Cosmos DB with all 8 database containers
- Create the Key Vault and store the database connection string
- Create the Static Web App
- Register the Entra ID app (Microsoft login)
- Configure everything to work together

**Watch the progress** in the Actions tab. When the green checkmark appears, infrastructure is ready.

> **If the SWA deploy token wasn't set before:** After this step, get the token:
> ```powershell
> az staticwebapp secrets list --name swa-procureflow --resource-group rg-procureflow-prod --query "properties.apiKey" -o tsv
> ```
> Add the output as GitHub secret `AZURE_STATIC_WEB_APPS_API_TOKEN_MANGO_BEACH_0BDBC9710`.

---

## Step 6 — Deploy the Application

Push any change to the `master` branch (or just re-run the workflow with **"deploy-only"**):

```powershell
git push
```

GitHub Actions will automatically build and deploy the app. Wait for the green checkmark in the Actions tab.

**Your app is now live at:**  
👉 **https://mango-beach-0bdbc9710.1.azurestaticapps.net**

---

## Step 7 — Get Your User ID

Before you can access the app, you need to register yourself as the first admin user.  
To do this, you need your Azure authentication User ID.

1. Open your browser and go to:  
   👉 **https://mango-beach-0bdbc9710.1.azurestaticapps.net/.auth/login/aad**

2. Sign in with your **Azure / Microsoft 365 email**  
   (this is the same email you use for Outlook, Teams, etc.)

3. After signing in, go to:  
   👉 **https://mango-beach-0bdbc9710.1.azurestaticapps.net/.auth/me**

4. You will see a JSON response. Find the `"userId"` field — it looks like this:

   ```json
   {
     "clientPrincipal": {
       "userId": "abcdef1234567890abcdef1234567890",
       ...
     }
   }
   ```

5. **Copy the `userId` value.** You'll need it in the next step.

---

## Step 8 — Seed Your Admin Account

Now register yourself as the first admin user. Open PowerShell and run:

```powershell
# ═══════════════════════════════════════════════════
# FILL IN YOUR DETAILS BELOW
# ═══════════════════════════════════════════════════

$userId    = "PASTE_YOUR_USERID_FROM_STEP_7"
$email     = "YOUR_AZURE_EMAIL@company.com"
$firstName = "YOUR_FIRST_NAME"
$lastName  = "YOUR_LAST_NAME"

# ═══════════════════════════════════════════════════
# DO NOT EDIT BELOW THIS LINE
# ═══════════════════════════════════════════════════

$body = @{
    id            = $userId
    email         = $email
    firstName     = $firstName
    lastName      = $lastName
    role          = "admin"
    featureAccess = @(
        "stock", "audit", "receipts", "orders",
        "suppliers", "settings", "global-settings"
    )
    isActive      = $true
    createdAt     = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
    createdBy     = "deployment-guide-seed"
    docType       = "user-profile"
} | ConvertTo-Json

$swaUrl = "https://mango-beach-0bdbc9710.1.azurestaticapps.net"

Invoke-RestMethod -Uri "$swaUrl/api/user-profiles" -Method POST -Body $body -ContentType "application/json"
```

If successful, you'll see a JSON response with your profile data.

---

## Step 9 — Verify Everything Works

1. Open **https://mango-beach-0bdbc9710.1.azurestaticapps.net**
2. Click **"Mit Microsoft anmelden"** (Sign in with Microsoft)
3. Sign in with the same email you entered in Step 8
4. The system will automatically match your email and grant you admin access
5. You should see the ProcureFlow dashboard

**✅ Congratulations — ProcureFlow is deployed and you're the admin!**

> **What just happened?** When you signed in, the app looked up your email in the database,
> matched it to the admin profile you created in Step 8, and automatically linked your
> Microsoft account. This same process happens for every new team member you add later —
> they just sign in and they're in.

---

## What Happens Next

From now on, the app auto-deploys. Here's how:

| Action | Result |
|--------|--------|
| Push code to `master` branch | App automatically rebuilds and deploys (~2 min) |
| Open a Pull Request | Preview build runs automatically |
| Merge a Pull Request | App auto-deploys the merged changes |

**No manual deployment steps needed ever again.**

---

## Adding Team Members

As the admin, you can add team members from within the app:

1. Go to **Globale Einstellungen** (Global Settings)
2. Click **Team-Verwaltung** (Team Management)
3. Click **Neuer Benutzer** (New User)
4. Enter their name, **Microsoft 365 email address**, and role
5. Select which modules they can access

That's it. Tell the new team member to visit the app URL and sign in with their Microsoft account.  
The system will automatically recognize their email and grant them access — no extra steps needed.

---

## Troubleshooting

### "Zugang ausstehend" (Access Pending) after login
Your user profile hasn't been created yet, or the userId doesn't match.  
Go to `/.auth/me`, copy your userId, and re-run Step 8 with the correct value.

### API endpoints return 404
Check the GitHub Actions build — the API may have failed to compile.  
Go to Actions tab → latest build → look for red ✗ marks.

### "Konto deaktiviert" (Account Deactivated)
An admin has deactivated your account. Contact your system administrator.

### Build fails in GitHub Actions
Check that `AZURE_STATIC_WEB_APPS_API_TOKEN_MANGO_BEACH_0BDBC9710` is set correctly in GitHub Secrets.

---

## Tearing Down (Delete Everything)

If you ever need to remove all Azure resources:

```powershell
# ⚠️ THIS DELETES EVERYTHING — all data will be lost!
az group delete --name rg-procureflow-prod --yes --no-wait
az ad app delete --id $(az ad app list --display-name "ProcureFlow" --query "[0].appId" -o tsv)
az ad sp delete --id $(az ad sp list --display-name "github-procureflow" --query "[0].id" -o tsv)
```

---

## Quick Reference

| Resource | URL / Name |
|----------|-----------|
| **App** | https://mango-beach-0bdbc9710.1.azurestaticapps.net |
| **GitHub Repo** | https://github.com/jecastrom/dost_lager |
| **GitHub Actions** | https://github.com/jecastrom/dost_lager/actions |
| **Azure Portal** | https://portal.azure.com |
| **Resource Group** | rg-procureflow-prod |
| **Cosmos DB** | cosmos-procureflow |
| **Key Vault** | kv-procureflow |
| **Region** | West Europe |