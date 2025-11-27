# Card App Backend

A modern Node.js backend application built with TypeScript for managing cards/tasks with comprehensive authentication, logging, and deployment capabilities.

## Features

- **RESTful API** for card management (CRUD operations)
- **JWT Authentication** with role-based authorization (admin/user roles)
- **TypeScript** for type safety and better development experience
- **MongoDB** integration with Mongoose ODM
- **Express.js** framework with comprehensive middleware
- **Winston Logging** with multiple log levels and file outputs
- **Docker Support** for containerized deployment
- **Railway Deployment** ready with production configuration
- **Health Monitoring** with multiple status endpoints
- **CORS Configuration** for cross-origin requests
- **Environment Management** for different deployment stages

## Tech Stack

- **Runtime**: Node.js 24+ (Alpine Linux in containers)
- **Language**: TypeScript
- **Framework**: Express.js
- **Database**: MongoDB with authentication
- **Authentication**: JWT + Passport.js
- **Logging**: Winston with custom formatters
- **Containerization**: Docker & Docker Compose
- **Deployment**: Railway (with MongoDB service)

## Prerequisites

- Node.js 24 or higher
- MongoDB (Docker container or cloud service)
- Docker & Docker Compose (for containerized development)

## Project Structure

```
card-app/
├── src/
│   ├── config/           # Database and app configuration
│   ├── controllers/      # Request handlers and business logic
│   ├── middleware/       # Express middleware (auth, logging, debug)
│   ├── models/          # Mongoose models (User, Card)
│   ├── queries/         # Database aggregation pipelines
│   ├── routes/          # API route definitions
│   ├── types/           # TypeScript type definitions
│   ├── utils/           # Utility functions and logger
│   └── server.ts        # Express app initialization
├── docker/              # Docker configurations
│   ├── Dockerfile       # Standard container build
│   └── railway.Dockerfile # Railway-optimized build
├── logs/               # Application logs (development)
├── mongodb-docker/     # Local MongoDB setup
├── mongodb-scripts/    # Database utility scripts
├── .env.example       # Environment variables template
├── package.json       # Dependencies and scripts
└── tsconfig.json     # TypeScript configuration
```

## Getting Started

### Development Setup

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Set up environment:**

   ```bash
   cp .env.example .env
   # Edit .env with your local values
   ```

3. **Start MongoDB (using provided Docker setup):**

   ```bash
   cd mongodb-docker
   ./start-mongodb.ps1  # Windows
   # or
   docker-compose up -d
   ```

4. **Start development server:**
   ```bash
   npm run dev
   ```

### Docker Development

```bash
# Start entire stack (MongoDB + Backend)
docker-compose up -d

# View logs
docker-compose logs -f backend

# Stop services
docker-compose down
```

## API Endpoints

### Health & Status Monitoring

- `GET /` - Basic server status
- `GET /health` - Health check endpoint
- `GET /api` - API information and available endpoints

### Authentication

- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/profile` - Get user profile (authenticated)

### Card Management

- `GET /api/cards` - Get user's cards (authenticated)
- `GET /api/cards/stat` - Get card statistics (authenticated)
- `GET /api/cards/:id` - Get specific card (authenticated)
- `POST /api/cards` - Create new card (authenticated)
- `PUT /api/cards/:id` - Update card (authenticated)
- `DELETE /api/cards/:id` - Delete card (admin only)

### Admin & Debug

- `GET /api/admin/all` - Get all cards (owner only)
- `GET /api/admin/log-level` - Get current log level (admin)
- `POST /api/admin/log-level` - Set log level (admin)
- `GET /api/debug/whoami` - Debug user info (admin)

## Data Models

### Card Model

```typescript
{
  _id: ObjectId;
  title: string; // Card title
  description: string; // Card description
  status: "todo" | "doing" | "done"; // Card status
  userId: ObjectId; // Owner reference
  createdAt: Date; // Auto-generated
  updatedAt: Date; // Auto-generated
  __v: number; // Version key
}
```

### User Model

```typescript
{
  _id: ObjectId;
  username: string; // Unique username
  email: string; // User email
  password: string; // Bcrypt hashed
  role: "user" | "admin" | "owner"; // User role
  createdAt: Date; // Auto-generated
  updatedAt: Date; // Auto-generated
}
```

## Environment Configuration

### Development (.env)

```bash
NODE_ENV=development
PROTOCOL=http
IP=0.0.0.0
PORT=3000

# Local MongoDB with Docker
MONGODB_URI=mongodb://admin:password@localhost:27017/card-app?authSource=admin
JWT_SECRET=your-development-secret-key
JWT_EXPIRES_IN=1d

# Logging
LOG_LEVEL=debug
ENABLE_CONSOLE_LOG=true

