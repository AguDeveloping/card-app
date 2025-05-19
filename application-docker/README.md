# Card Application Containerization

This directory contains Docker configuration files for running the complete card application stack, including:

- MongoDB database
- Node.js/Express TypeScript backend (card-app)
- React frontend (board-app)

## Project Structure

The project is organized with separate folders for frontend and backend:

- `board-app/` - React frontend application
- `card-app/` - Node.js/Express backend application with MongoDB integration
  - `application-docker/` - Docker configuration files

## Docker Configuration Files

- `docker-compose.yml` - Orchestrates all three services
- `backend.Dockerfile` - Configuration for building the backend container
- `frontend.Dockerfile` - Configuration for building the frontend container

## Running the Application

From the `card-app/application-docker` directory, run:

```bash
docker-compose up -d
```

This will start all three containers:

- MongoDB: Available at `mongodb://localhost:27017` (credentials: admin/password)
- Backend API: Available at `http://localhost:3000`
- Frontend: Available at `http://localhost:3001`

## Improved Features

### Health Checks
All services include health checks to ensure proper startup sequencing:
- MongoDB checks database connectivity
- Backend waits for MongoDB to be healthy before starting
- Frontend waits for Backend to be healthy before starting

### Development Workflow
The Docker setup includes optimized volume mapping:
- The entire project is mounted at `/workspace` in the containers
- Node modules are stored in named volumes to prevent overwriting local modules
- Working directories are set appropriately for each service

### Authentication
The application includes JWT-based authentication with:
- Default admin user (username: 'admin', password: 'admin')
- Protected API endpoints requiring authentication
- Role-based authorization (admin role for certain operations)

## Development Tips

1. **Live Code Changes**: Edit your code locally and see changes immediately in the containers
2. **Container Logs**: View logs with `docker-compose logs -f [service_name]`
3. **Database Access**: Connect to MongoDB using a tool like MongoDB Compass with the credentials provided
4. **Debugging**: The backend runs in development mode with ts-node-dev for auto-reloading
