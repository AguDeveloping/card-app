# MongoDB Docker Project

This project sets up a MongoDB container using Docker Compose.

## Container Details

- **Container Name**: mongodb-1
- **Port**: 27017 (exposed to host)
- **Default Username**: admin
- **Default Password**: password

## Prerequisites

- Docker and Docker Compose installed on your system

## Usage

### Starting the MongoDB Container

Run the PowerShell script to start the MongoDB container:

```powershell
.\start-mongodb.ps1
```

Alternatively, you can start it manually with Docker Compose:

```powershell
docker-compose up -d
```

### Connecting to MongoDB

Connection string: `mongodb://admin:password@localhost:27017`

### Stopping the Container

```powershell
docker-compose down
```

## Volume Information

The container uses a named volume `mongodb_data` to persist the database data between container restarts.
