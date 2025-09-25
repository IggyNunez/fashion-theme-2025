@echo off
cls
echo ================================================
echo   Fashion Theme 2025 - Push to IggyNunez GitHub
echo ================================================
echo.

cd /d D:\fashion-theme-2025

echo Step 1: Initializing Git repository...
git init

echo.
echo Step 2: Configuring Git...
git config user.name "Ignacio Nunez"
rem Update the email below with your GitHub email
git config user.email "your-email@example.com"

echo.
echo Step 3: Adding all files...
git add .

echo.
echo Step 4: Creating initial commit...
git commit -m "🚀 Initial commit: Fashion Theme 2025 - Production-ready Shopify theme with advanced features"

echo.
echo Step 5: Creating branches...
git branch develop
git branch staging

echo.
echo Step 6: Adding GitHub remote...
git remote add origin https://github.com/IggyNunez/fashion-theme-2025.git

echo.
echo ========================================
echo   ALMOST DONE! Now you need to:
echo ========================================
echo.
echo 1. CREATE THE REPOSITORY ON GITHUB:
echo    - Open: https://github.com/new
echo    - Name: fashion-theme-2025
echo    - DO NOT initialize with README
echo    - Click "Create repository"
echo.
echo 2. THEN COME BACK AND PRESS ENTER TO PUSH
echo.
pause

echo.
echo Pushing to GitHub...
echo.
git push -u origin main
git push -u origin develop
git push -u origin staging

echo.
echo ========================================
echo   SUCCESS! Your theme is now on GitHub:
echo   https://github.com/IggyNunez/fashion-theme-2025
echo ========================================
echo.
pause