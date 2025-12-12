#!/bin/bash
# Project Manager for Linux/Mac
# Usage: ./manage.sh [start|stop|restart|status]

# set -e removed to prevent early exit during cleanup

BACKEND_DIR="backend"
FRONTEND_DIR="frontend"
PID_FILE="project.pid"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

print_header() {
    echo -e "\n${CYAN}========================================${NC}" >&2
    echo -e "${CYAN}$1${NC}" >&2
    echo -e "${CYAN}========================================${NC}\n" >&2
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}" >&2
}

print_error() {
    echo -e "${RED}✗ $1${NC}" >&2
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}" >&2
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}" >&2
}

# Check if process is running
is_running() {
    local pid=$1
    if [ -z "$pid" ]; then
        return 1
    fi
    if ps -p "$pid" > /dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Open log in new terminal
open_terminal_log() {
    local title=$1
    local log_file=$2
    local pid=$3
    
    # Command to run: tail -f --pid=PID log_file; read
    # This ensures the window stays open after the process dies
    local cmd="tail -f --pid=$pid $log_file; echo ''; echo 'Process exited. Press Enter to close...'; read"
    
    if command -v gnome-terminal > /dev/null; then
        gnome-terminal --title="$title" -- bash -c "$cmd"
    elif command -v konsole > /dev/null; then
        konsole --title "$title" -e bash -c "$cmd"
    elif command -v xfce4-terminal > /dev/null; then
        xfce4-terminal --title="$title" -e "bash -c \"$cmd\""
    elif command -v xterm > /dev/null; then
        xterm -T "$title" -e "$cmd" &
    else
        print_warning "No supported terminal emulator found. Logs will not be shown in separate window."
        print_info "You can view logs manually: tail -f $log_file"
    fi
}

# Start backend
start_backend() {
    print_info "Starting backend server..."
    
    if [ ! -d "$BACKEND_DIR" ]; then
        print_error "Backend directory not found!"
        return 1
    fi
    
    cd "$BACKEND_DIR"
    nohup go run cmd/api/main.go > ../backend.log 2>&1 &
    local pid=$!
    cd ..
    
    sleep 2
    
    if is_running "$pid"; then
        print_success "Backend started (PID: $pid)"
        print_info "Backend running on http://localhost:8080"
        
        # Open log in new window
        open_terminal_log "Backend Logs" "$(pwd)/backend.log" "$pid"
        
        echo "$pid"
        return 0
    else
        print_error "Backend failed to start. Check backend.log"
        return 1
    fi
}

# Start frontend
start_frontend() {
    print_info "Starting frontend server..."
    
    if [ ! -d "$FRONTEND_DIR" ]; then
        print_error "Frontend directory not found!"
        return 1
    fi
    
    # Check if node_modules exists
    if [ ! -d "$FRONTEND_DIR/node_modules" ]; then
        print_warning "node_modules not found. Installing dependencies..."
        cd "$FRONTEND_DIR"
        npm install || {
            print_error "Failed to install dependencies"
            cd ..
            return 1
        }
        cd ..
    fi
    
    cd "$FRONTEND_DIR"
    nohup npm run dev > ../frontend.log 2>&1 &
    local pid=$!
    cd ..
    
    sleep 3
    
    if is_running "$pid"; then
        print_success "Frontend started (PID: $pid)"
        print_info "Frontend running on http://localhost:3000"
        
        # Open log in new window
        open_terminal_log "Frontend Logs" "$(pwd)/frontend.log" "$pid"
        
        echo "$pid"
        return 0
    else
        print_error "Frontend failed to start. Check frontend.log"
        return 1
    fi
}

# Start project
start_project() {
    print_header "Starting File Sharing Application"
    
    # Check if already running
    if [ -f "$PID_FILE" ]; then
        source "$PID_FILE"
        if is_running "$BACKEND_PID" || is_running "$FRONTEND_PID"; then
            print_warning "Project is already running!"
            print_info "Use './manage.sh stop' to stop it first"
            return 1
        fi
    fi
    
    # Start backend
    BACKEND_PID=$(start_backend)
    if [ $? -ne 0 ]; then
        BACKEND_PID=""
    fi
    
    # Start frontend
    FRONTEND_PID=$(start_frontend)
    if [ $? -ne 0 ]; then
        FRONTEND_PID=""
    fi
    
    # Save PIDs
    if [ -n "$BACKEND_PID" ] || [ -n "$FRONTEND_PID" ]; then
        echo "BACKEND_PID=$BACKEND_PID" > "$PID_FILE"
        echo "FRONTEND_PID=$FRONTEND_PID" >> "$PID_FILE"
        
        print_header "Application Started Successfully"
        print_success "Backend: http://localhost:8080"
        print_success "Frontend: http://localhost:3000"
        print_info "\nTo stop: ./manage.sh stop"
        
        # Open browser
        if [ -n "$FRONTEND_PID" ]; then
            print_info "Opening browser..."
            sleep 2
            if command -v xdg-open > /dev/null; then
                xdg-open http://localhost:3000 2>/dev/null
            elif command -v open > /dev/null; then
                open http://localhost:3000 2>/dev/null
            fi
        fi
    else
        print_error "Failed to start application"
        return 1
    fi
}

# Kill process and its children
kill_tree() {
    local pid=$1
    if [ -z "$pid" ]; then
        return
    fi
    
    # Kill children first
    pkill -P "$pid" 2>/dev/null || true
    
    # Kill parent
    kill "$pid" 2>/dev/null || kill -9 "$pid" 2>/dev/null || true
}

# Stop project
stop_project() {
    print_header "Stopping File Sharing Application"
    
    if [ ! -f "$PID_FILE" ]; then
        print_warning "No PID file found. Checking ports..."
    else
        source "$PID_FILE"
        
        # Stop backend
        if [ -n "$BACKEND_PID" ]; then
            print_info "Stopping backend tree (PID: $BACKEND_PID)..."
            kill_tree "$BACKEND_PID" || true
        fi
        
        # Stop frontend
        if [ -n "$FRONTEND_PID" ]; then
            print_info "Stopping frontend tree (PID: $FRONTEND_PID)..."
            kill_tree "$FRONTEND_PID" || true
        fi
        
        # Clean up
        rm -f "$PID_FILE" backend.log frontend.log
    fi
    
    # Fallback: Kill by port to ensure clean state
    print_info "Ensuring ports are free..."
    
    # Free port 8080 (Backend)
    local port_8080_pid=$(lsof -t -i:8080 2>/dev/null)
    if [ -n "$port_8080_pid" ]; then
        print_warning "Port 8080 still in use by PID $port_8080_pid. Killing..."
        kill -9 "$port_8080_pid" 2>/dev/null
    fi
    
    # Free port 3000 (Frontend)
    local port_3000_pid=$(lsof -t -i:3000 2>/dev/null)
    if [ -n "$port_3000_pid" ]; then
        print_warning "Port 3000 still in use by PID $port_3000_pid. Killing..."
        kill -9 "$port_3000_pid" 2>/dev/null
    fi
    
    print_success "Application stopped and ports freed"
}

# Restart project
restart_project() {
    print_header "Restarting File Sharing Application"
    stop_project
    sleep 2
    start_project
}

# Check status
status_project() {
    print_header "Application Status"
    
    if [ ! -f "$PID_FILE" ]; then
        print_error "Backend is not running"
        print_error "Frontend is not running"
        echo ""
        return 0
    fi
    
    source "$PID_FILE"
    
    # Check backend
    if [ -n "$BACKEND_PID" ] && is_running "$BACKEND_PID"; then
        print_success "Backend is running (PID: $BACKEND_PID)"
        print_info "  URL: http://localhost:8080"
    else
        print_error "Backend is not running"
    fi
    
    # Check frontend
    if [ -n "$FRONTEND_PID" ] && is_running "$FRONTEND_PID"; then
        print_success "Frontend is running (PID: $FRONTEND_PID)"
        print_info "  URL: http://localhost:3000"
    else
        print_error "Frontend is not running"
    fi
    
    echo ""
}

# Show help
show_help() {
    print_header "File Sharing Application Manager"
    echo -e "${CYAN}Usage:${NC}"
    echo "  ./manage.sh [command]"
    echo ""
    echo -e "${CYAN}Commands:${NC}"
    echo -e "  ${GREEN}start${NC}     - Start backend and frontend servers"
    echo -e "  ${RED}stop${NC}      - Stop all running servers"
    echo -e "  ${YELLOW}restart${NC}   - Restart all servers"
    echo -e "  ${BLUE}status${NC}    - Check status of servers"
    echo -e "  ${CYAN}help${NC}      - Show this help message"
    echo ""
}

# Main
case "${1:-help}" in
    start)
        start_project
        ;;
    stop)
        stop_project
        ;;
    restart)
        restart_project
        ;;
    status)
        status_project
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        print_error "Unknown command: $1"
        show_help
        exit 1
        ;;
esac
