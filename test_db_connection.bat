@echo off
echo Checking PostgreSQL Connection...
echo.

REM Test 1: Check if database exists
echo Test 1: Checking if 'filesharing' database exists...
psql -U xerox -d postgres -c "\l" 2>nul | findstr filesharing
if errorlevel 1 (
    echo [ERROR] Database 'filesharing' does NOT exist
    echo.
    echo Creating database 'filesharing'...
    psql -U xerox -d postgres -c "CREATE DATABASE filesharing;"
    if errorlevel 1 (
        echo [ERROR] Failed to create database. Try creating it manually:
        echo   1. Open SQL Shell (psql)
        echo   2. Login as xerox
        echo   3. Run: CREATE DATABASE filesharing;
        pause
        exit /b 1
    )
    echo [SUCCESS] Database created!
) else (
    echo [SUCCESS] Database 'filesharing' exists
)

echo.
echo Test 2: Testing connection to 'filesharing' database...
psql -U xerox -d filesharing -c "SELECT version();" >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Cannot connect to 'filesharing' database
    echo Please check:
    echo   - Username: xerox
    echo   - Password: xerox123
    echo   - Database: filesharing
    pause
    exit /b 1
) else (
    echo [SUCCESS] Connection successful!
)

echo.
echo ========================================
echo   All checks passed!
echo ========================================
echo.
echo Your configuration:
echo   Username: xerox
echo   Password: xerox123
echo   Database: filesharing
echo   Host: localhost
echo   Port: 5432
echo.
echo You can now start the backend:
echo   manage.bat start
echo.
pause
