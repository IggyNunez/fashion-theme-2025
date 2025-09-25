# Fashion Theme 2025 - Windows Setup Script
# Run this script in PowerShell as Administrator

Write-Host "🚀 Fashion Theme 2025 - Advanced Setup" -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host ""

# Check prerequisites
function Check-Requirements {
    Write-Host "📋 Checking requirements..." -ForegroundColor Yellow
    
    # Check Node.js
    try {
        $nodeVersion = node --version
        Write-Host "✅ Node.js installed: $nodeVersion" -ForegroundColor Green
    } catch {
        Write-Host "❌ Node.js is not installed. Please install Node.js 18+" -ForegroundColor Red
        Write-Host "Download from: https://nodejs.org/" -ForegroundColor Yellow
        exit 1
    }
    
    # Check Shopify CLI
    try {
        $shopifyVersion = shopify version
        Write-Host "✅ Shopify CLI installed: $shopifyVersion" -ForegroundColor Green
    } catch {
        Write-Host "⚠️ Shopify CLI not found. Installing..." -ForegroundColor Yellow
        npm install -g @shopify/cli@latest
    }
    
    Write-Host "✅ All requirements met!" -ForegroundColor Green
    Write-Host ""
}

# Initialize project
function Initialize-Project {
    Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
    npm install
    
    Write-Host "🔗 Initializing Git repository..." -ForegroundColor Yellow
    git init
    git add .
    git commit -m "Initial commit: Fashion Theme 2025"
    
    Write-Host "✅ Project initialized!" -ForegroundColor Green
    Write-Host ""
}

# Setup environments
function Setup-Environments {
    Write-Host "🌍 Setting up environments..." -ForegroundColor Yellow
    
    $devStore = Read-Host "Enter your development store URL (e.g., dev-store.myshopify.com)"
    $stagingStore = Read-Host "Enter your staging store URL (press Enter to use dev store)"
    $prodStore = Read-Host "Enter your production store URL (press Enter to use dev store)"
    
    if ([string]::IsNullOrEmpty($stagingStore)) {
        $stagingStore = $devStore
    }
    
    if ([string]::IsNullOrEmpty($prodStore)) {
        $prodStore = $devStore
    }
    
    # Create shopify.theme.toml
    $tomlContent = @"
[environments.development]
store = "$devStore"

[environments.staging]
store = "$stagingStore"

[environments.production]
store = "$prodStore"
"@
    
    Set-Content -Path "shopify.theme.toml" -Value $tomlContent
    
    Write-Host "✅ Environments configured!" -ForegroundColor Green
    Write-Host ""
}

# Setup GitHub repository
function Setup-GitHub {
    Write-Host "🐙 Setting up GitHub..." -ForegroundColor Yellow
    
    $repoUrl = Read-Host "Enter GitHub repository URL (press Enter to skip)"
    
    if (![string]::IsNullOrEmpty($repoUrl)) {
        git remote add origin $repoUrl
        git branch -M main
        
        # Create develop branch
        git checkout -b develop
        
        Write-Host ""
        Write-Host "📝 Please add these secrets to your GitHub repository:" -ForegroundColor Yellow
        Write-Host "  - SHOPIFY_CLI_THEME_TOKEN" -ForegroundColor White
        Write-Host "  - SHOPIFY_STAGING_STORE" -ForegroundColor White
        Write-Host "  - SHOPIFY_PRODUCTION_STORE" -ForegroundColor White
        Write-Host "  - STAGING_THEME_ID" -ForegroundColor White
        Write-Host ""
        
        Write-Host "To get SHOPIFY_CLI_THEME_TOKEN:" -ForegroundColor Yellow
        Write-Host "1. Run: shopify theme token" -ForegroundColor White
        Write-Host "2. Copy the token and add it to GitHub Secrets" -ForegroundColor White
        Write-Host ""
        
        Write-Host "✅ GitHub setup complete!" -ForegroundColor Green
    }
    Write-Host ""
}

# Deploy theme
function Deploy-Theme {
    Write-Host "🚀 Deploying theme to development store..." -ForegroundColor Yellow
    
    shopify theme push --development
    
    Write-Host "✅ Theme deployed!" -ForegroundColor Green
    Write-Host ""
}

