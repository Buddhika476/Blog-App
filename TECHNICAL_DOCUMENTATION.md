# Blog Application - Technical Documentation

## Table of Contents
- [Overview](#overview)
- [System Architecture](#system-architecture)
- [Backend Documentation](#backend-documentation)
- [Frontend Documentation](#frontend-documentation)
- [Database Schema](#database-schema)
- [API Documentation](#api-documentation)
- [Authentication & Authorization](#authentication--authorization)
- [File Upload System](#file-upload-system)
- [Deployment](#deployment)

---

## Overview

A full-stack blog application built with modern web technologies, featuring user authentication, blog post management, comments, likes, and file uploads.

### Tech Stack Summary

**Backend:**
- Framework: NestJS 10
- Language: TypeScript 5
- Database: MongoDB with Mongoose
- Authentication: JWT (Passport)
- Validation: class-validator, class-transformer
- Logging: Winston with daily rotate
- Password Hashing: bcryptjs

**Frontend:**
- Framework: Next.js 15 (App Router)
- Language: TypeScript 5
- Styling: Tailwind CSS v4
- UI Components: shadcn/ui with Radix UI
- HTTP Client: Axios
- Form Handling: React Hook Form + Zod
- State Management: Server Components

---

## System Architecture

### High-Level Architecture

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│   Frontend  │ ◄────► │   Backend   │ ◄────► │   MongoDB   │
│  (Next.js)  │  HTTP   │  (NestJS)   │         │  Database   │
│  Port 3000  │         │  Port 3001  │         │  Port 27017 │
└─────────────┘         └─────────────┘         └─────────────┘
                               │
                               ▼
                        ┌─────────────┐
                        │   Uploads   │
                        │  Directory  │
                        └─────────────┘
```

### Communication Flow

1. **Client Request** → Frontend (Next.js)
2. **API Call** → Backend API (NestJS) via Axios
3. **Authentication** → JWT Token validation
4. **Business Logic** → Service layer processing
5. **Data Access** → MongoDB via Mongoose
6. **Response** → JSON data back to client

---

## Backend Documentation

### Directory Structure

```
backend/src/
├── auth/                      # Authentication module
│   ├── guards/               # JWT & Local auth guards
│   ├── strategies/           # Passport strategies
│   ├── dto/                  # Login & Register DTOs
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   └── auth.module.ts
├── users/                    # User management
│   ├── dto/                  # User DTOs
│   ├── user.schema.ts        # Mongoose User schema
│   ├── users.controller.ts
│   ├── users.service.ts
│   └── users.module.ts
├── blog-posts/               # Blog post management
│   ├── dto/                  # Blog post DTOs
│   ├── blog-post.schema.ts
│   ├── blog-posts.controller.ts
│   ├── blog-posts.service.ts
│   └── blog-posts.module.ts
├── comments/                 # Comments system
│   ├── dto/
│   ├── comment.schema.ts
│   ├── comments.controller.ts
│   ├── comments.service.ts
│   └── comments.module.ts
├── likes/                    # Like functionality
│   ├── dto/
│   ├── like.schema.ts
│   ├── likes.controller.ts
│   ├── likes.service.ts
│   └── likes.module.ts
├── uploads/                  # File upload handling
│   ├── uploads.controller.ts
│   ├── uploads.service.ts
│   └── uploads.module.ts
├── common/                   # Shared utilities
│   ├── filters/             # Exception filters
│   ├── interceptors/        # Logging interceptors
│   └── logger/              # Winston logger config
├── config/                   # Configuration files
│   └── multer.config.ts     # File upload config
├── types/                    # Type definitions
│   └── multer.types.ts
├── app.module.ts            # Root module
└── main.ts                  # Application entry point
```

### Key Modules

#### 1. Authentication Module
- **Strategy:** JWT-based authentication with Passport
- **Token Storage:** HTTP-only cookies
- **Guards:** JWT guard for protected routes, Local guard for login
- **Features:**
  - User registration with password hashing (bcrypt)
  - Login with email/password
  - Token refresh mechanism
  - Password validation (min 6 characters)

#### 2. Blog Posts Module
- **Features:**
  - CRUD operations for blog posts
  - Draft system with auto-save
  - Publish/unpublish functionality
  - Tags support
  - Featured images
  - Attachments (multiple files)
  - View count tracking
  - Status management (draft, published, archived)
  - Scheduled publishing

#### 3. Comments Module
- **Features:**
  - Nested comments (replies)
  - Comment on blog posts
  - Edit/delete own comments
  - Comment count tracking

#### 4. Likes Module
- **Features:**
  - Like/unlike blog posts
  - Like/unlike comments
  - Like status checking
  - Like count tracking

#### 5. Uploads Module
- **Features:**
  - Image uploads (JPEG, PNG, GIF, WebP)
  - Document uploads (PDF, DOC, DOCX, TXT)
  - File size validation (max 5MB)
  - Multer integration
  - Static file serving

### Middleware & Interceptors

1. **ValidationPipe**: Global input validation with whitelist and transformation
2. **AllExceptionsFilter**: Centralized exception handling
3. **LoggingInterceptor**: Request/response logging
4. **CORS**: Configured for frontend origin (localhost:3000)

### Logging System

- **Library:** Winston with nest-winston
- **Features:**
  - Daily rotating log files
  - Console and file transports
  - Timestamped logs
  - Separate error logs
  - Request/response logging
- **Location:** `logs/` directory

### Environment Configuration

Required environment variables:
```env
DATABASE_URL=mongodb://localhost:27017/blog-app
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
MAX_FILE_SIZE=5242880
UPLOAD_DEST=./uploads
```

### API Endpoints

#### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user
- `POST /auth/logout` - Logout user
- `GET /auth/profile` - Get current user profile

#### Users
- `GET /users` - List all users (admin)
- `GET /users/:id` - Get user by ID
- `PATCH /users/:id` - Update user
- `DELETE /users/:id` - Delete user

#### Blog Posts
- `GET /blog-posts` - List all published posts (paginated)
- `GET /blog-posts/drafts` - List user's drafts
- `GET /blog-posts/:id` - Get post by ID
- `POST /blog-posts` - Create new post
- `PATCH /blog-posts/:id` - Update post
- `DELETE /blog-posts/:id` - Delete post
- `POST /blog-posts/:id/publish` - Publish draft
- `POST /blog-posts/:id/featured-image` - Upload featured image
- `POST /blog-posts/:id/attachment` - Add attachment

#### Comments
- `GET /comments?postId=:id` - Get comments for a post
- `POST /comments` - Create comment
- `PATCH /comments/:id` - Update comment
- `DELETE /comments/:id` - Delete comment

#### Likes
- `POST /likes/toggle` - Toggle like status
- `GET /likes/status?targetId=:id&type=:type` - Check like status

#### Uploads
- `POST /uploads/image` - Upload image
- `POST /uploads/document` - Upload document
- `GET /uploads/:filename` - Access uploaded file

---

## Frontend Documentation

### Directory Structure

```
frontend/src/
├── app/                      # Next.js App Router
│   ├── api/                 # API route handlers
│   │   ├── blog-posts/     # Blog post routes
│   │   ├── comments/       # Comment routes
│   │   ├── likes/          # Like routes
│   │   └── uploads/        # Upload routes
│   ├── blog/               # Blog pages
│   │   ├── [id]/          # Dynamic blog post page
│   │   └── page.tsx       # Blog listing page
│   ├── dashboard/          # User dashboard
│   │   ├── drafts/        # Draft management
│   │   └── posts/         # Published posts management
│   ├── create/            # Create post page
│   ├── edit/              # Edit post page
│   │   └── [id]/
│   ├── login/             # Login page
│   ├── register/          # Registration page
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page
│   └── globals.css        # Global styles
├── components/
│   ├── ui/                # shadcn/ui components
│   │   ├── badge.tsx
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   ├── label.tsx
│   │   └── loading.tsx
│   ├── comments-section.tsx
│   ├── create-post-form.tsx
│   ├── dashboard-post-card.tsx
│   ├── document-upload.tsx
│   ├── edit-post-form.tsx
│   ├── image-upload.tsx
│   ├── like-button.tsx
│   └── navigation.tsx
├── hooks/
│   └── use-like.ts        # Custom like hook
└── lib/
    ├── api.ts             # API service layer
    ├── auth.ts            # Authentication utilities
    ├── types.ts           # TypeScript types
    └── utils.ts           # Utility functions
```

### Key Features

#### 1. Server-Side Rendering
- Full SSR with Next.js 15 App Router
- Server Components for optimal performance
- Automatic code splitting

#### 2. API Route Handlers
- Proxy routes to backend API
- Cookie forwarding for authentication
- Error handling and type safety

#### 3. Form Handling
- React Hook Form for form state
- Zod for schema validation
- Real-time validation feedback

#### 4. Component Architecture
- Reusable UI components (shadcn/ui)
- Composition pattern
- TypeScript interfaces for props

#### 5. Authentication Flow
- JWT tokens stored in HTTP-only cookies
- Cookie-based auth forwarding
- Protected routes with middleware
- Automatic redirect on auth failure

### Pages & Routes

#### Public Routes
- `/` - Home page with latest posts
- `/blog` - All published posts
- `/blog/[id]` - Individual post with comments
- `/login` - User login
- `/register` - User registration

#### Protected Routes
- `/dashboard` - User dashboard
- `/dashboard/posts` - Manage published posts
- `/dashboard/drafts` - Manage drafts
- `/create` - Create new post
- `/edit/[id]` - Edit existing post

### State Management

- Server Components for data fetching
- React hooks for client-side state
- Form state via React Hook Form
- Cookie-based auth state

### Styling

- Tailwind CSS v4 with PostCSS
- CSS variables for theming
- Responsive design (mobile-first)
- Dark mode support via next-themes

---

## Database Schema

### User Collection

```typescript
{
  _id: ObjectId,
  email: string (unique, required),
  password: string (hashed, required),
  firstName: string (required),
  lastName: string (required),
  role: string (default: 'user'),
  isActive: boolean (default: true),
  createdAt: Date,
  updatedAt: Date
}
```

### BlogPost Collection

```typescript
{
  _id: ObjectId,
  title: string (required),
  content: string (required),
  excerpt: string (required),
  author: ObjectId (ref: User, required),
  tags: string[] (default: []),
  status: enum ['draft', 'published', 'archived'] (default: 'draft'),
  views: number (default: 0),
  likesCount: number (default: 0),
  commentsCount: number (default: 0),
  publishedAt: Date,
  lastSavedAt: Date (default: Date.now),
  isDraft: boolean (default: false),
  scheduledPublishAt: Date,
  attachments: string[] (default: []),
  featuredImage: string,
  createdAt: Date,
  updatedAt: Date
}
```

### Comment Collection

```typescript
{
  _id: ObjectId,
  content: string (required),
  author: ObjectId (ref: User, required),
  post: ObjectId (ref: BlogPost, required),
  parentComment: ObjectId (ref: Comment, optional),
  replies: Comment[] (nested),
  likesCount: number (default: 0),
  createdAt: Date,
  updatedAt: Date
}
```

### Like Collection

```typescript
{
  _id: ObjectId,
  user: ObjectId (ref: User, required),
  targetId: ObjectId (required),
  targetType: enum ['post', 'comment'] (required),
  createdAt: Date,
  updatedAt: Date
}
```

### Indexes

- User: `email` (unique)
- BlogPost: `author`, `status`, `publishedAt`
- Comment: `post`, `author`, `parentComment`
- Like: Compound index on `(user, targetId, targetType)` (unique)

---

## API Documentation

### Response Format

**Success Response:**
```json
{
  "data": { ... },
  "message": "Success message"
}
```

**Error Response:**
```json
{
  "statusCode": 400,
  "message": "Error message",
  "error": "Bad Request"
}
```

### Authentication

All authenticated requests require JWT token in HTTP-only cookie:
```
Cookie: token=<jwt_token>
```

### Pagination

List endpoints support pagination:
```
GET /blog-posts?page=1&limit=10
```

**Response:**
```json
{
  "data": [...],
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 10,
    "totalPages": 10
  }
}
```

### File Upload

**Supported Formats:**
- Images: JPEG, PNG, GIF, WebP
- Documents: PDF, DOC, DOCX, TXT

**Size Limits:**
- Max file size: 5MB

**Request:**
```
POST /uploads/image
Content-Type: multipart/form-data

file: <binary>
```

**Response:**
```json
{
  "url": "/uploads/image-1234567890.jpg",
  "filename": "image-1234567890.jpg"
}
```

---

## Authentication & Authorization

### JWT Token Structure

```json
{
  "sub": "user_id",
  "email": "user@example.com",
  "iat": 1234567890,
  "exp": 1235000000
}
```

### Security Features

1. **Password Hashing:** bcrypt with 12 rounds
2. **Token Expiration:** 7 days (configurable)
3. **HTTP-Only Cookies:** XSS protection
4. **CORS Configuration:** Origin whitelist
5. **Input Validation:** class-validator decorators
6. **Whitelist Validation:** Strips unknown properties
7. **Transform:** Type coercion for inputs

### Authorization Guards

- **JwtAuthGuard:** Protects routes requiring authentication
- **LocalAuthGuard:** Handles login authentication
- **Optional Auth:** Routes that work with/without auth

### Role-Based Access Control

Current implementation has basic user roles:
- `user`: Standard user (default)
- `admin`: Administrative privileges (future)

---

## File Upload System

### Configuration

**Location:** `backend/src/config/multer.config.ts`

**Storage:**
- Local filesystem
- Directory: `backend/uploads/`
- Filename: `<type>-<timestamp>-<random>.<ext>`

**Validation:**
- File type checking (MIME type)
- File size limit (5MB)
- Sanitized filenames

### Upload Flow

1. Client uploads file via multipart/form-data
2. Multer middleware intercepts request
3. File validation (type, size)
4. File saved to disk with unique name
5. File URL returned to client
6. URL stored in database (BlogPost schema)

### Static File Serving

Files served at: `http://localhost:3001/uploads/<filename>`

---

## Deployment

### Prerequisites

- Node.js 18+
- MongoDB 5+
- npm or yarn

### Backend Deployment

1. **Install dependencies:**
   ```bash
   cd backend
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with production values
   ```

3. **Build application:**
   ```bash
   npm run build
   ```

4. **Start production server:**
   ```bash
   npm run start:prod
   ```

### Frontend Deployment

1. **Install dependencies:**
   ```bash
   cd frontend
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.local.example .env.local
   # Edit with production API URL
   ```

3. **Build application:**
   ```bash
   npm run build
   ```

4. **Start production server:**
   ```bash
   npm start
   ```

### Docker Deployment

Backend includes Docker configuration:

```bash
cd backend
docker-compose up -d
```

See `backend/README-DOCKER.md` for details.

### Production Checklist

- [ ] Set strong JWT_SECRET
- [ ] Configure production DATABASE_URL
- [ ] Set NODE_ENV=production
- [ ] Configure proper CORS_ORIGIN
- [ ] Set up SSL/TLS certificates
- [ ] Configure reverse proxy (nginx)
- [ ] Set up log rotation
- [ ] Configure backup strategy
- [ ] Set up monitoring
- [ ] Configure rate limiting
- [ ] Review security headers

---

## Development

### Running Locally

**Backend:**
```bash
cd backend
npm install
npm run dev
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

**MongoDB:**
```bash
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

### Testing

**Backend:**
```bash
npm run test          # Unit tests
npm run test:e2e      # E2E tests
npm run test:cov      # Coverage report
```

### Code Quality

**Linting:**
```bash
npm run lint
```

**Formatting:**
```bash
npm run format
```

---

## Troubleshooting

### Common Issues

1. **CORS Errors:**
   - Check CORS_ORIGIN in backend .env
   - Ensure frontend URL matches

2. **Authentication Failures:**
   - Verify JWT_SECRET is set
   - Check token expiration
   - Clear browser cookies

3. **File Upload Errors:**
   - Check file size (max 5MB)
   - Verify MIME type
   - Ensure uploads directory exists

4. **Database Connection:**
   - Verify MongoDB is running
   - Check DATABASE_URL format
   - Test connection string

---

## Future Enhancements

- [ ] Rich text editor for blog content
- [ ] Image optimization and resizing
- [ ] Social media sharing
- [ ] SEO optimization
- [ ] Email notifications
- [ ] User profiles with avatars
- [ ] Search functionality
- [ ] Categories/taxonomy
- [ ] Admin dashboard
- [ ] Analytics integration
- [ ] Rate limiting
- [ ] Redis caching
- [ ] WebSocket for real-time updates
- [ ] PWA support

---

## License

Private project - All rights reserved

---

## Contact & Support

For technical questions or issues, please refer to the project README files:
- Backend: `backend/README.md`
- Frontend: `frontend/README.md`
- Docker: `backend/README-DOCKER.md`