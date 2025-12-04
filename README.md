- **Authentication**: JWT

## Project Structure

```
Qprint_antiGravity/
├── backend/
│   ├── cmd/api/          # Main application entry point
│   ├── internal/
│   │   ├── auth/         # JWT authentication & middleware
│   │   ├── database/     # Database connection & schema
│   │   ├── handlers/     # HTTP request handlers
│   │   └── models/       # Data models
│   ├── .env              # Environment variables
│   └── go.mod
└── frontend/
    ├── app/              # Next.js app directory
    │   ├── dashboard/    # Customer dashboard
    │   ├── login/        # Login page
    │   ├── register/     # Registration page
    │   └── shopkeeper/   # Shopkeeper dashboard
    ├── lib/              # Utilities (API client)
    └── package.json
```

## Features

### Customer Features
- Register and login
- Upload files and receive unique codes
- View file status (uploaded/downloaded)
- View nearest shopkeepers

### Shopkeeper Features
- Register and login with location
- Download files using unique codes
- Automatic status update when file is downloaded

## Setup Instructions

### Prerequisites
- Go 1.25+
- Node.js 18+ and npm
- PostgreSQL 12+

### Database Setup

1. Create a PostgreSQL database:
```sql
CREATE DATABASE filesharing;
```

2. Update the `.env` file in the `backend` directory with your database credentials:
```env
PORT=8080
DATABASE_URL=postgres://xerox:xerox123@localhost:5432/filesharing?sslmode=disable
JWT_SECRET=your-secret-key-here
```

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
go mod download
```

3. Run the server:
```bash
go run cmd/api/main.go
```

The backend will automatically create the necessary database tables on startup.

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Quick Start with Management Scripts

Choose the script for your platform:

**Windows:**
```cmd
manage.bat start
manage.bat stop
manage.bat status
```

**Linux/Mac:**
```bash
./manage.sh start
./manage.sh stop
./manage.sh status
```

**Any OS (Python):**
```bash
python manage.py start
python manage.py stop
python manage.py status
```

See [MANAGEMENT.md](MANAGEMENT.md) for detailed usage.

## API Endpoints

### Public Endpoints
- `POST /register` - Register a new user
- `POST /login` - Login and receive JWT token
- `GET /file/{code}` - Download file by unique code
- `GET /file/{code}/status` - Check file status

### Protected Endpoints (Require Authentication)
- `POST /upload` - Upload a file (returns unique code)
- `GET /shops` - Get list of nearest shopkeepers

## Usage Flow

1. **Customer Registration**:
   - Navigate to `/register`
   - Choose "Customer" role
   - Create account

2. **Shopkeeper Registration**:
   - Navigate to `/register`
   - Choose "Shopkeeper" role
   - Allow location access to set shop location
   - Create account

3. **File Upload (Customer)**:
   - Login to customer dashboard
   - Upload a file
   - Receive and share the unique code with shopkeeper

4. **File Download (Shopkeeper)**:
   - Login to shopkeeper dashboard
   - Enter the unique code received from customer
   - Download the file
   - Customer's dashboard will automatically show status as "downloaded"

## Environment Variables

### Backend (.env)
```env
PORT=8080
DATABASE_URL=postgres://username:password@localhost:5432/filesharing?sslmode=disable
JWT_SECRET=your-secret-key-here
```

### Frontend
The frontend is configured to connect to `http://localhost:8080` by default. This can be changed in `lib/api.ts`.

## Security Features

- Password hashing using bcrypt
- JWT-based authentication
- Protected API routes
- CORS configuration
- SQL injection prevention using parameterized queries

## Notes

- Files are stored in the `backend/uploads` directory
- Distance calculation uses simple Euclidean distance (can be enhanced with Haversine formula)
- File status updates happen in real-time via polling (can be enhanced with WebSockets)
