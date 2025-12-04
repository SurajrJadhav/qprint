# Quick Setup Script for Windows

This script will help you get started quickly if you don't have npm installed yet.

## Prerequisites Needed

Before running the application, you need:

### 1. Node.js and npm
**Status**: ❌ NOT INSTALLED

**Install**:
1. Go to: https://nodejs.org/
2. Download the LTS version (recommended)
3. Run the installer
4. Restart your terminal
5. Verify: `npm -v`

### 2. PostgreSQL
**Status**: ❓ UNKNOWN

**Install**:
1. Go to: https://www.postgresql.org/download/windows/
2. Download and install
3. Remember the password you set during installation
4. Open SQL Shell (psql) or pgAdmin
5. Create database:
   ```sql
   CREATE DATABASE filesharing;
   ```

### 3. Go
**Status**: ✅ INSTALLED (go1.25.4)

## After Installing Prerequisites

### 1. Configure Database

Edit `backend/.env`:
```env
PORT=8080
DATABASE_URL=postgres://xerox:xerox123@localhost:5432/filesharing?sslmode=disable
JWT_SECRET=supersecretkey123
```

Replace `YOUR_PASSWORD` with your PostgreSQL password.

### 2. Install Frontend Dependencies

```powershell
cd frontend
npm install
cd ..
```

### 3. Start the Application

```powershell
python manage.py start
```

The browser will open automatically at http://localhost:3000

## Manual Testing (Before using manage.py)

### Test Backend:
```powershell
cd backend
go run cmd/api/main.go
```

Expected output:
```
Connected to PostgreSQL database
Server running on port 8080
```

### Test Frontend (in new terminal):
```powershell
cd frontend
npm run dev
```

Expected output:
```
ready - started server on 0.0.0.0:3000
```

## Current Issues

Based on your error:

1. **npm is not installed** ❌
   - Solution: Install Node.js from https://nodejs.org/

2. **Backend might fail** ⚠️
   - Possible causes:
     - PostgreSQL not running
     - Database doesn't exist
     - Wrong credentials in `.env`

## Next Steps

1. Install Node.js (includes npm)
2. Install PostgreSQL
3. Create the database
4. Update `.env` file
5. Run `python manage.py start`

See [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for detailed help.
