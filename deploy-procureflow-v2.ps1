##############################################################################
# ProcureFlow - Azure One-Shot Deployment Script (v2 - All Fixes Applied)
# Provisions: Resource Group, Static Web Apps, Azure Functions,
#             Cosmos DB, Key Vault, Entra ID App Registration
# Region: West Europe
# GitHub: jecastrom/dost_lager
##############################################################################

# ============================================================================
# CONFIGURATION
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
    FuncStorageName  = "stprocureflowfunc"
    FuncRuntime      = "node"
    FuncRuntimeVer   = "20"
    
    # Cosmos DB
    CosmosAccount    = "cosmos-procureflow"
    CosmosDb         = "procureflow-db"
    CosmosContainers = @(
        @{ Name = "purchase-orders";  PartitionKey = "/id" }
        @{ Name = "receipts";         PartitionKey = "/poId" }
        @{ Name = "delivery-logs";    PartitionKey = "/receiptId" }
        @{ Name = "stock";            PartitionKey = "/sku" }
        @{ Name = "suppliers";        PartitionKey = "/id" }
        @{ Name = "tickets";          PartitionKey = "/poId" }
        @{ Name = "notifications";    PartitionKey = "/userId" }
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
    param([string]$StepNum, [string]$Message)
    Write-Host ""
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host "  STEP ${StepNum}: $Message" -ForegroundColor Cyan
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
# BANNER
# ============================================================================
Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════╗" -ForegroundColor Magenta
Write-Host "║   ProcureFlow - Azure One-Shot Deployment (v2)       ║" -ForegroundColor Magenta
Write-Host "║   Region: West Europe                                ║" -ForegroundColor Magenta
Write-Host "║   Repo:   jecastrom/dost_lager                       ║" -ForegroundColor Magenta
Write-Host "╚══════════════════════════════════════════════════════╝" -ForegroundColor Magenta
Write-Host ""

# ============================================================================
# PRE-FLIGHT CHECKS
# ============================================================================
Write-Info "Checking Azure CLI..."
$azVersion = az version 2>$null | ConvertFrom-Json
if (-not $azVersion) {
    Write-ErrorMsg "Azure CLI not found. Install from: https://aka.ms/installazurecli"
    exit 1
}
Write-Success "Azure CLI found (v$($azVersion.'azure-cli'))"

# ============================================================================
# STEP 1: LOGIN TO AZURE (device code flow)
# ============================================================================
Write-Step "1/10" "Logging in to Azure"

$currentAccount = az account show 2>$null | ConvertFrom-Json
if (-not $currentAccount) {
    Write-Info "Not logged in. Using device code flow..."
    Write-Info "A code will appear below. Open the URL and enter the code."
    az login --use-device-code
    Test-CommandSuccess
} else {
    Write-Success "Already logged in as $($currentAccount.user.name)"
}

$account = az account show | ConvertFrom-Json
Write-Info "Subscription: $($account.name) ($($account.id))"
Write-Info "Tenant: $($account.tenantId)"

$confirm = Read-Host "  Is this the correct subscription? (y/n)"
if ($confirm -ne "y") {
    Write-Info "List available subscriptions with: az account list --output table"
    Write-Info "Set subscription with: az account set --subscription <name-or-id>"
    exit 0
}

$subscriptionId = $account.id

# ============================================================================
# STEP 2: REGISTER RESOURCE PROVIDERS
# ============================================================================
Write-Step "2/10" "Registering Resource Providers"
Write-Info "This ensures your subscription can create the required resources..."

$providers = @("Microsoft.Web", "Microsoft.DocumentDB", "Microsoft.KeyVault", "Microsoft.Storage")

foreach ($provider in $providers) {
    $state = az provider show -n $provider --query "registrationState" -o tsv 2>$null
    if ($state -eq "Registered") {
        Write-Success "$provider already registered"
    } else {
        Write-Info "Registering $provider..."
        az provider register --namespace $provider --output none
        
        # Wait for registration to complete (max 120 seconds)
        $timeout = 120
        $elapsed = 0
        do {
            Start-Sleep -Seconds 5
            $elapsed += 5
            $state = az provider show -n $provider --query "registrationState" -o tsv 2>$null
        } while ($state -ne "Registered" -and $elapsed -lt $timeout)
        
        if ($state -eq "Registered") {
            Write-Success "$provider registered"
        } else {
            Write-ErrorMsg "$provider registration timed out. Run manually: az provider register --namespace $provider"
            exit 1
        }
    }
}

# ============================================================================
# STEP 3: CREATE RESOURCE GROUP
# ============================================================================
Write-Step "3/10" "Creating Resource Group"

$rgExists = az group show --name $config.ResourceGroup 2>$null
if ($rgExists) {
    Write-Success "Resource group '$($config.ResourceGroup)' already exists, skipping"
} else {
    az group create `
        --name $config.ResourceGroup `
        --location westeurope `
        --tags project=procureflow environment=production `
        --output none
    Test-CommandSuccess
    Write-Success "Resource group '$($config.ResourceGroup)' created in westeurope"
}

# ============================================================================
# STEP 4: CREATE STATIC WEB APP
# ============================================================================
Write-Step "4/10" "Creating Static Web App"
Write-Info "This hosts your React PWA with global CDN and HTTPS"

$swaExists = az staticwebapp show --name $config.SwaName --resource-group $config.ResourceGroup 2>$null
if ($swaExists) {
    Write-Success "Static Web App '$($config.SwaName)' already exists, skipping"
} else {
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
}

$swaUrl = az staticwebapp show `
    --name $config.SwaName `
    --resource-group $config.ResourceGroup `
    --query "defaultHostname" --output tsv
Write-Success "Static Web App ready: https://$swaUrl"

# ============================================================================
# STEP 5: CREATE STORAGE ACCOUNT (required for Azure Functions)
# ============================================================================
Write-Step "5/10" "Creating Storage Account for Functions"

$storageExists = az storage account show --name $config.FuncStorageName --resource-group $config.ResourceGroup 2>$null
if ($storageExists) {
    Write-Success "Storage account '$($config.FuncStorageName)' already exists, skipping"
} else {
    az storage account create `
        --name $config.FuncStorageName `
        --resource-group $config.ResourceGroup `
        --location westeurope `
        --sku Standard_LRS `
        --kind StorageV2 `
        --tags project=procureflow `
        --output none
    Test-CommandSuccess
    Write-Success "Storage account '$($config.FuncStorageName)' created"
}