# API Configuration
API_PATH=/api
API_REQUIRES_AUTH=true
```

### Production (Railway)

Set these environment variables in Railway dashboard:

**Required Variables:**

- `NODE_ENV=production`
- `MONGODB_URI=${{MongoDB.MONGO_URL}}` (Railway MongoDB service)
- `JWT_SECRET=<generate-secure-64-char-string>`
- `JWT_EXPIRES_IN=1d`
- `LOG_LEVEL=info`
- `API_PATH=/api`
- `API_REQUIRES_AUTH=true`
- `API_PASSWORD_OWNER=superSecretPasswordHere`

**Generate secure JWT secret:**

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## Security Features

### Authentication & Authorization

- **JWT Tokens**: Stateless authentication with configurable expiration
- **Password Hashing**: Bcrypt with salt for secure password storage
- **Role-Based Access**: Three-tier system (user/admin/owner)
- **Protected Routes**: Middleware-based route protection

### API Security

- **CORS Configuration**: Controlled cross-origin access
- **Request Validation**: Input sanitization and validation
- **Error Handling**: Secure error responses without data leakage
- **Environment Separation**: Development/production configuration isolation

### Default Users

The application automatically creates default users:

- **Owner**: `username: owner`, `password: owner123`, `role: owner`
- **Admin**: `username: admin`, `password: admin123`, `role: admin`

> ⚠️ **Security Note**: Change default passwords in production!

## Logging & Monitoring

### Winston Logger Configuration

- **Multiple Levels**: error, warn, info, http, verbose, debug, silly
- **File Outputs**: Separate files for different log levels
- **Console Output**: Colorized development logging
- **JSON Format**: Structured logging for production
- **Log Rotation**: Automatic log file management

### Log Files (Development)

```
logs/
├── app.log           # General application logs
├── error.log         # Error-level logs only
├── auth.log         # Authentication-related logs
└── combined.log     # All logs combined
```

### Runtime Log Level Control

```bash
# Get current log level
GET /api/admin/log-level

# Set log level (admin required)
POST /api/admin/log-level
Content-Type: application/json
{
  "level": "debug"
}
```

## Deployment

### Local Container Deployment

```bash
# Build and run with Docker Compose
docker-compose up -d

# Check container status
docker-compose ps

# View logs
docker-compose logs -f backend
```

### Railway Deployment

1. **Connect Repository**: Link your GitHub repository to Railway

2. **Add MongoDB Service**:

   ```bash
   railway add mongodb
   ```

3. **Configure Backend Service**:

   - Set environment variables from `.env.example`
   - Use `${{MongoDB.MONGO_URL}}` for database connection
   - Deploy using `docker/railway.Dockerfile`

4. **Deploy**:
   ```bash
   railway up
   ```

### Health Check Endpoints

Monitor deployment status:

- `https://your-app.railway.app/` - Basic status
- `https://your-app.railway.app/health` - Detailed health check
- `https://your-app.railway.app/api` - API documentation

## Development Scripts

```bash
npm run dev          # Start development server with nodemon
npm run build        # Compile TypeScript to JavaScript
npm start           # Start production server
npm run lint        # Run ESLint (if configured)
npm test            # Run tests (if configured)
```

## Database Management

### MongoDB Scripts

Located in `mongodb-scripts/`:

- `aggregate-stat-cards.js` - Card statistics aggregation
- `status-update.js` - Bulk status updates

### Aggregation Queries

The application includes sophisticated MongoDB aggregation pipelines for:

- Card statistics by status
- User activity metrics
- Project-based analytics
- Time-based reporting

## Integration with Frontend

This backend integrates with the [Board App Frontend](../board-app) which provides:

- React-based user interface
- Authentication forms
- Card management interface
- Real-time updates
- Responsive design

### API Communication

- **Base URL**: `http://localhost:3000/api` (development)
- **Authentication**: Bearer token in Authorization header
- **Content Type**: `application/json`
- **Error Handling**: Consistent error response format

## Troubleshooting

### Common Issues

1. **MongoDB Connection**:

   ```bash
   # Check MongoDB container
   docker ps | grep mongodb

   # Restart MongoDB
   cd mongodb-docker && docker-compose restart
   ```

2. **Authentication Issues**:

   ```bash
   # Check JWT secret consistency
   echo $JWT_SECRET

   # Verify user creation
   GET /api/debug/whoami
   ```

3. **Port Conflicts**:

   ```bash
   # Check port usage
   netstat -ano | findstr :3000

   # Kill process if needed
   taskkill /PID <process_id> /F
   ```

### Debug Mode

Enable detailed logging:

```bash
LOG_LEVEL=debug npm run dev
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

ISC License - see package.json for details

## Author

**AguDeveloping**  
GitHub: https://github.com/AguDeveloping

---

**Version**: 1.1.0  
**Last Updated**: November 2025
