# Fix PostgreSQL Password Authentication Error

## Error You're Seeing

```
FATAL: password authentication failed for user "xerox"
```

This means:
- PostgreSQL is running ✅
- Database connection attempted ✅
- **Password is incorrect** ❌

## Solution

Update your `backend/.env` file with the correct PostgreSQL password.

### Step 1: Find Your PostgreSQL Password

The password you set when you installed PostgreSQL.

**Don't remember?** You can reset it:

#### Windows:
1. Open **SQL Shell (psql)** or **pgAdmin**
2. Login with current credentials
3. Run:
```sql
ALTER USER xerox WITH PASSWORD 'your_new_password';
```

Or create a new user:
```sql
CREATE USER myuser WITH PASSWORD 'mypassword';
ALTER USER myuser CREATEDB;
```

### Step 2: Update backend/.env

Open `backend/.env` and update the DATABASE_URL:

**Current (WRONG):**
```env
DATABASE_URL=postgres://xerox:WRONG_PASSWORD@localhost:5432/filesharing?sslmode=disable
```

**Fixed (CORRECT):**
```env
DATABASE_URL=postgres://xerox:YOUR_ACTUAL_PASSWORD@localhost:5432/filesharing?sslmode=disable
```

Replace `YOUR_ACTUAL_PASSWORD` with your real PostgreSQL password.

### Step 3: Alternative - Use Default postgres User

If you don't know the password for user `xerox`, use the default `postgres` user:

```env
DATABASE_URL=postgres://postgres:YOUR_POSTGRES_PASSWORD@localhost:5432/filesharing?sslmode=disable
```

### Step 4: Test the Connection

After updating `.env`:

1. **Restart the backend** (close the Backend Server window)
2. Run: `manage.bat start` again
3. Check Backend Server window

**Should see:**
```
Connected to PostgreSQL database
Server running on port 8080
```

## Quick Fix Example

If your PostgreSQL password is `password123`:

**backend/.env:**
```env
PORT=8080
DATABASE_URL=postgres://postgres:password123@localhost:5432/filesharing?sslmode=disable
JWT_SECRET=supersecretkey123
```

## Common PostgreSQL Users

| User | When It's Created |
|------|------------------|
| `postgres` | Default superuser (created during installation) |
| `xerox` | Custom user (you or someone created it) |

## Testing PostgreSQL Login

Test if your credentials work:

```cmd
psql -U xerox -d filesharing
```

Or:

```cmd
psql -U postgres -d filesharing
```

If it asks for password and you can login, use that password in `.env`.

## Create Database (if needed)

Once logged in to psql:

```sql
CREATE DATABASE filesharing;
```

## Full Working Example

**backend/.env:**
```env
PORT=8080
DATABASE_URL=postgres://postgres:mypassword@localhost:5432/filesharing?sslmode=disable
JWT_SECRET=supersecretkey123
```

Replace `mypassword` with your actual PostgreSQL password!

## After Fixing

1. Update `backend/.env` with correct password
2. Close Backend Server window
3. Run: `manage.bat start`
4. Backend window should show: "Connected to PostgreSQL database"
5. Try registration again - should work! ✅
