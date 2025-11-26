# INSTALLATION GUIDE - Windows

## Current Status

Based on diagnostics:
- ✅ **Go**: Installed (go1.25.4)
- ✅ **Python**: Working
- ❌ **Node.js/npm**: NOT installed
- ❌ **PostgreSQL**: NOT running (or not installed)

## Step-by-Step Installation

### 1. Install Node.js (Required for Frontend)

**Option A: Using Winget (Recommended - Fastest)**
```powershell
# Open PowerShell as Administrator
winget install OpenJS.NodeJS.LTS

# After installation, close and reopen PowerShell
node -v
npm -v
```

**Option B: Manual Download**
1. Go to: https://nodejs.org/
2. Download the **LTS version** (Long Term Support)
3. Run the installer
4. **IMPORTANT**: Check "Add to PATH" during installation
5. Click through the installer (use default settings)
6. **Restart your computer** (or at least close all terminals)
7. Open new PowerShell and verify:
   ```powershell
   node -v
   npm -v
   ```

### 2. Install PostgreSQL (Required for Backend)

**Option A: Using Winget**
```powershell
# Open PowerShell as Administrator
winget install PostgreSQL.PostgreSQL

# Follow the prompts to set a password
```

**Option B: Manual Download**
1. Go to: https://www.postgresql.org/download/windows/
2. Download the installer
3. Run the installer
4. **Remember the password you set!**
5. Keep default port: 5432
6. Install all components (including pgAdmin)

**After Installation:**
1. Open **SQL Shell (psql)** or **pgAdmin 4**
2. Create the database:
   ```sql
   CREATE DATABASE filesharing;
   ```
3. Exit: `\q`

### 3. Configure the Backend

Edit `backend/.env` file:
```env
PORT=8080
DATABASE_URL=postgres://xerox:xerox123@localhost:5432/filesharing?sslmode=disable
JWT_SECRET=supersecretkey123
```

Replace `YOUR_PASSWORD_HERE` with the PostgreSQL password you set during installation.

### 4. Verify Everything Works

**Test Node.js:**
```powershell
node -v
npm -v
```
Both should show version numbers.

**Test PostgreSQL:**
```powershell
# Check if PostgreSQL is running
Get-Service -Name postgresql*
```
Should show "Running" status.

**Test Backend:**
```powershell
cd backend
go run cmd/api/main.go
```
Should show:
- "Connected to PostgreSQL database"
- "Server running on port 8080"

Press Ctrl+C to stop.

**Install Frontend Dependencies:**
```powershell
cd ../frontend
npm install
```
This will take a few minutes. Should complete without errors.

### 5. Start the Application

```powershell
# From project root
python manage.py start
```

Browser should open automatically to http://localhost:3000

## Troubleshooting

### "Node.js installed but still not found"
1. Close ALL PowerShell/CMD windows
2. Restart your computer
3. Open new PowerShell
4. Try: `node -v`

If still not working:
1. Search Windows for "Environment Variables"
2. Click "Edit the system environment variables"
3. Click "Environment Variables"
4. Under "System variables", find "Path"
5. Click "Edit"
6. Add: `C:\Program Files\nodejs`
7. Click OK on all windows
8. Restart computer

### "PostgreSQL won't start"
```powershell
# Start PostgreSQL service
Start-Service postgresql-x64-16  # or whatever version you installed

# Check status
Get-Service -Name postgresql*
```

### "Database connection refused"
1. Make sure PostgreSQL service is running
2. Check password in `backend/.env` is correct
3. Make sure database `filesharing` exists

### "npm install takes forever"
This is normal! It can take 5-10 minutes depending on your internet speed.

## Quick Commands Reference

```powershell
# Check if Node.js is installed
node -v
npm -v

# Check if PostgreSQL is running
Get-Service -Name postgresql*

# Start PostgreSQL if stopped
Start-Service postgresql-x64-16

# Install frontend dependencies
cd frontend
npm install

# Start the application
python manage.py start

# Stop the application
python manage.py stop

# Check application status
python manage.py status
```

## Next Steps After Installation

1. Install Node.js using one of the methods above
2. Install PostgreSQL
3. Create the database
4. Update `backend/.env` with your password
5. Run: `cd frontend && npm install`
6. Run: `python manage.py start`

The application will start and open in your browser automatically!
