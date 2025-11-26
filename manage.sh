#!/bin/bash
# Project Manager for Linux/Mac
# Usage: ./manage.sh [start|stop|restart|status]

set -e

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
    echo -e "\n${CYAN}========================================${NC}"
    echo -e "${CYAN}$1${NC}"
    echo -e "${CYAN}========================================${NC}\n"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
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

# Stop project
stop_project() {
    print_header "Stopping File Sharing Application"
    
    if [ ! -f "$PID_FILE" ]; then
        print_warning "No PID file found. Nothing to stop."
        return 0
    fi
    
    source "$PID_FILE"
    
    local stopped=false
    
    # Stop backend
    if [ -n "$BACKEND_PID" ] && is_running "$BACKEND_PID"; then
        print_info "Stopping backend (PID: $BACKEND_PID)..."
        kill "$BACKEND_PID" 2>/dev/null || kill -9 "$BACKEND_PID" 2>/dev/null
        print_success "Backend stopped"
        stopped=true
    else
        print_info "Backend is not running"
    fi
    
    # Stop frontend
    if [ -n "$FRONTEND_PID" ] && is_running "$FRONTEND_PID"; then
        print_info "Stopping frontend (PID: $FRONTEND_PID)..."
        kill "$FRONTEND_PID" 2>/dev/null || kill -9 "$FRONTEND_PID" 2>/dev/null
        print_success "Frontend stopped"
        stopped=true
    else
        print_info "Frontend is not running"
    fi
    
    # Clean up
    rm -f "$PID_FILE" backend.log frontend.log
    
    if [ "$stopped" = true ]; then
        print_header "Application Stopped"
    else
        print_warning "No running processes found"
    fi
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
