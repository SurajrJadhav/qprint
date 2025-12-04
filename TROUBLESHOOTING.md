# Troubleshooting Startup Issues

## Current Issues Identified

### 1. npm is NOT installed ❌
**Error**: `npm : The term 'npm' is not recognized`

**Solution**: Install Node.js (which includes npm)
1. Download Node.js from: https://nodejs.org/
2. Choose the LTS (Long Term Support) version
3. Run the installer
4. Restart your terminal/PowerShell
5. Verify installation: `npm -v` and `node -v`

### 2. Backend Build Error ❌
**Error**: Backend fails to start

**Likely causes**:
- PostgreSQL database not running
- Database credentials incorrect in `.env` file
- Database doesn't exist

## Step-by-Step Setup

### Step 1: Install Node.js
1. Go to https://nodejs.org/
2. Download and install the LTS version
3. Restart your terminal
4. Verify: `npm -v` should show version number

### Step 2: Setup PostgreSQL Database

#### Option A: Install PostgreSQL Locally
1. Download from: https://www.postgresql.org/download/
2. Install and remember the password you set
3. Open pgAdmin or psql
4. Create database:
   ```sql
   CREATE DATABASE filesharing;
   ```

#### Option B: Use Docker (if you have Docker)
```bash
docker run --name postgres-filesharing -e POSTGRES_PASSWORD=password -e POSTGRES_DB=filesharing -p 5432:5432 -d postgres
```

### Step 3: Configure Backend

Edit `backend/.env` file with your database credentials:

```env
PORT=8080
DATABASE_URL=postgres://postgres:YOUR_PASSWORD@localhost:5432/filesharing?sslmode=disable
JWT_SECRET=supersecretkey123
```

Replace `YOUR_PASSWORD` with your PostgreSQL password.

### Step 4: Test Backend Manually

```bash
cd backend
go run cmd/api/main.go
```

You should see:
- "Connected to PostgreSQL database"
- "Server running on port 8080"

If you see errors, check:
- PostgreSQL is running: `pg_isready` (if installed)
- Database exists
- Credentials in `.env` are correct

### Step 5: Install Frontend Dependencies

```bash
cd frontend
npm install
```

### Step 6: Start the Application

```bash
# From project root
python manage.py start
```

## Quick Verification Checklist

- [ ] Node.js and npm installed (`npm -v` works)
- [ ] PostgreSQL installed and running
- [ ] Database `filesharing` created
- [ ] `.env` file has correct credentials
- [ ] Backend starts manually without errors
- [ ] Frontend dependencies installed (`node_modules` exists)

## Common Errors

### "Go is not installed"
Install Go from: https://golang.org/dl/

### "PostgreSQL connection refused"
- Check PostgreSQL is running
- Check port 5432 is not blocked
- Verify credentials in `.env`

### "npm install fails"
- Check internet connection
- Try: `npm cache clean --force`
- Delete `node_modules` and try again

### "Port already in use"
- Backend (8080): Find and kill process using port
- Frontend (3000): Find and kill process using port

Windows:
```powershell
# Find process on port 8080
netstat -ano | findstr :8080
# Kill process (replace PID)
taskkill /PID <PID> /F
```

## Need Help?

If you're still stuck:
1. Check the error messages carefully
2. Make sure all prerequisites are installed
3. Try running backend and frontend manually first
4. Check the logs for specific error messages
