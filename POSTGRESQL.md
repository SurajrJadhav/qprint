# PostgreSQL Integration Guide

## Overview

PostgreSQL is integrated into the backend (Go) application as the primary database for storing users and file metadata. Here's how it works:

## Architecture

```
┌─────────────┐
│   Frontend  │
│  (Next.js)  │
└──────┬──────┘
       │ HTTP/REST API
       ▼
┌─────────────┐
│   Backend   │
│    (Go)     │
└──────┬──────┘
       │ pgx driver
       ▼
┌─────────────┐
│ PostgreSQL  │
│  Database   │
└─────────────┘
```

## Database Connection

### 1. Connection Configuration

**File**: `backend/.env`
```env
DATABASE_URL=postgres://xerox:xerox123@localhost:5432/filesharing?sslmode=disable
```

**Format**: `postgres://[user]:[password]@[host]:[port]/[database]?[options]`

### 2. Connection Pool

**File**: `backend/internal/database/database.go`

```go
var DB *pgxpool.Pool  // Global connection pool

func Connect() {
    // 1. Read DATABASE_URL from environment
    dsn := os.Getenv("DATABASE_URL")
    
    // 2. Parse connection string
    config, err := pgxpool.ParseConfig(dsn)
    
    // 3. Create connection pool
    DB, err = pgxpool.NewWithConfig(ctx, config)
    
    // 4. Test connection
    DB.Ping(ctx)
}
```

**Why Connection Pool?**
- Reuses database connections
- Better performance under load
- Automatic connection management

### 3. Driver Used

**pgx/v5** - Pure Go PostgreSQL driver
- Fast and efficient
- Connection pooling built-in
- Type-safe queries
- Context support

## Database Schema

### Tables Created

**File**: `backend/internal/database/schema.go`

#### 1. Users Table
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,           -- Auto-incrementing ID
    username TEXT UNIQUE NOT NULL,   -- Unique username
    password_hash TEXT NOT NULL,     -- Bcrypt hashed password
    role TEXT NOT NULL,              -- 'customer' or 'shopkeeper'
    lat DOUBLE PRECISION,            -- Latitude (for shopkeepers)
    long DOUBLE PRECISION            -- Longitude (for shopkeepers)
);
```

#### 2. Files Table
```sql
CREATE TABLE files (
    id SERIAL PRIMARY KEY,           -- Auto-incrementing ID
    user_id INT REFERENCES users(id), -- Foreign key to users
    file_path TEXT NOT NULL,         -- Server file path
    unique_code TEXT UNIQUE NOT NULL, -- 6-char unique code
    status TEXT DEFAULT 'uploaded',  -- 'uploaded' or 'downloaded'
    created_at TIMESTAMP DEFAULT NOW() -- Upload timestamp
);
```

### Auto-Initialization

The schema is created automatically on startup:

**File**: `backend/cmd/api/main.go`
```go
func main() {
    database.Connect()      // Connect to PostgreSQL
    database.InitSchema()   // Create tables if not exist
    defer database.Close()  // Close on shutdown
    
    // ... rest of application
}
```

## How Data Flows

### Example: User Registration

1. **Frontend** sends POST request:
```javascript
POST /register
{
  "username": "john",
  "password": "secret123",
  "role": "customer"
}
```

2. **Backend Handler** (`handlers/auth.go`):
```go
func Register(w http.ResponseWriter, r *http.Request) {
    // Hash password
    hashedPassword := auth.HashPassword(req.Password)
    
    // Insert into PostgreSQL
    database.DB.QueryRow(
        "INSERT INTO users (username, password_hash, role, lat, long) 
         VALUES ($1, $2, $3, $4, $5) RETURNING id",
        req.Username, hashedPassword, req.Role, req.Lat, req.Long
    ).Scan(&userID)
}
```

3. **PostgreSQL** stores the data and returns the new user ID

### Example: File Upload

1. **Frontend** uploads file with JWT token
2. **Backend** (`handlers/files.go`):
```go
func UploadFile(w http.ResponseWriter, r *http.Request) {
    // Save file to disk
    filePath := "uploads/12345-file.pdf"
    
    // Generate unique code
    uniqueCode := "aB3xY9"
    
    // Store metadata in PostgreSQL
    database.DB.Exec(
        "INSERT INTO files (user_id, file_path, unique_code) 
         VALUES ($1, $2, $3)",
        userID, filePath, uniqueCode
    )
}
```

3. **PostgreSQL** stores file metadata (not the file itself!)

### Example: File Download

1. **Shopkeeper** enters unique code
2. **Backend** queries PostgreSQL:
```go
func DownloadFile(w http.ResponseWriter, r *http.Request) {
    code := chi.URLParam(r, "code")
    
    // Get file path from PostgreSQL
    var filePath string
    database.DB.QueryRow(
        "SELECT file_path FROM files WHERE unique_code = $1", 
        code
    ).Scan(&filePath)
    
    // Update status in PostgreSQL
    database.DB.Exec(
        "UPDATE files SET status = 'downloaded' WHERE unique_code = $1",
        code
    )
    
    // Serve the actual file
    http.ServeFile(w, r, filePath)
}
```

## Query Patterns Used

### 1. Parameterized Queries (SQL Injection Prevention)
```go
// ✅ SAFE - Uses $1, $2 placeholders
database.DB.QueryRow(
    "SELECT * FROM users WHERE username = $1", 
    username
)

