FROM node:18-alpine

# Install necessary tools
RUN apk add --no-cache wget

WORKDIR /workspace/card-app

# Copy package.json and package-lock.json
COPY card-app/package*.json ./

# Install dependencies
RUN npm install

# Expose the port the app runs on
EXPOSE 3000

# Command to run the application in development mode
CMD ["npm", "run", "dev"]
