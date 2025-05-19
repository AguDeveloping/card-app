# Card App Backend

A Node.js backend application built with TypeScript for managing cards/tasks.

## Features

- RESTful API for card management (create, read, update, delete)
- TypeScript for type safety
- MongoDB for data storage
- Express.js framework

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (running locally or accessible via connection string)

## Project Structure

```
card-app/
├── src/
│   ├── config/        # Configuration files
│   ├── controllers/   # Request handlers
│   ├── middleware/    # Express middleware
│   ├── models/        # Mongoose models
│   ├── routes/        # API routes
│   └── server.ts      # Express app initialization
├── .env               # Environment variables
├── package.json       # Project dependencies
└── tsconfig.json     # TypeScript configuration
```

## Getting Started

1. Install dependencies:

```bash
npm install
```

2. Make sure MongoDB is running. You can update the connection string in the `.env` file if needed.

3. Start the development server:

```bash
npm run dev
```

4. For production, build and start:

```bash
npm run build
npm start
```

## API Endpoints

- `GET /api/cards` - Get all cards
- `GET /api/cards/:id` - Get a specific card
- `POST /api/cards` - Create a new card
- `PUT /api/cards/:id` - Update a card
- `DELETE /api/cards/:id` - Delete a card

## Card Model

```typescript
{
  title: string;        // Card title
  description: string;  // Card description
  status: string;       // 'todo', 'in-progress', or 'done'
  dueDate?: Date;       // Optional due date
  createdAt: Date;      // Automatically generated
  updatedAt: Date;      // Automatically generated
}
```
