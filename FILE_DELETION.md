# File Auto-Deletion After Download

## Feature Added

Files are now **automatically deleted** after being downloaded by a shopkeeper to prevent re-downloading.

## Changes Made

### 1. File Deletion After Download

**File**: `backend/internal/handlers/files.go`

**In `DownloadFile()` function:**
```go
// Serve the file
http.ServeFile(w, r, filePath)

// Delete the file after successful download
err = os.Remove(filePath)
if err != nil {
    fmt.Printf("Warning: Failed to delete file %s: %v\n", filePath, err)
} else {
    fmt.Printf("File deleted after download: %s\n", filePath)
}
```

### 2. Prevent Re-downloading

**Added status check:**
```go
// Check if file has already been downloaded
if status == "downloaded" {
    http.Error(w, "File has already been downloaded and is no longer available", http.StatusGone)
    return
}
```

## How It Works

### Customer Uploads File:
1. Customer uploads file
2. File saved to `backend/uploads/`
3. Unique code generated (e.g., `aB3xY9`)
4. Database record created with `status = 'uploaded'`

### Shopkeeper Downloads File:
1. Shopkeeper enters unique code
2. Backend checks if `status == 'uploaded'`
3. If yes:
   - Serves the file for download
   - Updates database: `status = 'downloaded'`
   - **Deletes the physical file** from disk
4. If `status == 'downloaded'`:
   - Returns error: "File has already been downloaded"

### Customer Checks Status:
1. Customer sees status change from `uploaded` → `downloaded`
2. Knows the file was successfully retrieved

## Benefits

✅ **Security**: File can only be downloaded once
✅ **Privacy**: File is deleted after download
✅ **Storage**: Saves disk space
✅ **One-time use**: Each unique code works only once

## Error Handling

- If file deletion fails, it logs a warning but doesn't fail the request
- File was already served to shopkeeper
- Database still marked as `downloaded`

## API Response Changes

### Download Endpoint: `GET /file/{code}`

**Success (200 OK):**
- File is downloaded
- File is deleted
- Status updated to 'downloaded'

**Already Downloaded (410 Gone):**
```json
"File has already been downloaded and is no longer available"
```

**Not Found (404):**
```json
"File not found"
```

## Testing

1. **Upload a file** as customer
2. **Get unique code** (e.g., `aB3xY9`)
3. **Download once** as shopkeeper: ✅ Works
4. **Try to download again**: ❌ Error: "File has already been downloaded"
5. **Check uploads folder**: File is gone
6. **Check customer dashboard**: Status shows "downloaded"

## Database Schema

No changes needed - already has `status` column:
```sql
status TEXT DEFAULT 'uploaded'  -- Can be 'uploaded' or 'downloaded'
```

## Frontend Impact

### Shopkeeper Page
If shopkeeper tries to download the same code twice:
- First time: File downloads successfully
- Second time: Error message shown

### Customer Dashboard
- Status updates from "uploaded" to "downloaded"
- Customer knows file was retrieved

## Summary

✅ Files are automatically deleted after download
✅ Prevents re-downloading with status check
✅ Saves disk space
✅ Enhances security and privacy
✅ One-time use per unique code
