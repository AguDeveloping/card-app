FROM node:18-alpine

WORKDIR /workspace/board-app

# Copy package.json and package-lock.json
COPY board-app/package*.json ./

# Install dependencies
RUN npm install

# Expose the port the app runs on
EXPOSE 3001

# Command to run the application
CMD ["npm", "start"]
