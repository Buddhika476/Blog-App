# BlogApp Frontend

A modern blog platform frontend built with Next.js 15, TypeScript, Tailwind CSS, and shadcn/ui components.

## Features

- **Modern UI**: Built with shadcn/ui components and Tailwind CSS
- **Server-Side Rendering**: Full SSR support with Next.js App Router
- **Authentication**: JWT-based authentication with secure HTTP-only cookies
- **Blog Management**: Create, edit, delete, and manage blog posts
- **Draft System**: Save posts as drafts and publish when ready
- **Responsive Design**: Mobile-first responsive design
- **Server Actions**: Form handling with Next.js server actions
- **Type Safety**: Full TypeScript support

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui
- **Icons**: Lucide React
- **HTTP Client**: Axios
- **Form Handling**: React Hook Form with Zod validation
- **State Management**: Server-side state with React Server Components

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── blog/              # Blog listing and detail pages
│   ├── dashboard/         # User dashboard and management
│   ├── login/            # Authentication pages
│   ├── register/
│   ├── create/           # Blog post creation
│   ├── globals.css       # Global styles
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Home page
├── components/
│   ├── ui/               # shadcn/ui components
│   └── navigation.tsx    # Main navigation
└── lib/
    ├── api.ts           # API service layer
    ├── auth.ts          # Authentication utilities
    ├── types.ts         # TypeScript type definitions
    └── utils.ts         # Utility functions
```

## Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## Getting Started

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start the development server**:
   ```bash
   npm run dev
   ```

3. **Build for production**:
   ```bash
   npm run build
   npm start
   ```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Pages and Features

### Public Pages
- **Home** (`/`): Landing page with latest blog posts
- **Blog Listing** (`/blog`): Paginated list of all published posts
- **Blog Detail** (`/blog/[id]`): Individual blog post with comments
- **Login** (`/login`): User authentication
- **Register** (`/register`): User registration

### Protected Pages (Require Authentication)
- **Dashboard** (`/dashboard`): User dashboard with statistics
- **Create Post** (`/create`): Blog post creation and editing
- **Manage Posts** (`/dashboard/posts`): List and manage user's posts

## API Integration

The frontend integrates with the NestJS backend through a comprehensive API service layer supporting:

- **Authentication**: Login/register with JWT tokens
- **Blog Posts**: CRUD operations for blog posts
- **Comments**: Nested comments with replies
- **Likes**: Like/unlike posts and comments
- **File Uploads**: Image and document uploads
- **User Management**: User profile management

## Development Commands

```bash
# Development server
npm run dev

# Production build
npm run build

# Start production server
npm start

# Lint code
npm run lint
```
