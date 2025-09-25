#!/bin/bash
# Fashion Theme 2025 - Setup Script

echo "🚀 Fashion Theme 2025 - Advanced Setup"
echo "======================================="

# Check prerequisites
check_requirements() {
    echo "📋 Checking requirements..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        echo "❌ Node.js is not installed. Please install Node.js 18+"
        exit 1
    fi
    
    # Check Shopify CLI
    if ! command -v shopify &> /dev/null; then
        echo "⚠️ Shopify CLI not found. Installing..."
        npm install -g @shopify/cli@latest
    fi
    
    echo "✅ All requirements met!"
}

# Initialize project
init_project() {
    echo "📦 Installing dependencies..."
    npm install
    
    echo "🔗 Initializing Git repository..."
    git init
    git add .
    git commit -m "Initial commit: Fashion Theme 2025"
}

# Setup environments
setup_environments() {
    echo "🌍 Setting up environments..."
    
    read -p "Enter your development store URL (e.g., dev-store.myshopify.com): " DEV_STORE
    read -p "Enter your staging store URL (optional): " STAGING_STORE
    read -p "Enter your production store URL (optional): " PROD_STORE
    
    # Update shopify.theme.toml
    cat > shopify.theme.toml << EOF
[environments.development]
store = "$DEV_STORE"

[environments.staging]
store = "${STAGING_STORE:-$DEV_STORE}"

[environments.production]
store = "${PROD_STORE:-$DEV_STORE}"
EOF
    
    echo "✅ Environments configured!"
}

# Setup GitHub repository
setup_github() {
    echo "🐙 Setting up GitHub..."
    
    read -p "Enter GitHub repository URL (or press Enter to skip): " REPO_URL
    
    if [ ! -z "$REPO_URL" ]; then
        git remote add origin $REPO_URL
        git branch -M main
        
        # Create develop branch
        git checkout -b develop
        
        echo "📝 Creating GitHub Actions secrets..."
        echo "Please add these secrets to your GitHub repository:"
        echo "  - SHOPIFY_CLI_THEME_TOKEN"
        echo "  - SHOPIFY_STAGING_STORE"
        echo "  - SHOPIFY_PRODUCTION_STORE"
        echo "  - STAGING_THEME_ID"
        
        echo "✅ GitHub setup complete!"
    fi
}

# Deploy theme
deploy_theme() {
    echo "🚀 Deploying theme to development store..."
    
    shopify theme push --development --store=$DEV_STORE
    
    echo "✅ Theme deployed!"
}

# Create Shopify Functions
setup_functions() {
    echo "⚡ Setting up Shopify Functions..."
    
    cd extensions/volume-discount
    npm init -y
    npm install @shopify/shopify-api @shopify/admin-api-client
    
    # Build function
    npm run build
    
    cd ../..
    
    echo "✅ Functions ready!"
}

# Main execution
main() {
    echo ""
    echo "This script will help you set up the Fashion Theme 2025"
    echo ""
    
    check_requirements
    init_project
    setup_environments
    setup_github
    
    read -p "Do you want to deploy the theme now? (y/n): " DEPLOY
    if [ "$DEPLOY" = "y" ]; then
        deploy_theme
    fi
    
    read -p "Do you want to set up Shopify Functions? (y/n): " FUNCTIONS
    if [ "$FUNCTIONS" = "y" ]; then
        setup_functions
    fi
    
    echo ""
    echo "🎉 Setup complete!"
    echo ""
    echo "Next steps:"
    echo "1. Run 'npm run dev' to start development"
    echo "2. Visit your development store to see the theme"
    echo "3. Configure metafields in Shopify Admin"
    echo "4. Set up GitHub Actions secrets for CI/CD"
    echo ""
    echo "Happy coding! 🚀"
}

# Run main function
main