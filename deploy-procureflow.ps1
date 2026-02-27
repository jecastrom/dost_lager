##############################################################################
# ProcureFlow - Azure One-Shot Deployment Script
# Provisions: Resource Group, Static Web Apps, Azure Functions,
#             Cosmos DB, Key Vault, Entra ID App Registration
# Region: West Europe
# GitHub: jecastrom/dost_lager
##############################################################################

# ============================================================================
# CONFIGURATION - Edit these if needed
# ============================================================================
$config = @{
    # General
    ResourceGroup    = "rg-procureflow-prod"
    Location         = "westeurope"
    
    # Static Web App
    SwaName          = "swa-procureflow"
    SwaSku           = "Free"
    
    # Azure Functions
    FuncAppName      = "func-procureflow"
    FuncStorageName  = "stprocureflowfunc"   # must be lowercase, no hyphens, max 24 chars
    FuncRuntime      = "node"
    FuncRuntimeVer   = "20"
    
    # Cosmos DB
    CosmosAccount    = "cosmos-procureflow"
    CosmosDb         = "procureflow-db"
    CosmosContainers = @(
        @{ Name = "purchase-orders"; PartitionKey = "/id" }
        @{ Name = "receipts"; PartitionKey = "/poId" }
        @{ Name = "delivery-logs"; PartitionKey = "/receiptId" }
        @{ Name = "stock"; PartitionKey = "/sku" }
        @{ Name = "suppliers"; PartitionKey = "/id" }
        @{ Name = "tickets"; PartitionKey = "/poId" }
        @{ Name = "notifications"; PartitionKey = "/userId" }
    )
    
    # Key Vault
    KeyVaultName     = "kv-procureflow"
    
    # Entra ID App Registration
    EntraAppName     = "ProcureFlow"
    
    # GitHub
    GitHubUser       = "jecastrom"
    GitHubRepo       = "dost_lager"
    GitHubBranch     = "master"
}

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================
function Write-Step {
    param([string]$Step, [string]$Message)
    Write-Host ""
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host "  STEP ${Step}: $Message" -ForegroundColor Cyan
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
}

function Write-Success {
    param([string]$Message)
    Write-Host "  ✓ $Message" -ForegroundColor Green
}

function Write-Info {
    param([string]$Message)
    Write-Host "  ℹ $Message" -ForegroundColor Yellow
}

function Write-ErrorMsg {
    param([string]$Message)
    Write-Host "  ✗ $Message" -ForegroundColor Red
}

function Test-CommandSuccess {
    if ($LASTEXITCODE -ne 0) {
        Write-ErrorMsg "Last command failed with exit code $LASTEXITCODE"
        Write-ErrorMsg "Stopping script. Fix the error above and re-run."
        exit 1
    }
}

# ============================================================================
# PRE-FLIGHT CHECKS
# ============================================================================
Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════╗" -ForegroundColor Magenta
Write-Host "║   ProcureFlow - Azure One-Shot Deployment            ║" -ForegroundColor Magenta
Write-Host "║   Region: West Europe                                ║" -ForegroundColor Magenta
Write-Host "║   Repo:   jecastrom/dost_lager                       ║" -ForegroundColor Magenta
Write-Host "╚══════════════════════════════════════════════════════╝" -ForegroundColor Magenta
Write-Host ""

# Check Azure CLI is installed
Write-Info "Checking Azure CLI..."
$azVersion = az version 2>$null | ConvertFrom-Json
if (-not $azVersion) {
    Write-ErrorMsg "Azure CLI not found. Install from: https://aka.ms/installazurecli"
    exit 1
}
Write-Success "Azure CLI found (v$($azVersion.'azure-cli'))"

# Check GitHub CLI is installed (optional but helpful)
$ghInstalled = $false
$ghVersion = gh --version 2>$null
if ($ghVersion) {
    $ghInstalled = $true
    Write-Success "GitHub CLI found"
}
else {
    Write-Info "GitHub CLI not found (optional). Install from: https://cli.github.com"
}

# ============================================================================
# STEP 1: LOGIN TO AZURE
# ============================================================================
Write-Step "1/9" "Logging in to Azure"
Write-Info "A browser window will open for authentication..."

