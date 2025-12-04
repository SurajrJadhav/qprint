# Project Management Scripts

The project now includes native scripts for both Windows and Linux/Mac systems.

## For Windows

Use the batch script:

```cmd
REM Start the application
manage.bat start

REM Stop the application
manage.bat stop

REM Restart the application
manage.bat restart

REM Check status
manage.bat status

REM Show help
manage.bat help
```

## For Linux/Mac

Use the bash script:

```bash
# Make executable (first time only)
chmod +x manage.sh

# Start the application
./manage.sh start

# Stop the application
./manage.sh stop

# Restart the application
./manage.sh restart

# Check status
./manage.sh status

# Show help
./manage.sh help
```

## Features

Both scripts provide:
- ✅ **Start**: Starts both backend and frontend servers
- ✅ **Stop**: Stops all running servers
- ✅ **Restart**: Restarts both servers
- ✅ **Status**: Check which services are running
- ✅ **Auto-install**: Automatically runs `npm install` if needed
- ✅ **Browser**: Opens browser automatically on start
- ✅ **Logging**: Creates backend.log and frontend.log files

## Python Script (Cross-platform)

The Python script (`manage.py`) is still available and works on all platforms:

```bash
python manage.py start
python manage.py stop
python manage.py restart
python manage.py status
```

## Which One to Use?

- **Windows**: Use `manage.bat` (native, no Python required)
- **Linux/Mac**: Use `manage.sh` (native, no Python required)
- **Any OS**: Use `manage.py` (requires Python)

All three scripts provide the same functionality!

## Troubleshooting

### Windows
If you get "command not found", make sure you're in the project directory:
```cmd
cd G:\Qprint_antiGravity
manage.bat start
```

### Linux/Mac
If you get "permission denied":
```bash
chmod +x manage.sh
./manage.sh start
```

### Stopping Processes

**Windows:**
```cmd
manage.bat stop
```

Or manually:
```cmd
REM Find processes on ports
netstat -ano | findstr :8080
netstat -ano | findstr :3000

REM Kill by PID
taskkill /F /PID <PID>
```

**Linux/Mac:**
```bash
./manage.sh stop
```

Or manually:
```bash
# Find processes
lsof -i :8080
lsof -i :3000

# Kill by PID
kill <PID>
```
