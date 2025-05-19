# Card App Development History

## Project Overview
A Node.js backend application built with TypeScript for managing cards/tasks, featuring JWT authentication and MongoDB integration.

## Development Timeline

### Initial Setup (May 9, 2025)

1. **Project Initialization**
   - Created basic folder structure for a Node.js TypeScript application
   - Set up package.json with necessary dependencies
   - Created tsconfig.json for TypeScript configuration
   - Set up MongoDB connection using Docker container

2. **Core Features Implementation**
   - Created Card model with Mongoose
   - Implemented CRUD operations for cards
   - Set up Express routes for the API
   - Added basic error handling

3. **Authentication System**
   - Added User model with password hashing using bcrypt
   - Implemented JWT-based authentication
   - Created login and registration endpoints
   - Set up protected routes requiring authentication
   - Added role-based authorization (admin role for certain operations)
   - Created default admin user (username: 'admin', password: 'admin123')

4. **Authentication Debugging and Fixes**
   - Fixed JWT token verification issues
   - Implemented consistent JWT secret handling
   - Added detailed logging for authentication attempts
   - Improved error messages for authentication failures

## Key Technical Decisions

### Database
- **MongoDB**: Used for data storage with Mongoose ODM
- **Connection**: Using Docker container with authentication

### Authentication
- **JWT Tokens**: Used for stateless authentication
- **Password Security**: Implemented bcrypt hashing with salt
- **Role-Based Access**: Admin role with special privileges

### API Design
- RESTful API endpoints for card management
- Protected routes requiring authentication
- Proper error handling and status codes

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login and get JWT token
- `GET /api/auth/profile` - Get user profile (requires authentication)

### Cards
- `GET /api/cards` - Get all cards (requires authentication)
- `GET /api/cards/:id` - Get a specific card (requires authentication)
- `POST /api/cards` - Create a new card (requires authentication)
- `PUT /api/cards/:id` - Update a card (requires authentication)
- `DELETE /api/cards/:id` - Delete a card (requires admin role)

## Authentication Usage

1. **Login to get token**:
   ```
   POST http://localhost:3000/api/auth/login
   Body: {
     "username": "admin",
     "password": "admin123"
   }
   ```

2. **Use token in Authorization header**:
   ```
   Authorization: Bearer your-jwt-token
   ```

## Troubleshooting Notes

### JWT Authentication Issues
- Ensure consistent JWT secret across token generation and verification
- Format Authorization header exactly as: `Bearer token` (with one space)
- Check for token expiration (default: 1 day)
- When server restarts, old tokens may become invalid if JWT_SECRET changes

### MongoDB Connection
- Ensure MongoDB container is running
- Use correct authentication database with `authSource=admin` parameter
- Default credentials: admin/password

## Future Improvements

- Add refresh token functionality
- Implement password reset feature
- Add email verification for new users
- Improve validation and error handling
- Add unit and integration tests
- Implement rate limiting for API endpoints