# Check if already logged in, if not use device code flow
$currentAccount = az account show 2>$null | ConvertFrom-Json
if (-not $currentAccount) {
    az login --use-device-code
    Test-CommandSuccess
}
else {
    Write-Success "Already logged in as $($currentAccount.user.name)"
}
Write-Success "Logged in to Azure"

# Show current subscription
$account = az account show | ConvertFrom-Json
Write-Info "Subscription: $($account.name) ($($account.id))"
Write-Info "Tenant: $($account.tenantId)"

$confirm = Read-Host "  Is this the correct subscription? (y/n)"
if ($confirm -ne "y") {
    Write-Info "List available subscriptions with: az account list --output table"
    Write-Info "Set subscription with: az account set --subscription <name-or-id>"
    exit 0
}

# ============================================================================
# STEP 2: CREATE RESOURCE GROUP
# ============================================================================
Write-Step "2/9" "Creating Resource Group"

az group create `
    --name $config.ResourceGroup `
    --location $config.Location `
    --tags project=procureflow environment=production `
    --output none
Test-CommandSuccess
Write-Success "Resource group '$($config.ResourceGroup)' created in $($config.Location)"

# ============================================================================
# STEP 3: CREATE STATIC WEB APP
# ============================================================================
Write-Step "3/9" "Creating Static Web App"
Write-Info "This hosts your React PWA with global CDN and HTTPS"

az staticwebapp create `
    --name $config.SwaName `
    --resource-group $config.ResourceGroup `
    --source "https://github.com/$($config.GitHubUser)/$($config.GitHubRepo)" `
    --branch $config.GitHubBranch `
    --app-location "/" `
    --output-location "dist" `
    --login-with-github `
    --sku $config.SwaSku `
    --output none
Test-CommandSuccess

$swaUrl = az staticwebapp show `
    --name $config.SwaName `
    --resource-group $config.ResourceGroup `
    --query "defaultHostname" --output tsv
Write-Success "Static Web App created: https://$swaUrl"

# ============================================================================
# STEP 4: CREATE STORAGE ACCOUNT (required for Azure Functions)
# ============================================================================
Write-Step "4/9" "Creating Storage Account for Functions"

az storage account create `
    --name $config.FuncStorageName `
    --resource-group $config.ResourceGroup `
    --location $config.Location `
    --sku Standard_LRS `
    --kind StorageV2 `
    --tags project=procureflow `
    --output none
Test-CommandSuccess
Write-Success "Storage account '$($config.FuncStorageName)' created"

# ============================================================================
# STEP 5: CREATE AZURE FUNCTIONS APP
# ============================================================================
Write-Step "5/9" "Creating Azure Functions App (Consumption Plan)"
Write-Info "Serverless API backend - pay only when code runs"

az functionapp create `
    --name $config.FuncAppName `
    --resource-group $config.ResourceGroup `
    --storage-account $config.FuncStorageName `
    --consumption-plan-location $config.Location `
    --runtime $config.FuncRuntime `
    --runtime-version $config.FuncRuntimeVer `
    --functions-version 4 `
    --os-type Linux `
    --tags project=procureflow `
    --output none
Test-CommandSuccess
Write-Success "Functions app '$($config.FuncAppName)' created"

# Enable CORS for the Static Web App
Write-Info "Configuring CORS..."
az functionapp cors add `
    --name $config.FuncAppName `
    --resource-group $config.ResourceGroup `
    --allowed-origins "https://$swaUrl" `
    --output none
Test-CommandSuccess
Write-Success "CORS configured for https://$swaUrl"

# ============================================================================
# STEP 6: CREATE COSMOS DB (Free Tier)
# ============================================================================
Write-Step "6/9" "Creating Cosmos DB Account (Free Tier)"
Write-Info "This may take 3-5 minutes..."

az cosmosdb create `
    --name $config.CosmosAccount `
    --resource-group $config.ResourceGroup `
    --locations regionName=$config.Location failoverPriority=0 `
    --default-consistency-level Session `
    --enable-free-tier true `
    --tags project=procureflow `
    --output none
Test-CommandSuccess
Write-Success "Cosmos DB account '$($config.CosmosAccount)' created (FREE tier)"

