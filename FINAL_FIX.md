# Database Connection Troubleshooting - SOLVED

## Issue Found

You had a **compiled binary** `backend/main.exe` that was using old connection settings!

## What I Fixed

1. ✅ **Deleted `backend/main.exe`** - Old compiled binary with wrong database
2. ✅ **Updated `main.go`** - Now loads `.env` from correct location
3. ✅ **Removed system environment variable** - Was overriding `.env`
4. ✅ **`.env` file is correct** - Has `filesharing` database

## The Problem

When you run `go run cmd/api/main.go`, it should compile fresh code. But if there's a `main.exe` file, Windows might run that instead, which had the old `xeroxdb` database hardcoded.

## Solution

Always use `go run` (not the compiled exe):

```bash
cd backend
go run cmd/api/main.go
```

Or use the management scripts which use `go run`:

```bash
manage.bat start
```

## Next Steps

1. **Make sure database exists**:
   ```sql
   CREATE DATABASE filesharing;
   ```

2. **Run the test script**:
   ```bash
   test_db_connection.bat
   ```
   This will verify:
   - Database exists
   - Connection works
   - Credentials are correct

3. **Start the backend**:
   ```bash
   manage.bat start
   ```

4. **Check Backend window** should show:
   ```
   Connected to PostgreSQL database
   Server running on port 8080
   ```

## Verify Everything

Run this to test your connection:
```bash
psql -U xerox -d filesharing -c "SELECT 1;"
```

Should return:
```
 ?column?
----------
        1
```

## Summary of All Fixes

1. ✅ Fixed `.env` file (database name: `filesharing`)
2. ✅ Removed system environment variable
3. ✅ Updated `main.go` to find `.env` file
4. ✅ **Deleted old compiled binary**
5. 🔄 Create database if needed
6. 🔄 Run `manage.bat start`

Should work now!
