# Fix PostgreSQL Password Authentication

## The Issue

```
FATAL: password authentication failed for user "xerox"
```

The password `xerox123` is **NOT correct** for the PostgreSQL user `xerox`.

## Solutions (Choose One)

### Solution 1: Reset Password for User 'xerox' (Recommended)

1. **Open SQL Shell (psql)** from Windows Start Menu
2. **Login as postgres** (the superuser):
   - Server: `localhost`
   - Database: `postgres`
   - Port: `5432`
   - Username: `postgres`
   - Password: [Your postgres password]

3. **Reset the password**:
   ```sql
   ALTER USER xerox WITH PASSWORD 'xerox123';
   ```

4. **Exit**:
   ```sql
   \q
   ```

5. **Update backend/.env** (if needed):
   ```env
   DATABASE_URL=postgres://xerox:xerox123@localhost:5432/filesharing?sslmode=disable
   ```

6. **Restart backend**

---

### Solution 2: Use the 'postgres' Superuser Instead

Instead of using `xerox`, use the default `postgres` user:

1. **Update backend/.env**:
   ```env
   PORT=8080
   DATABASE_URL=postgres://postgres:YOUR_POSTGRES_PASSWORD@localhost:5432/filesharing?sslmode=disable
   JWT_SECRET=supersecretkey123
   ```

   Replace `YOUR_POSTGRES_PASSWORD` with the password you set when installing PostgreSQL.

2. **Create database** (if needed):
   - Open SQL Shell (psql)
   - Login as `postgres`
   - Run: `CREATE DATABASE filesharing;`

3. **Restart backend**

---

### Solution 3: Create a New User with Known Password

1. **Open SQL Shell (psql)**
2. **Login as postgres**
3. **Create new user**:
   ```sql
   CREATE USER myuser WITH PASSWORD 'mypassword';
   ALTER USER myuser CREATEDB;
   GRANT ALL PRIVILEGES ON DATABASE filesharing TO myuser;
   ```

4. **Update backend/.env**:
   ```env
   DATABASE_URL=postgres://myuser:mypassword@localhost:5432/filesharing?sslmode=disable
   ```

5. **Restart backend**

---

### Solution 4: Find Your Actual Password

If you know the password but it's not `xerox123`:

1. **Test different passwords** in SQL Shell (psql):
   - Try logging in with different passwords
   - When you find the right one, update `.env`

2. **Common passwords to try**:
   - `xerox`
   - `xeroxpass`
   - `password`
   - `admin`
   - Whatever you typically use

---

## Step-by-Step: Using SQL Shell (psql)

### How to Open SQL Shell:

1. **Windows Start Menu** → Search "SQL Shell" or "psql"
2. **OR** Open pgAdmin 4 → Tools → Query Tool

### How to Login:

```
Server [localhost]:          [Press Enter]
Database [postgres]:         [Press Enter]
Port [5432]:                 [Press Enter]
Username [postgres]:         [Press Enter]
Password for user postgres:  [Type your postgres password]
```

### Reset xerox Password:

```sql
ALTER USER xerox WITH PASSWORD 'xerox123';
```

### Create Database:

```sql
CREATE DATABASE filesharing;
```

### Grant Permissions:

```sql
GRANT ALL PRIVILEGES ON DATABASE filesharing TO xerox;
```

### Exit:

```sql
\q
```

---

## Quick Fix Script

**Option A: Reset xerox password to xerox123**

Open SQL Shell as `postgres` and run:
```sql
ALTER USER xerox WITH PASSWORD 'xerox123';
CREATE DATABASE IF NOT EXISTS filesharing;
GRANT ALL PRIVILEGES ON DATABASE filesharing TO xerox;
\q
```

**Option B: Use postgres user**

Update `backend/.env`:
```env
DATABASE_URL=postgres://postgres:YOUR_POSTGRES_PASSWORD@localhost:5432/filesharing?sslmode=disable
```

---

## After Fixing

1. **Close** Backend Server window
2. **Run**: `manage.bat start`
3. **Check** Backend window:
   ```
   Connected to PostgreSQL database
   Server running on port 8080
   ```

---

## Testing Your Password

Try connecting with psql:

```bash
# Test with xerox user
psql -U xerox -d postgres

# Test with postgres user
psql -U postgres -d postgres
```

If it asks for password and you can login, that's the correct password!

---

## Recommended: Use postgres User

**Easiest solution:**

1. Find your `postgres` user password (set during PostgreSQL installation)
2. Update `backend/.env`:
   ```env
   DATABASE_URL=postgres://postgres:YOUR_PASSWORD@localhost:5432/filesharing?sslmode=disable
   ```
3. Create database as postgres user
4. Done!

---

## What Password Should You Use?

**Tell me:**
1. Do you know the password for the `postgres` user?
2. Do you know the password for the `xerox` user?
3. Would you like to create a new user with a simple password?

**Then I'll update the `.env` file accordingly!**
