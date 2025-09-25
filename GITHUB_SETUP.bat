@echo off
cls
echo ==============================================================
echo    Fashion Theme 2025 - GitHub Repository Setup
echo ==============================================================
echo.
echo This script will help you push your theme to GitHub
echo.
echo STEP 1: Initialize Git Repository
echo ----------------------------------
echo Run these commands in your terminal:
echo.
echo cd D:\fashion-theme-2025
echo git init
echo git add .
echo git commit -m "Initial commit: Fashion Theme 2025 - Production-ready Shopify theme with advanced features"
echo.
echo STEP 2: Create GitHub Repository
echo ---------------------------------
echo 1. Go to https://github.com/new
echo 2. Repository name: fashion-theme-2025
echo 3. Description: Copy the text below
echo 4. Make it Public or Private as you prefer
echo 5. DO NOT initialize with README (we already have one)
echo 6. Click "Create repository"
echo.
echo REPOSITORY DESCRIPTION TO COPY:
echo ================================
echo Production-ready Shopify fashion theme with Shopify Functions, Hydrogen recommendations, AI-powered search, 95+ Lighthouse scores, CI/CD pipeline, and advanced e-commerce features. Built for collaborative development with OS 2.0 architecture.
echo.
echo STEP 3: Connect and Push to GitHub
echo ------------------------------------
echo After creating the repository, run these commands:
echo (Replace YOUR_USERNAME with your GitHub username)
echo.
echo git remote add origin https://github.com/YOUR_USERNAME/fashion-theme-2025.git
echo git branch -M main
echo git push -u origin main
echo.
echo ALTERNATIVE: Using GitHub CLI
echo ------------------------------
echo If you have GitHub CLI installed (gh):
echo.
echo gh repo create fashion-theme-2025 --public --source=. --remote=origin --push
echo.
echo STEP 4: Create Additional Branches
echo -----------------------------------
echo git checkout -b develop
echo git push -u origin develop
echo.
echo git checkout -b staging
echo git push -u origin staging
echo.
echo STEP 5: Set Up GitHub Secrets
echo ------------------------------
echo Go to: https://github.com/YOUR_USERNAME/fashion-theme-2025/settings/secrets/actions
echo.
echo Add these secrets:
echo - SHOPIFY_CLI_THEME_TOKEN (run: shopify theme token)
echo - SHOPIFY_STAGING_STORE (your-staging-store.myshopify.com)
echo - SHOPIFY_PRODUCTION_STORE (your-store.myshopify.com)
echo - STAGING_THEME_ID (get from Shopify admin)
echo.
echo STEP 6: Configure Branch Protection
echo ------------------------------------
echo Go to: Settings > Branches > Add rule
echo.
echo For 'main' branch:
echo - Require pull request reviews
echo - Require status checks (Theme Check)
echo - Require branches to be up to date
echo - Include administrators
echo.
echo STEP 7: Enable GitHub Actions
echo ------------------------------
echo Actions should be enabled by default.
echo First workflow will run after your first push.
echo.
pause