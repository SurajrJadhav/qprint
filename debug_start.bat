@echo off
echo ========================================
echo   Backend Debug Start
echo ========================================
echo.

echo Step 1: Checking .env file...
echo.
type backend\.env
echo.

echo Step 2: Checking for environment variables...
echo DATABASE_URL = %DATABASE_URL%
echo.

echo Step 3: Starting backend with debug output...
echo.
cd backend
go run cmd/api/main.go
cd ..

pause
