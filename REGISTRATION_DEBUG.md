# Registration Troubleshooting Guide

## Issue: "Registration failed"

If you're seeing "Registration failed" error, here's how to diagnose and fix it:

## Step 1: Check if Backend is Running

### Windows:
```cmd
netstat -ano | findstr :8080
```

### Linux/Mac:
```bash
lsof -i :8080
```

**If nothing shows up**: Backend is NOT running.

**Solution**: Start the backend:
```bash
cd backend
go run cmd/api/main.go
```

## Step 2: Check Backend Logs

Look for error messages in the terminal where backend is running.

### Common Errors:

#### "DATABASE_URL environment variable is not set"
**Fix**: Create or update `backend/.env`:
```env
DATABASE_URL=postgres://postgres:YOUR_PASSWORD@localhost:5432/filesharing?sslmode=disable
```

#### "Unable to connect to database"
**Fix**: 
1. Check PostgreSQL is running
2. Verify password in `.env` is correct
3. Make sure database `filesharing` exists

#### "Failed to register user: duplicate key value violates unique constraint"
**Fix**: Username already exists. Try a different username.

## Step 3: Check Frontend Error (Browser Console)

1. Open browser Developer Tools (F12)
2. Go to Console tab
3. Try to register again
4. Look for error messages

### Common Frontend Errors:

#### "Cannot connect to server"
- Backend is not running on port 8080
- CORS issue (backend should allow localhost:3000)

#### "Network Error"
- Backend is not accessible
- Check firewall settings

#### "400 Bad Request"
- Invalid data sent to backend
- Check all fields are filled

#### "500 Internal Server Error"
- Backend error (check backend logs)
- Usually database connection issue

## Step 4: Test Backend Directly

Use curl or Postman to test the backend API:

```bash
curl -X POST http://localhost:8080/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"test123","role":"customer","lat":0,"long":0}'
```

**Expected response**:
```json
{"user_id":1}
```

**If you get an error**: The problem is in the backend.

## Step 5: Check Database

### Connect to PostgreSQL:
```bash
psql -U postgres -d filesharing
```

### Check if tables exist:
```sql
\dt
```

Should show:
```
 public | files | table | postgres
 public | users | table | postgres
```

### Check if user was created:
```sql
SELECT * FROM users;
```

## Common Solutions

### 1. Backend Not Running
```bash
cd backend
go run cmd/api/main.go
```

### 2. PostgreSQL Not Running

**Windows**:
```powershell
Start-Service postgresql-x64-16
```

**Linux/Mac**:
```bash
sudo service postgresql start
```

### 3. Database Doesn't Exist
```sql
CREATE DATABASE filesharing;
```

### 4. Wrong Password in .env
Update `backend/.env` with correct PostgreSQL password.

### 5. CORS Issue
Backend should have CORS configured (already done in `main.go`):
```go
r.Use(cors.Handler(cors.Options{
    AllowedOrigins: []string{"https://*", "http://*"},
    // ...
}))
```

## Improved Error Messages

I've updated the frontend to show better error messages:

- **"Cannot connect to server. Is the backend running?"** - Backend not accessible
- **Actual error from backend** - Shows the real error message
- **Console logs** - Check browser console for detailed errors

## Quick Checklist

- [ ] PostgreSQL is running
- [ ] Database `filesharing` exists
- [ ] `backend/.env` has correct DATABASE_URL
- [ ] Backend is running on port 8080
- [ ] Frontend is running on port 3000
- [ ] No firewall blocking ports 8080 or 3000
- [ ] Browser console shows no errors

## Still Not Working?

1. **Restart everything**:
   ```bash
   # Stop all
   manage.bat stop  # or ./manage.sh stop
   
   # Start PostgreSQL
   # Start backend manually to see errors
   cd backend
   go run cmd/api/main.go
   
   # In new terminal, start frontend
   cd frontend
   npm run dev
   ```

2. **Check the actual error message** in:
   - Browser console (F12)
   - Backend terminal output
   - PostgreSQL logs

3. **Try a simple test**:
   - Can you access http://localhost:8080 in browser?
   - Can you access http://localhost:3000 in browser?

## Example: Successful Registration Flow

1. **Frontend** sends:
```json
POST http://localhost:8080/register
{
  "username": "cust1",
  "password": "pass123",
  "role": "customer",
  "lat": 0,
  "long": 0
}
```

2. **Backend** receives and:
   - Hashes password
   - Inserts into PostgreSQL
   - Returns user_id

3. **Frontend** receives:
```json
{
  "user_id": 1
}
```

4. **Frontend** redirects to `/login`

If any step fails, you'll see an error message!
