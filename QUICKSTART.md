# Quick Start Guide

## Prerequisites Check

Before starting, ensure you have:
- [ ] Go 1.25+ installed (`go version`)
- [ ] Node.js 18+ and npm installed (`node -v` and `npm -v`)
- [ ] PostgreSQL 12+ installed and running
- [ ] Git (optional, for version control)

## 5-Minute Setup

### 1. Database Setup (2 minutes)

```bash
# Login to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE filesharing;

# Exit
\q
```

### 2. Backend Setup (1 minute)

```bash
# Navigate to backend
cd backend

# Update .env with your database credentials
# Edit: DATABASE_URL=postgres://xerox:xerox123@localhost:5432/filesharing?sslmode=disable

# Run the server
go run cmd/api/main.go
```

You should see: `Connected to PostgreSQL database` and `Server running on port 8080`

### 3. Frontend Setup (2 minutes)

Open a new terminal:

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

Open http://localhost:3000

## First Test

### Create a Customer Account
1. Go to http://localhost:3000/register
2. Username: `customer1`
3. Password: `password123`
4. Role: Customer
5. Click Register

### Create a Shopkeeper Account
1. Go to http://localhost:3000/register
2. Username: `shop1`
3. Password: `password123`
4. Role: Shopkeeper
5. Click "Get Current Location" (allow browser location access)
6. Click Register

### Test File Upload
1. Login as `customer1`
2. Upload a test file
3. Copy the unique code (e.g., `aB3xY9`)
4. Note the status shows "uploaded"

### Test File Download
1. Open new incognito/private window
2. Login as `shop1`
3. Enter the unique code from customer
4. Click Download
5. File should download

### Verify Status Update
1. Go back to customer dashboard
2. Status should now show "downloaded"

## Troubleshooting

### Backend won't start
- Check PostgreSQL is running: `pg_isready`
- Verify DATABASE_URL in `.env` is correct
- Check port 8080 is not in use

### Frontend won't start
- Delete `node_modules` and run `npm install` again
- Check port 3000 is not in use
- Try `npm run dev -- -p 3001` to use different port

### Can't login
- Check backend is running on port 8080
- Open browser console (F12) to see errors
- Verify user was created (check backend logs)

### File upload fails
- Check backend `uploads/` directory exists
- Verify file size is under 10MB
- Check you're logged in (token in localStorage)

## Production Deployment

For production deployment:

1. **Backend**:
   ```bash
   cd backend
   go build -o main ./cmd/api
   ./main
   ```

2. **Frontend**:
   ```bash
   cd frontend
   npm run build
   npm start
   ```

3. **Environment Variables**:
   - Update `DATABASE_URL` with production database
   - Change `JWT_SECRET` to a strong random string
   - Update frontend API URL in `lib/api.ts`

4. **Security**:
   - Enable HTTPS
   - Configure CORS for specific domains
   - Add rate limiting
   - Set up file size limits
   - Implement file type validation
