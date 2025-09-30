# Blog Application

A full-stack blog application built with NestJS (backend) and Next.js (frontend).

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- MongoDB (local installation or Docker)

## Project Structure

```
blog-app - Main
backend/ - (Subfolder) - NestJS API server
frontend/ - (Subfolder) - Next.js web application
README.md 
```

## Backend Setup
## Configuration added If using docker or mongoDB
### Using Docker

1. Navigate to the backend directory:
```bash
cd backend
```

2. Start MongoDB with Docker Compose:
```bash
docker-compose up -d
```

This will start: Mogo DB and Express 

3. Copy the Docker environment file:
```bash
cp .env.docker .env
```

4. Install dependencies:
```bash
npm install
```

5. Run the development server:
```bash
npm run dev
```

The backend API will be available at `http://localhost:3001`

### Using Local MongoDB

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file with your local MongoDB connection:
```env
DATABASE_URL=mongodb://localhost:27017/blog-app
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d
PORT=3001
```

4. Ensure MongoDB is running locally on port 27017

5. Run the development server:
```bash
npm run dev
```

### Backend Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run start:prod` - Start production server
- `npm test` - Run tests
- `npm run lint` - Run ESLint

## Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file (if needed for API URL):
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

4. Run the development server:
```bash
npm run dev
```

The frontend will be available at `http://localhost:3000`

### Frontend Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Quick Start (Both Services)

### Terminal 1 - Backend:
```bash
cd backend
docker-compose up -d
cp .env.docker .env
npm install
npm run dev
```

### Terminal 2 - Frontend:
```bash
cd frontend
npm install
npm run dev
```

Visit `http://localhost:3000` to access the application.

## Database Management

When using Docker, you can access Mongo Express at `http://localhost:8081` to view and manage your database.

Default credentials:
- Database User: `bloguser`
- Database Password: `blogpassword`
- Database Name: `blog-app`

## Stopping Services

### Stop Docker containers:
```bash
cd backend
docker-compose down
```

### Stop development servers:
Press `Ctrl + C` in each terminal running the dev servers.

## Production Build

### Backend:
```bash
cd backend
npm run build
npm run start:prod
```

### Frontend:
```bash
cd frontend
npm run build
npm start
```

## Troubleshooting

### Backend won't connect to MongoDB
- Ensure MongoDB is running (check `docker ps` if using Docker)
- Verify `.env` file has correct `DATABASE_URL`
- Check MongoDB is accessible on port 27017

### Frontend can't reach backend
- Ensure backend is running on port 3001
- Check API URL configuration
- Verify CORS settings in backend

### Port already in use
- Backend: Change `PORT` in `.env`
- Frontend: Run with `npm run dev -- -p 3001` (or any other port)
- MongoDB: Change port mapping in `docker-compose.yml`

## Technologies Used

### Backend
- NestJS - Node.js framework
- MongoDB - Database
- Mongoose - ODM
- JWT - Authentication
- Winston - Logging
- Passport - Auth strategies

### Frontend
- Next.js 15 - React framework
- TypeScript - Type safety
- Tailwind CSS - Styling
- Radix UI - UI components
- React Hook Form - Form handling
- Axios - HTTP client
- Zod - Schema validation