# Quick Fix - Database Setup

## Issue Fixed

✅ **backend/.env** now has correct database name: `filesharing` (was `xeroxdb`)

## Current Configuration

```env
PORT=8080
DATABASE_URL=postgres://xerox:xerox123@localhost:5432/filesharing?sslmode=disable
JWT_SECRET=supersecretkey123
```

## Next Step: Create the Database

The database `filesharing` needs to exist. Here's how to create it:

### Option 1: Using psql (Command Line)

```bash
# Connect to PostgreSQL
psql -U xerox -d postgres

# Create database
CREATE DATABASE filesharing;

# Exit
\q
```

### Option 2: Using pgAdmin (GUI)

1. Open **pgAdmin 4**
2. Connect to your server
3. Right-click on **Databases**
4. Select **Create** → **Database**
5. Name: `filesharing`
6. Owner: `xerox`
7. Click **Save**

### Option 3: Quick Command

```bash
psql -U xerox -d postgres -c "CREATE DATABASE filesharing;"
```

## Verify Database Exists

```bash
psql -U xerox -l
```

Should show `filesharing` in the list.

## After Creating Database

1. **Close** Backend Server window
2. **Run**: `manage.bat start`
3. **Check** Backend window shows:
   ```
   Connected to PostgreSQL database
   Server running on port 8080
   ```

## If You Get "database already exists"

That's fine! It means the database is already there. Just start the backend:

```bash
manage.bat start
```

## Quick Test

```bash
# Test connection
psql -U xerox -d filesharing

# Should connect successfully
# Type \q to exit
```

## Summary

1. ✅ `.env` file fixed (database name: `filesharing`)
2. 🔄 Create database: `CREATE DATABASE filesharing;`
3. 🔄 Start backend: `manage.bat start`
4. ✅ Registration should work!
