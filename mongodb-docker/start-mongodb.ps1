# MongoDB Docker Container Management Script

# Navigate to the directory containing the docker-compose.yml file
Set-Location -Path $PSScriptRoot

# Start the MongoDB container using docker-compose
Write-Host "Starting MongoDB container (mongodb-1)..."
docker-compose up -d

Write-Host ""
Write-Host "MongoDB container started successfully!"
Write-Host "Container name: mongodb-1"
Write-Host "Port: 27017"
Write-Host "Username: admin"
Write-Host "Password: password"
Write-Host ""
Write-Host "Connection string: mongodb://admin:password@localhost:27017"