# Create Database
Write-Info "Creating database '$($config.CosmosDb)'..."
az cosmosdb sql database create `
    --account-name $config.CosmosAccount `
    --resource-group $config.ResourceGroup `
    --name $config.CosmosDb `
    --output none
Test-CommandSuccess
Write-Success "Database '$($config.CosmosDb)' created"

# Create Containers
foreach ($container in $config.CosmosContainers) {
    Write-Info "Creating container '$($container.Name)'..."
    az cosmosdb sql container create `
        --account-name $config.CosmosAccount `
        --resource-group $config.ResourceGroup `
        --database-name $config.CosmosDb `
        --name $container.Name `
        --partition-key-path $container.PartitionKey `
        --throughput 400 `
        --output none
    Test-CommandSuccess
    Write-Success "Container '$($container.Name)' created (partition: $($container.PartitionKey))"
}

# ============================================================================
# STEP 7: CREATE KEY VAULT
# ============================================================================
Write-Step "7/9" "Creating Key Vault"

az keyvault create `
    --name $config.KeyVaultName `
    --resource-group $config.ResourceGroup `
    --location $config.Location `
    --tags project=procureflow `
    --output none
Test-CommandSuccess
Write-Success "Key Vault '$($config.KeyVaultName)' created"

# Store Cosmos DB connection string in Key Vault
Write-Info "Storing Cosmos DB connection string in Key Vault..."
$cosmosConnStr = az cosmosdb keys list `
    --name $config.CosmosAccount `
    --resource-group $config.ResourceGroup `
    --type connection-strings `
    --query "connectionStrings[0].connectionString" --output tsv

az keyvault secret set `
    --vault-name $config.KeyVaultName `
    --name "CosmosDbConnectionString" `
    --value $cosmosConnStr `
    --output none
Test-CommandSuccess
Write-Success "Cosmos DB connection string stored in Key Vault"

# Grant Functions app access to Key Vault
Write-Info "Granting Functions app access to Key Vault..."
az functionapp identity assign `
    --name $config.FuncAppName `
    --resource-group $config.ResourceGroup `
    --output none
Test-CommandSuccess

$funcPrincipalId = az functionapp identity show `
    --name $config.FuncAppName `
    --resource-group $config.ResourceGroup `
    --query "principalId" --output tsv

az keyvault set-policy `
    --name $config.KeyVaultName `
    --object-id $funcPrincipalId `
    --secret-permissions get list `
    --output none
Test-CommandSuccess
Write-Success "Functions app can now read secrets from Key Vault"

# Configure Functions app to use Key Vault reference for Cosmos
$kvReference = "@Microsoft.KeyVault(SecretUri=https://$($config.KeyVaultName).vault.azure.net/secrets/CosmosDbConnectionString/)"
az functionapp config appsettings set `
    --name $config.FuncAppName `
    --resource-group $config.ResourceGroup `
    --settings "COSMOS_CONNECTION=$kvReference" `
    --output none
Test-CommandSuccess
Write-Success "Functions app configured with Key Vault reference"

# ============================================================================
# STEP 8: REGISTER ENTRA ID APP (for MS365 auth)
# ============================================================================
Write-Step "8/9" "Registering Entra ID App (for authentication)"

$swaRedirectUri = "https://$swaUrl/.auth/login/aad/callback"

$entraApp = az ad app create `
    --display-name $config.EntraAppName `
    --web-redirect-uris $swaRedirectUri `
    --sign-in-audience AzureADMyOrg `
    --output json | ConvertFrom-Json
Test-CommandSuccess

$entraAppId = $entraApp.appId
$entraObjectId = $entraApp.id
Write-Success "Entra ID app registered: $($config.EntraAppName)"
Write-Info "Application (client) ID: $entraAppId"

# Create a client secret for the app
$secretResult = az ad app credential reset `
    --id $entraObjectId `
    --display-name "ProcureFlow-Secret" `
    --years 2 `
    --output json | ConvertFrom-Json
$entraClientSecret = $secretResult.password

# Store Entra credentials in Key Vault
az keyvault secret set `
    --vault-name $config.KeyVaultName `
    --name "EntraClientId" `
    --value $entraAppId `
    --output none

az keyvault secret set `
    --vault-name $config.KeyVaultName `
    --name "EntraClientSecret" `
    --value $entraClientSecret `
    --output none
Test-CommandSuccess
Write-Success "Entra credentials stored in Key Vault"

# ============================================================================
# STEP 9: SUMMARY & NEXT STEPS
# ============================================================================
Write-Step "9/9" "Deployment Complete!"

$cosmosEndpoint = az cosmosdb show `
    --name $config.CosmosAccount `
    --resource-group $config.ResourceGroup `
    --query "documentEndpoint" --output tsv

Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║   DEPLOYMENT COMPLETE - ALL RESOURCES CREATED        ║" -ForegroundColor Green
Write-Host "╚══════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "  RESOURCES CREATED:" -ForegroundColor White
Write-Host "  ──────────────────────────────────────────────────" -ForegroundColor DarkGray
Write-Host "  Resource Group:    $($config.ResourceGroup)" -ForegroundColor White
Write-Host "  Static Web App:    https://$swaUrl" -ForegroundColor White
Write-Host "  Functions App:     https://$($config.FuncAppName).azurewebsites.net" -ForegroundColor White
Write-Host "  Cosmos DB:         $cosmosEndpoint" -ForegroundColor White
Write-Host "  Key Vault:         https://$($config.KeyVaultName).vault.azure.net" -ForegroundColor White
Write-Host "  Entra App ID:      $entraAppId" -ForegroundColor White
Write-Host ""
Write-Host "  COSMOS DB CONTAINERS:" -ForegroundColor White
Write-Host "  ──────────────────────────────────────────────────" -ForegroundColor DarkGray
foreach ($c in $config.CosmosContainers) {
    Write-Host "  • $($c.Name) (partition: $($c.PartitionKey))" -ForegroundColor White
}
Write-Host ""
Write-Host "  GITHUB ACTIONS:" -ForegroundColor White
Write-Host "  ──────────────────────────────────────────────────" -ForegroundColor DarkGray
Write-Host "  Auto-deploy is configured for:" -ForegroundColor White
Write-Host "  Repo:   $($config.GitHubUser)/$($config.GitHubRepo)" -ForegroundColor White
Write-Host "  Branch: $($config.GitHubBranch)" -ForegroundColor White
Write-Host "  Push to master → app auto-deploys to Azure" -ForegroundColor White
Write-Host ""
Write-Host "  NEXT STEPS:" -ForegroundColor Yellow
Write-Host "  ──────────────────────────────────────────────────" -ForegroundColor DarkGray
Write-Host "  1. Visit https://$swaUrl to verify your app is live" -ForegroundColor Yellow
Write-Host "  2. Add allowed users in Azure Portal → Entra ID → Enterprise Apps → ProcureFlow → Users" -ForegroundColor Yellow
Write-Host "  3. To add a colleague: az ad app owner add --id $entraAppId --owner-object-id <their-object-id>" -ForegroundColor Yellow
Write-Host ""
Write-Host "  COST ESTIMATE:" -ForegroundColor White
Write-Host "  ──────────────────────────────────────────────────" -ForegroundColor DarkGray
Write-Host "  Static Web Apps (Free):     €0/mo" -ForegroundColor White
Write-Host "  Functions (Consumption):    ~€0-2/mo" -ForegroundColor White
Write-Host "  Cosmos DB (Free tier):      €0/mo" -ForegroundColor White
Write-Host "  Key Vault:                  ~€0.03/mo" -ForegroundColor White
Write-Host "  Entra ID (Free w/ M365):    €0/mo" -ForegroundColor White
Write-Host "  ──────────────────────────────────────────────────" -ForegroundColor DarkGray
Write-Host "  TOTAL:                      ~€0-2/mo" -ForegroundColor Green
Write-Host ""

# ============================================================================
# OPTIONAL: TEARDOWN COMMAND
# ============================================================================
Write-Host "  TO DELETE EVERYTHING (if needed):" -ForegroundColor Red
Write-Host "  az group delete --name $($config.ResourceGroup) --yes --no-wait" -ForegroundColor Red
Write-Host "  az ad app delete --id $entraAppId" -ForegroundColor Red
Write-Host ""
