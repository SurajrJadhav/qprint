# How the Scripts Work - Separate Windows Explanation

## The Problem You Identified ✅

You were absolutely correct! The original scripts had a critical flaw:

**Original Issue:**
- Backend and frontend were started in the **same terminal**
- They would **block each other** 
- Processes couldn't run **continuously**
- When you closed the terminal, everything stopped

## The Solution

### Windows (manage.bat)

**Before (WRONG):**
```batch
start /B cmd /c "go run cmd/api/main.go"
```
- `/B` = background in same window
- Process hidden, no way to see errors
- Blocks the terminal

**After (CORRECT):**
```batch
start "Backend Server" cmd /k "go run cmd/api/main.go"
```
- Opens **NEW window** titled "Backend Server"
- `/k` = keeps window open after command
- Runs **independently**
- You can see all output and errors

### Python (manage.py)

**Before (WRONG):**
```python
subprocess.Popen(..., stdout=subprocess.PIPE, stderr=subprocess.PIPE)
```
- Captures output (hidden)
- Process might block

**After (CORRECT - Windows):**
```python
subprocess.Popen(['start', 'cmd', '/k', 'go', 'run', 'cmd/api/main.go'], shell=True)
```
- Opens new CMD window
- Stays visible
- Runs continuously

**After (CORRECT - Linux/Mac):**
```python
subprocess.Popen(..., stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, preexec_fn=os.setsid)
```
- Runs as daemon process
- Detached from parent

## How It Works Now

### When you run `manage.bat start`:

1. **Script starts** in your current terminal
2. **Opens NEW window** for Backend (titled "Backend Server")
   - Shows all Go output
   - Shows database connection status
   - Shows any errors
3. **Opens ANOTHER NEW window** for Frontend (titled "Frontend Server")
   - Shows Next.js compilation
   - Shows when ready
   - Shows any errors
4. **Original terminal** shows summary and closes
5. **Browser opens** automatically
6. **Two server windows stay open** and keep running

### Visual Representation:

```
Your Terminal
    │
    ├─► Opens "Backend Server" window
    │   └─► go run cmd/api/main.go (RUNS CONTINUOUSLY)
    │
    ├─► Opens "Frontend Server" window
    │   └─► npm run dev (RUNS CONTINUOUSLY)
    │
    └─► Opens Browser
        └─► http://localhost:3000
```

## What You'll See

### 1. Backend Server Window
```
Connected to PostgreSQL database
Server running on port 8080
```
**Keep this window open!**

### 2. Frontend Server Window
```
- ready started server on 0.0.0.0:3000, url: http://localhost:3000
- event compiled client and server successfully
```
**Keep this window open!**

### 3. Your Browser
Opens automatically to http://localhost:3000

## Benefits

✅ **Continuous Running**: Servers run independently
✅ **Visible Output**: See all logs and errors
✅ **Easy Debugging**: Check server windows for errors
✅ **Independent**: Close main terminal, servers keep running
✅ **Easy Stopping**: `manage.bat stop` kills both servers

## Stopping the Servers

### Option 1: Use the script
```cmd
manage.bat stop
```
- Finds processes on ports 8080 and 3000
- Kills them
- Closes server windows

### Option 2: Close windows manually
- Just close the "Backend Server" window
- Just close the "Frontend Server" window

## Checking Status

```cmd
manage.bat status
```

Shows:
```
[SUCCESS] Backend is running (PID: 12345)
[INFO]   URL: http://localhost:8080

[SUCCESS] Frontend is running (PID: 67890)
[INFO]   URL: http://localhost:3000
```

## PostgreSQL

PostgreSQL runs as a **Windows Service** (separate from our scripts):

**Check if running:**
```powershell
Get-Service -Name postgresql*
```

**Start if stopped:**
```powershell
Start-Service postgresql-x64-16
```

PostgreSQL runs **independently** and **continuously** in the background.

## Summary

| Component | How It Runs | Window |
|-----------|-------------|--------|
| PostgreSQL | Windows Service | No window (background) |
| Backend | Separate CMD window | "Backend Server" |
| Frontend | Separate CMD window | "Frontend Server" |
| Browser | Opens automatically | Your default browser |

## Why This Fixes Registration

**Before:**
- Backend might not be running continuously
- Couldn't see errors
- Database connection might fail silently

**After:**
- Backend runs in visible window
- You can see "Connected to PostgreSQL database"
- You can see any errors immediately
- Registration works because backend is actually running!

## Testing

1. Run: `manage.bat start`
2. You should see **TWO new windows** open
3. Check Backend window shows: "Connected to PostgreSQL database"
4. Check Frontend window shows: "ready started server"
5. Browser opens to http://localhost:3000
6. Try to register - should work now!

## Troubleshooting

**If Backend window closes immediately:**
- PostgreSQL is not running
- Database doesn't exist
- Wrong password in `.env`
- Check the error message before window closes

**If Frontend window closes immediately:**
- npm not installed
- node_modules missing (run `npm install` first)
- Port 3000 already in use

**If windows don't open:**
- Run as Administrator
- Check antivirus isn't blocking

## Key Takeaway

Your observation was **100% correct**! The scripts needed to run backend and frontend in **separate, persistent windows** rather than hidden background processes. This ensures they run **continuously** and you can **see what's happening**.

Great catch! 🎯