# Setup Shopify Functions
function Setup-Functions {
    Write-Host "⚡ Setting up Shopify Functions..." -ForegroundColor Yellow
    
    Set-Location -Path "extensions\volume-discount"
    
    # Initialize package.json
    npm init -y
    
    # Install dependencies
    npm install @shopify/shopify-api @shopify/admin-api-client typescript --save-dev
    
    # Create package.json scripts
    $packageJson = Get-Content -Path "package.json" | ConvertFrom-Json
    $packageJson.scripts = @{
        "build" = "tsc"
        "dev" = "tsc --watch"
    }
    $packageJson | ConvertTo-Json -Depth 10 | Set-Content -Path "package.json"
    
    # Create tsconfig.json
    $tsConfig = @{
        "compilerOptions" = @{
            "target" = "ES2020"
            "module" = "commonjs"
            "lib" = @("ES2020")
            "outDir" = "./dist"
            "rootDir" = "./src"
            "strict" = $true
            "esModuleInterop" = $true
            "skipLibCheck" = $true
            "forceConsistentCasingInFileNames" = $true
        }
    }
    $tsConfig | ConvertTo-Json -Depth 10 | Set-Content -Path "tsconfig.json"
    
    # Build function
    npm run build
    
    Set-Location -Path "..\.."
    
    Write-Host "✅ Functions ready!" -ForegroundColor Green
    Write-Host ""
}

# Create development commands file
function Create-DevCommands {
    Write-Host "📝 Creating development command shortcuts..." -ForegroundColor Yellow
    
    $commandsContent = @"
@echo off
echo Fashion Theme 2025 - Quick Commands
echo =====================================
echo.
echo Available commands:
echo.
echo   dev       - Start development server with hot reload
echo   build     - Build and validate theme
echo   push      - Push theme to development store
echo   pull      - Pull latest theme from store
echo   check     - Run theme validation
echo   share     - Create shareable preview link
echo   staging   - Deploy to staging environment
echo   prod      - Deploy to production (requires confirmation)
echo.
echo Usage: npm run [command]
echo.
"@
    
    Set-Content -Path "commands.bat" -Value $commandsContent
    
    Write-Host "✅ Command shortcuts created!" -ForegroundColor Green
    Write-Host ""
}

# Main execution
function Main {
    Clear-Host
    
    Write-Host @"
    
    ╔══════════════════════════════════════════╗
    ║     Fashion Theme 2025 - Setup Wizard    ║
    ║          Premium Shopify Theme           ║
    ╚══════════════════════════════════════════╝
    
"@ -ForegroundColor Cyan
    
    Check-Requirements
    Initialize-Project
    Setup-Environments
    Setup-GitHub
    Create-DevCommands
    
    $deploy = Read-Host "Do you want to deploy the theme now? (y/n)"
    if ($deploy -eq 'y') {
        Deploy-Theme
    }
    
    $functions = Read-Host "Do you want to set up Shopify Functions? (y/n)"
    if ($functions -eq 'y') {
        Setup-Functions
    }
    
    Write-Host ""
    Write-Host "🎉 Setup complete!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "1. Run 'npm run dev' to start development" -ForegroundColor White
    Write-Host "2. Visit your development store to see the theme" -ForegroundColor White
    Write-Host "3. Configure metafields in Shopify Admin" -ForegroundColor White
    Write-Host "4. Set up GitHub Actions secrets for CI/CD" -ForegroundColor White
    Write-Host ""
    Write-Host "Quick Commands:" -ForegroundColor Cyan
    Write-Host "  npm run dev           - Start development with hot reload" -ForegroundColor White
    Write-Host "  npm run check         - Validate theme code" -ForegroundColor White
    Write-Host "  npm run push          - Deploy to development" -ForegroundColor White
    Write-Host "  npm run push:live     - Deploy to production" -ForegroundColor White
    Write-Host ""
    Write-Host "Happy coding! 🚀" -ForegroundColor Green
}

# Run main function
Main