#!/bin/bash

# Project Manager for Linux/macOS
# Usage: ./manager.sh [start|stop|restart|status]

BACKEND_DIR="backend"
FRONTEND_DIR="frontend"
PID_FILE="project.pid"

# Helper function to check if a port is in use
check_port() {
    lsof -i :$1 >/dev/null 2>&1
}

# Helper function to get PID of process on port
get_pid() {
    lsof -t -i :$1
}

start() {
    echo ""
    echo "========================================"
    echo "  Starting File Sharing Application"
    echo "========================================"
    echo ""

    # Check if already running
    if check_port 8080; then
        echo "[WARNING] Backend is already running on port 8080!"
        echo "Use './manager.sh stop' to stop it first"
        exit 1
    fi

    if check_port 3000; then
        echo "[WARNING] Frontend is already running on port 3000!"
        echo "Use './manager.sh stop' to stop it first"
        exit 1
    fi

    # Start backend
    echo "[INFO] Starting backend server..."
    cd $BACKEND_DIR
    go run cmd/api/main.go > ../backend.log 2>&1 &
    BACKEND_PID=$!
    cd ..
    sleep 3

    if ps -p $BACKEND_PID > /dev/null; then
        echo "[SUCCESS] Backend started (PID: $BACKEND_PID)"
        echo "[INFO] Backend running on http://localhost:8080"
        echo "[INFO] Logs: backend.log"
    else
        echo "[ERROR] Backend failed to start. Check backend.log"
        exit 1
    fi

    # Check/Install frontend dependencies
    if [ ! -d "$FRONTEND_DIR/node_modules" ]; then
        echo ""
        echo "[WARNING] node_modules not found. Installing dependencies..."
        echo "[INFO] This may take a few minutes..."
        cd $FRONTEND_DIR
        npm install
        if [ $? -ne 0 ]; then
            echo "[ERROR] Failed to install dependencies"
            echo "[INFO] Please run 'npm install' manually in the frontend directory"
            cd ..
            exit 1
        fi
        cd ..
        echo "[SUCCESS] Dependencies installed"
    fi

    # Start frontend
    echo ""
    echo "[INFO] Starting frontend server..."
    cd $FRONTEND_DIR
    npm run dev > ../frontend.log 2>&1 &
    FRONTEND_PID=$!
    cd ..
    sleep 5

    if ps -p $FRONTEND_PID > /dev/null; then
        echo "[SUCCESS] Frontend started (PID: $FRONTEND_PID)"
        echo "[INFO] Frontend running on http://localhost:3000"
        echo "[INFO] Logs: frontend.log"
    else
        echo "[ERROR] Frontend failed to start. Check frontend.log"
        # Kill backend since frontend failed
        kill $BACKEND_PID
        exit 1
    fi

    echo "started" > $PID_FILE

    echo ""
    echo "========================================"
    echo "  Application Started Successfully"
    echo "========================================"
    echo ""
    echo "[SUCCESS] Backend: http://localhost:8080"
    echo "[SUCCESS] Frontend: http://localhost:3000"
    echo ""
    echo "[INFO] To stop: ./manager.sh stop"
    echo "[INFO] To check status: ./manager.sh status"
    echo ""

    # Open browser
    echo "[INFO] Opening browser..."
    sleep 2
    if [[ "$OSTYPE" == "darwin"* ]]; then
        open http://localhost:3000
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        xdg-open http://localhost:3000
    fi
}

stop() {
    echo ""
    echo "========================================"
    echo "  Stopping File Sharing Application"
    echo "========================================"
    echo ""

    STOPPED=0

    # Kill backend
    echo "[INFO] Stopping backend..."
    if check_port 8080; then
        PID=$(get_pid 8080)
        kill $PID
        echo "[SUCCESS] Backend stopped (PID: $PID)"
        STOPPED=1
    fi

    # Kill frontend
    echo "[INFO] Stopping frontend..."
    if check_port 3000; then
        PID=$(get_pid 3000)
        kill $PID
        echo "[SUCCESS] Frontend stopped (PID: $PID)"
        STOPPED=1
    fi

    # Clean up
    if [ -f $PID_FILE ]; then
        rm $PID_FILE
    fi

    if [ $STOPPED -eq 1 ]; then
        echo ""
        echo "========================================"
        echo "  Application Stopped"
        echo "========================================"
        echo ""
    else
        echo ""
        echo "[WARNING] No running processes found"
        echo ""
    fi
}

status() {
    echo ""
    echo "========================================"
    echo "  Application Status"
    echo "========================================"
    echo ""

    # Check backend
    if check_port 8080; then
        PID=$(get_pid 8080)
        echo "[SUCCESS] Backend is running (PID: $PID)"
        echo "[INFO]   URL: http://localhost:8080"
    else
        echo "[ERROR] Backend is not running"
    fi

    echo ""

    # Check frontend
    if check_port 3000; then
        PID=$(get_pid 3000)
        echo "[SUCCESS] Frontend is running (PID: $PID)"
        echo "[INFO]   URL: http://localhost:3000"
    else
        echo "[ERROR] Frontend is not running"
    fi

    echo ""
}

case "$1" in
    start)
        start
        ;;
    stop)
        stop
        ;;
    restart)
        stop
        sleep 2
        start
        ;;
    status)
        status
        ;;
    *)
        echo ""
        echo "========================================"
        echo "  File Sharing Application Manager"
        echo "========================================"
        echo ""
        echo "Usage:"
        echo "  ./manager.sh [command]"
        echo ""
        echo "Commands:"
        echo "  start     - Start backend and frontend servers"
        echo "  stop      - Stop all running servers"
        echo "  restart   - Restart all servers"
        echo "  status    - Check status of servers"
        echo ""
        exit 1
        ;;
esac
