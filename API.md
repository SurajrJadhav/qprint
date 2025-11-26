# API Documentation

Base URL: `http://localhost:8080`

## Authentication

Most endpoints require JWT authentication. Include the token in the Authorization header:
```
Authorization: Bearer <token>
```

## Endpoints

### Public Endpoints

#### POST /register
Register a new user (customer or shopkeeper).

**Request Body:**
```json
{
  "username": "string",
  "password": "string",
  "role": "customer" | "shopkeeper",
  "lat": 0.0,      // Optional, for shopkeepers
  "long": 0.0      // Optional, for shopkeepers
}
```

**Response:** `201 Created`
```json
{
  "user_id": 1
}
```

**Errors:**
- `400 Bad Request`: Invalid request body
- `500 Internal Server Error`: Registration failed (username might already exist)

---

#### POST /login
Login and receive JWT token.

**Request Body:**
```json
{
  "username": "string",
  "password": "string"
}
```

**Response:** `200 OK`
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "role": "customer" | "shopkeeper"
}
```

**Errors:**
- `400 Bad Request`: Invalid request body
- `401 Unauthorized`: Invalid credentials

---

#### GET /file/{code}
Download a file using its unique code. Updates status to 'downloaded'.

**Parameters:**
- `code` (path): 6-character unique code

**Response:** `200 OK`
- Returns the file as a download

**Errors:**
- `404 Not Found`: File not found

---

#### GET /file/{code}/status
Check the status of a file.

**Parameters:**
- `code` (path): 6-character unique code

**Response:** `200 OK`
```json
{
  "status": "uploaded" | "downloaded"
}
```

**Errors:**
- `404 Not Found`: File not found

---

### Protected Endpoints

#### POST /upload
Upload a file and receive a unique code. Requires authentication.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Request Body:**
- `file`: File to upload (multipart form data)

**Response:** `200 OK`
```json
{
  "code": "aB3xY9"
}
```

**Errors:**
- `400 Bad Request`: No file provided or invalid file
- `401 Unauthorized`: Missing or invalid token
- `500 Internal Server Error`: Upload failed

---

#### GET /shops
Get list of all shopkeepers with their locations and distances.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
[
  {
    "id": 2,
    "username": "shop1",
    "lat": 12.9716,
    "long": 77.5946,
    "distance": 0.05
  },
  {
    "id": 3,
    "username": "shop2",
    "lat": 12.9800,
    "long": 77.6000,
    "distance": 0.12
  }
]
```

**Notes:**
- Distance is calculated in degrees (can be converted to km by multiplying by ~111)
- Currently uses mock user location (0, 0) - should be enhanced to use actual user location

**Errors:**
- `401 Unauthorized`: Missing or invalid token
- `500 Internal Server Error`: Database error

---

## Error Responses

All error responses follow this format:
```
HTTP/1.1 <status_code>
Content-Type: text/plain

<error_message>
```

## Rate Limiting

Currently no rate limiting is implemented. Consider adding rate limiting for production use.

## CORS

CORS is enabled for all origins in development. Configure appropriately for production.

## File Upload Limits

- Maximum file size: 10 MB
- Supported file types: All
