# Database Migration Required

## Problem
The backend code has been updated with new columns for the Queue Print feature, but the database schema hasn't been updated yet. This causes a "Database error" when uploading files.

## Solution
You need to run the migration script to add the new columns to the `files` table.

### Option 1: Using pgAdmin (Recommended)
1. Open **pgAdmin**
2. Connect to your PostgreSQL server
3. Navigate to: **Servers** → **PostgreSQL** → **Databases** → **filesharing**
4. Right-click on **filesharing** → **Query Tool**
5. Copy and paste the SQL from `backend/migrations/001_add_queue_print_columns.sql`
6. Click **Execute** (F5)

### Option 2: Using Command Line
If you have `psql` in your PATH:
```bash
psql -U xerox -d filesharing -f backend/migrations/001_add_queue_print_columns.sql
```

Enter password: `xerox123`

### Option 3: Manual SQL Execution
Connect to your database and run these commands:

```sql
ALTER TABLE files ADD COLUMN IF NOT EXISTS print_type TEXT DEFAULT 'private';
ALTER TABLE files ADD COLUMN IF NOT EXISTS copies INT DEFAULT 1;
ALTER TABLE files ADD COLUMN IF NOT EXISTS print_mode TEXT DEFAULT 'single';
ALTER TABLE files ADD COLUMN IF NOT EXISTS color_mode TEXT DEFAULT 'bw';
ALTER TABLE files ADD COLUMN IF NOT EXISTS paper_size TEXT DEFAULT 'A4';
ALTER TABLE files ADD COLUMN IF NOT EXISTS num_pages INT DEFAULT 0;
ALTER TABLE files ADD COLUMN IF NOT EXISTS total_cost DECIMAL(10,2) DEFAULT 0;
ALTER TABLE files ADD COLUMN IF NOT EXISTS shop_id INT REFERENCES users(id);
ALTER TABLE files ADD COLUMN IF NOT EXISTS queue_position INT;
```

## Verify Migration
After running the migration, verify it worked:

```sql
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'files' 
ORDER BY ordinal_position;
```

You should see all the new columns listed.

## After Migration
1. Restart the backend: `manage.bat restart`
2. Try uploading a file again - it should work!

---

**Migration file location:** `backend/migrations/001_add_queue_print_columns.sql`
