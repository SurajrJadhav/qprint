# SOLUTION: Force Override Environment Variables

## The Root Cause

**`godotenv.Load()` does NOT override existing environment variables!**

If `DATABASE_URL` is already set in Windows (User or System environment variables), `godotenv.Load()` will NOT replace it with the value from `.env` file.

## The Fix

Changed from `godotenv.Load()` to `godotenv.Overload()`:

**Before (WRONG):**
```go
godotenv.Load(".env")  // Does NOT override existing env vars
```

**After (CORRECT):**
```go
godotenv.Overload(".env")  // FORCES override of existing env vars
```

## What This Means

Now the `.env` file will **ALWAYS** take precedence, even if you have `DATABASE_URL` set in Windows environment variables.

## Next Steps

1. **Close the Backend Server window**
2. **Run**: `manage.bat start`
3. **Check** Backend window should show:
   ```
   Loaded and OVERRODE env vars from current directory
   DEBUG: DATABASE_URL from env = postgres://xerox:xerox123@localhost:5432/filesharing
   Connected to PostgreSQL database
   Server running on port 8080
   ```

## Why This Happened

1. You had `DATABASE_URL` set in Windows User environment variables
2. `godotenv.Load()` respects existing env vars (doesn't override)
3. So the old `xeroxdb` value was always used
4. Now `godotenv.Overload()` forces the `.env` file values

## Verify It's Fixed

After starting the backend, you should see:
- `DEBUG: DATABASE_URL` showing `filesharing` (not `xeroxdb`)
- `DEBUG: DATABASE_URL` showing `xerox123` (not `xeroxpass`)

## Summary

✅ Changed `godotenv.Load()` → `godotenv.Overload()`
✅ `.env` file now takes precedence
✅ No need to manually clear environment variables
✅ Works even if Windows env vars are set

**Try starting the backend now!**
