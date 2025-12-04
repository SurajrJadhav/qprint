# Quick Install Script for Windows
# Run this in PowerShell as Administrator

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  File Sharing App - Quick Installer" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "ERROR: This script must be run as Administrator!" -ForegroundColor Red
    Write-Host "Right-click PowerShell and select 'Run as Administrator'" -ForegroundColor Yellow
    exit 1
}

# Function to check if a command exists
function Test-Command {
    param($Command)
    try {
        if (Get-Command $Command -ErrorAction Stop) {
            return $true
        }
    }
    catch {
        return $false
    }
}

# Check Node.js
Write-Host "Checking Node.js..." -ForegroundColor Yellow
if (Test-Command "node") {
    $nodeVersion = node -v
    Write-Host "✓ Node.js is installed: $nodeVersion" -ForegroundColor Green
} else {
    Write-Host "✗ Node.js is NOT installed" -ForegroundColor Red
    Write-Host "Installing Node.js..." -ForegroundColor Yellow
    
    if (Test-Command "winget") {
        winget install OpenJS.NodeJS.LTS --silent
        Write-Host "✓ Node.js installed! Please restart your terminal." -ForegroundColor Green
    } else {
        Write-Host "Please install Node.js manually from: https://nodejs.org/" -ForegroundColor Yellow
        Start-Process "https://nodejs.org/"
    }
}

# Check npm
Write-Host "`nChecking npm..." -ForegroundColor Yellow
if (Test-Command "npm") {
    $npmVersion = npm -v
    Write-Host "✓ npm is installed: $npmVersion" -ForegroundColor Green
} else {
    Write-Host "✗ npm is NOT installed (comes with Node.js)" -ForegroundColor Red
}

# Check PostgreSQL
Write-Host "`nChecking PostgreSQL..." -ForegroundColor Yellow
$pgService = Get-Service -Name "postgresql*" -ErrorAction SilentlyContinue

if ($pgService) {
    if ($pgService.Status -eq "Running") {
        Write-Host "✓ PostgreSQL is installed and running" -ForegroundColor Green
    } else {
        Write-Host "⚠ PostgreSQL is installed but not running" -ForegroundColor Yellow
        Write-Host "Starting PostgreSQL..." -ForegroundColor Yellow
        Start-Service $pgService.Name
        Write-Host "✓ PostgreSQL started" -ForegroundColor Green
    }
} else {
    Write-Host "✗ PostgreSQL is NOT installed" -ForegroundColor Red
    Write-Host "Installing PostgreSQL..." -ForegroundColor Yellow
    
    if (Test-Command "winget") {
        Write-Host "Note: You'll need to set a password during installation" -ForegroundColor Yellow
        winget install PostgreSQL.PostgreSQL
        Write-Host "✓ PostgreSQL installed!" -ForegroundColor Green
    } else {
        Write-Host "Please install PostgreSQL manually from: https://www.postgresql.org/download/windows/" -ForegroundColor Yellow
        Start-Process "https://www.postgresql.org/download/windows/"
    }
}

# Check Go
Write-Host "`nChecking Go..." -ForegroundColor Yellow
if (Test-Command "go") {
    $goVersion = go version
    Write-Host "✓ Go is installed: $goVersion" -ForegroundColor Green
} else {
    Write-Host "✗ Go is NOT installed" -ForegroundColor Red
}

# Summary
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  Installation Summary" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. If Node.js was just installed, RESTART YOUR TERMINAL" -ForegroundColor White
Write-Host "2. Create PostgreSQL database:" -ForegroundColor White
Write-Host "   - Open 'SQL Shell (psql)' or pgAdmin" -ForegroundColor Gray
Write-Host "   - Run: CREATE DATABASE filesharing;" -ForegroundColor Gray
Write-Host "3. Update backend/.env with your PostgreSQL password" -ForegroundColor White
Write-Host "4. Run: cd frontend && npm install" -ForegroundColor White
Write-Host "5. Run: python manage.py start" -ForegroundColor White

Write-Host "`nFor detailed instructions, see INSTALL.md" -ForegroundColor Cyan