# ============================================================================
# STEP 6: CREATE AZURE FUNCTIONS APP
# ============================================================================
Write-Step "6/10" "Creating Azure Functions App (Consumption Plan)"
Write-Info "Serverless API backend - pay only when code runs"

$funcExists = az functionapp show --name $config.FuncAppName --resource-group $config.ResourceGroup 2>$null
if ($funcExists) {
    Write-Success "Functions app '$($config.FuncAppName)' already exists, skipping"
} else {
    az functionapp create `
        --name $config.FuncAppName `
        --resource-group $config.ResourceGroup `
        --storage-account $config.FuncStorageName `
        --consumption-plan-location westeurope `
        --runtime $config.FuncRuntime `
        --runtime-version $config.FuncRuntimeVer `
        --functions-version 4 `
        --os-type Linux `
        --tags project=procureflow `
        --output none
    Test-CommandSuccess
    Write-Success "Functions app '$($config.FuncAppName)' created"
}

# Configure CORS
Write-Info "Configuring CORS..."
az functionapp cors add `
    --name $config.FuncAppName `
    --resource-group $config.ResourceGroup `
    --allowed-origins "https://$swaUrl" `
    --output none 2>$null
Write-Success "CORS configured for https://$swaUrl"

# ============================================================================
# STEP 7: CREATE COSMOS DB (Free Tier)
# ============================================================================
Write-Step "7/10" "Creating Cosmos DB Account (Free Tier)"

