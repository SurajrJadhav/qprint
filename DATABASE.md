# Database Schema

## Tables

### users
Stores user information for both customers and shopkeepers.

```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL,           -- 'customer' or 'shopkeeper'
    lat DOUBLE PRECISION,          -- Latitude (for shopkeepers)
    long DOUBLE PRECISION          -- Longitude (for shopkeepers)
);
```

**Columns:**
- `id`: Auto-incrementing primary key
- `username`: Unique username for login
- `password_hash`: Bcrypt hashed password
- `role`: User role - either 'customer' or 'shopkeeper'
- `lat`: Latitude coordinate (used for shopkeepers to show on map)
- `long`: Longitude coordinate (used for shopkeepers to show on map)

### files
Stores uploaded file information and tracking.

```sql
CREATE TABLE files (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id),
    file_path TEXT NOT NULL,
    unique_code TEXT UNIQUE NOT NULL,
    status TEXT DEFAULT 'uploaded',  -- 'uploaded' or 'downloaded'
    created_at TIMESTAMP DEFAULT NOW()
);
```

**Columns:**
- `id`: Auto-incrementing primary key
- `user_id`: Foreign key to users table (customer who uploaded)
- `file_path`: Server file path where file is stored
- `unique_code`: 6-character unique code for file retrieval
- `status`: Current status of the file ('uploaded' or 'downloaded')
- `created_at`: Timestamp when file was uploaded

## Relationships

- `files.user_id` → `users.id`: Each file belongs to a customer user
- Files can only be created by customers (enforced by application logic)
- Shopkeepers can download files using the unique code

## Indexes

The following indexes are automatically created:
- Primary keys on `id` columns
- Unique index on `users.username`
- Unique index on `files.unique_code`
- Foreign key index on `files.user_id`

## Sample Queries

### Get all files uploaded by a customer
```sql
SELECT * FROM files WHERE user_id = $1 ORDER BY created_at DESC;
```

### Get file by unique code
```sql
SELECT * FROM files WHERE unique_code = $1;
```

### Get all shopkeepers with location
```sql
SELECT id, username, lat, long FROM users WHERE role = 'shopkeeper';
```

### Update file status
```sql
UPDATE files SET status = 'downloaded' WHERE unique_code = $1;
```