// ❌ UNSAFE - String concatenation
database.DB.QueryRow(
    "SELECT * FROM users WHERE username = '" + username + "'"
)
```

### 2. Context Support
```go
// All queries use context for timeout/cancellation
database.DB.QueryRow(context.Background(), query, args...)
```

### 3. Transaction Support (Not used yet, but available)
```go
tx, _ := database.DB.Begin(ctx)
tx.Exec(ctx, "INSERT ...")
tx.Exec(ctx, "UPDATE ...")
tx.Commit(ctx)
```

## Data Storage Strategy

### What's in PostgreSQL:
- ✅ User accounts (username, password hash, role, location)
- ✅ File metadata (path, unique code, status, timestamps)
- ✅ Relationships (which user uploaded which file)

### What's NOT in PostgreSQL:
- ❌ Actual file content (stored in `backend/uploads/` directory)
- ❌ JWT tokens (generated on-demand, not stored)
- ❌ Temporary data (handled in memory)

## Setup Requirements

### 1. Install PostgreSQL
```bash
# Windows
winget install PostgreSQL.PostgreSQL

# Mac
brew install postgresql

# Linux
sudo apt install postgresql
```

### 2. Create Database
```sql
CREATE DATABASE filesharing;
```

### 3. Configure Connection
Edit `backend/.env`:
```env
DATABASE_URL=postgres://postgres:YOUR_PASSWORD@localhost:5432/filesharing?sslmode=disable
```

### 4. Start Backend
```bash
cd backend
go run cmd/api/main.go
```

Output should show:
```
Connected to PostgreSQL database
Server running on port 8080
```

## Troubleshooting

### "Unable to connect to database"
- Check PostgreSQL is running: `pg_isready`
- Verify DATABASE_URL in `.env`
- Check port 5432 is not blocked

### "Database does not exist"
```sql
-- Connect to PostgreSQL
psql -U postgres

-- Create database
CREATE DATABASE filesharing;
```

### "Password authentication failed"
- Check password in `.env` matches PostgreSQL password
- Try: `postgres://postgres:password@localhost:5432/filesharing?sslmode=disable`

### "Tables not created"
- Tables are created automatically on first run
- Check backend logs for errors
- Manually create: Run SQL from `schema.go`

## Advanced Features

### Connection Pool Configuration
```go
config.MaxConns = 25              // Max connections
config.MinConns = 5               // Min connections
config.MaxConnLifetime = 1 * time.Hour
config.MaxConnIdleTime = 30 * time.Minute
```

### Query Logging
```go
// Add to database.go for debugging
config.ConnConfig.Logger = logger
```

### Migrations (Future Enhancement)
Consider using tools like:
- `golang-migrate/migrate`
- `pressly/goose`
- `rubenv/sql-migrate`

## Security Features

1. **Parameterized Queries** - Prevents SQL injection
2. **Password Hashing** - Bcrypt with salt
3. **Connection Pooling** - Prevents connection exhaustion
4. **Environment Variables** - Credentials not in code
5. **SSL Support** - Can enable with `sslmode=require`

## Performance Considerations

- **Connection Pool**: Reuses connections (faster than creating new ones)
- **Prepared Statements**: pgx automatically prepares frequently used queries
- **Indexes**: Automatically created on PRIMARY KEY and UNIQUE columns
- **Transactions**: Use for multi-step operations (not implemented yet)

## Summary

PostgreSQL integration:
1. **Connection**: pgx driver with connection pooling
2. **Schema**: Auto-created on startup
3. **Queries**: Parameterized for security
4. **Data**: Stores user accounts and file metadata
5. **Files**: Actual files stored on disk, paths in database
