# SOLVED: Environment Variable Override Issue

## The Problem

You had a **Windows User Environment Variable** set that was overriding the `.env` file:

**System Environment Variable (OLD - WRONG):**
```
DATABASE_URL=postgres://xerox:xeroxpass@localhost:5432/xeroxdb
```

**File `.env` (NEW - CORRECT):**
```
DATABASE_URL=postgres://xerox:xerox123@localhost:5432/filesharing
```

**Result:** The system environment variable took precedence, so the backend was using the wrong database and password!

## The Solution

✅ **Removed the system environment variable**

Now the backend will use the `.env` file.

## What I Did

1. ✅ Fixed `backend/.env` to use `filesharing` database
2. ✅ Updated `main.go` to look for `.env` in multiple locations
3. ✅ **Removed system environment variable** that was overriding `.env`

## Next Steps

1. **Close ALL terminal windows** (important - they cache environment variables)
2. **Open a NEW terminal**
3. **Run**: `manage.bat start`
4. **Check** Backend window should show:
   ```
   Connected to PostgreSQL database
   Server running on port 8080
   ```

## Why This Happened

Environment variables in Windows have this priority:
1. **System Environment Variables** (highest priority)
2. **User Environment Variables** ← This was the problem
3. **`.env` file** (lowest priority)

The User environment variable was set to the old `xeroxdb` database, so it was always used instead of the `.env` file.

## Verify It's Fixed

After opening a new terminal:

```powershell
# Should return nothing
$env:DATABASE_URL

# Should show filesharing
Get-Content backend\.env | Select-String DATABASE_URL
```

## Create the Database

Don't forget to create the `filesharing` database:

```sql
CREATE DATABASE filesharing;
```

Or:
```bash
psql -U xerox -d postgres -c "CREATE DATABASE filesharing;"
```

## Summary

✅ System environment variable removed
✅ `.env` file is correct
✅ `main.go` updated to find `.env` file
🔄 **Restart terminal and run `manage.bat start`**
🔄 **Create `filesharing` database if it doesn't exist**

Should work now!