$cosmosExists = az cosmosdb show --name $config.CosmosAccount --resource-group $config.ResourceGroup 2>$null
if ($cosmosExists) {
    Write-Success "Cosmos DB account '$($config.CosmosAccount)' already exists, skipping"
} else {
    Write-Info "This may take 3-5 minutes..."
    az cosmosdb create `
        --name $config.CosmosAccount `
        --resource-group $config.ResourceGroup `
        --locations regionName=westeurope failoverPriority=0 `
        --default-consistency-level Session `
        --enable-free-tier true `
        --tags project=procureflow `
        --output none
    Test-CommandSuccess
    Write-Success "Cosmos DB account '$($config.CosmosAccount)' created (FREE tier)"
}

# Create Database
$dbExists = az cosmosdb sql database show `
    --account-name $config.CosmosAccount `
    --resource-group $config.ResourceGroup `
    --name $config.CosmosDb 2>$null
if ($dbExists) {
    Write-Success "Database '$($config.CosmosDb)' already exists, skipping"
} else {
    Write-Info "Creating database '$($config.CosmosDb)'..."
    az cosmosdb sql database create `
        --account-name $config.CosmosAccount `
        --resource-group $config.ResourceGroup `
        --name $config.CosmosDb `
        --output none
    Test-CommandSuccess
    Write-Success "Database '$($config.CosmosDb)' created"
}

# Create Containers
foreach ($container in $config.CosmosContainers) {
    $containerExists = az cosmosdb sql container show `
        --account-name $config.CosmosAccount `
        --resource-group $config.ResourceGroup `
        --database-name $config.CosmosDb `
        --name $container.Name 2>$null
    if ($containerExists) {
        Write-Success "Container '$($container.Name)' already exists, skipping"
    } else {
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
}

# ============================================================================
# STEP 8: CREATE KEY VAULT
# ============================================================================
Write-Step "8/10" "Creating Key Vault"

$kvExists = az keyvault show --name $config.KeyVaultName --resource-group $config.ResourceGroup 2>$null
if ($kvExists) {
    Write-Success "Key Vault '$($config.KeyVaultName)' already exists, skipping"
} else {
    az keyvault create `
        --name $config.KeyVaultName `
        --resource-group $config.ResourceGroup `
        --location westeurope `
        --tags project=procureflow `
        --output none
    Test-CommandSuccess
    Write-Success "Key Vault '$($config.KeyVaultName)' created"
}

# Grant current user Key Vault Secrets Officer role (needed for RBAC vaults)
Write-Info "Granting current user Key Vault Secrets Officer role..."
$userId = az ad signed-in-user show --query id -o tsv
az role assignment create `
    --role "Key Vault Secrets Officer" `
    --assignee-object-id $userId `
    --assignee-principal-type User `
    --scope "/subscriptions/$subscriptionId/resourcegroups/$($config.ResourceGroup)/providers/Microsoft.KeyVault/vaults/$($config.KeyVaultName)" `
    --output none 2>$null
Write-Success "Current user has Key Vault Secrets Officer role"

# Wait for RBAC propagation
Write-Info "Waiting 15 seconds for RBAC propagation..."
Start-Sleep -Seconds 15

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

# Grant Functions app access to Key Vault (RBAC)
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

az role assignment create `
    --role "Key Vault Secrets User" `
    --assignee-object-id $funcPrincipalId `
    --assignee-principal-type ServicePrincipal `
    --scope "/subscriptions/$subscriptionId/resourcegroups/$($config.ResourceGroup)/providers/Microsoft.KeyVault/vaults/$($config.KeyVaultName)" `
    --output none 2>$null
Write-Success "Functions app can now read secrets from Key Vault (RBAC)"

# Configure Functions app to use Key Vault reference for Cosmos
$kvReference = "@Microsoft.KeyVault(SecretUri=https://kv-procureflow.vault.azure.net/secrets/CosmosDbConnectionString/)"
az functionapp config appsettings set `
    --name func-procureflow `
    --resource-group rg-procureflow-prod `
    --settings "COSMOS_CONNECTION=$kvReference" `
    --output none 2>$null
Write-Success "Functions app configured with Key Vault reference"

# ============================================================================
# STEP 9: REGISTER ENTRA ID APP (for MS365 auth)
# ============================================================================
Write-Step "9/10" "Registering Entra ID App (for authentication)"

$swaRedirectUri = "https://$swaUrl/.auth/login/aad/callback"

# Check if app already exists
$existingApp = az ad app list --display-name $config.EntraAppName --query "[0].appId" -o tsv 2>$null
if ($existingApp) {
    $entraAppId = $existingApp
    Write-Success "Entra ID app '$($config.EntraAppName)' already exists (ID: $entraAppId), skipping"
} else {
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
}

# ============================================================================
# STEP 10: SUMMARY
# ============================================================================
Write-Step "10/10" "Deployment Complete!"

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
Write-Host "  Push to master -> app auto-deploys to Azure" -ForegroundColor White
Write-Host ""
Write-Host "  NEXT STEPS:" -ForegroundColor Yellow
Write-Host "  ──────────────────────────────────────────────────" -ForegroundColor DarkGray
Write-Host "  1. Visit https://$swaUrl to verify your app is live" -ForegroundColor Yellow
Write-Host "  2. Add allowed users in Azure Portal -> Entra ID -> Enterprise Apps -> ProcureFlow -> Users" -ForegroundColor Yellow
Write-Host ""
Write-Host "  COST ESTIMATE:" -ForegroundColor White
Write-Host "  ──────────────────────────────────────────────────" -ForegroundColor DarkGray
Write-Host "  Static Web Apps (Free):     EUR 0/mo" -ForegroundColor White
Write-Host "  Functions (Consumption):    ~EUR 0-2/mo" -ForegroundColor White
Write-Host "  Cosmos DB (Free tier):      EUR 0/mo" -ForegroundColor White
Write-Host "  Key Vault:                  ~EUR 0.03/mo" -ForegroundColor White
Write-Host "  Entra ID (Free w/ M365):    EUR 0/mo" -ForegroundColor White
Write-Host "  ──────────────────────────────────────────────────" -ForegroundColor DarkGray
Write-Host "  TOTAL:                      ~EUR 0-2/mo" -ForegroundColor Green
Write-Host ""

# ============================================================================
# TEARDOWN COMMAND (if needed)
# ============================================================================
Write-Host "  TO DELETE EVERYTHING (if needed):" -ForegroundColor Red
Write-Host "  az group delete --name $($config.ResourceGroup) --yes --no-wait" -ForegroundColor Red
Write-Host "  az ad app delete --id $entraAppId" -ForegroundColor Red
Write-Host ""
