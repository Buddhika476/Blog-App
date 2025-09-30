export interface User {
  _id: string
  email: string
  firstName: string
  lastName: string
  createdAt: string
  updatedAt: string
}

export interface BlogPost {
  _id: string
  title: string
  content: string
  excerpt: string
  author: User
  tags: string[]
  status: 'draft' | 'published' | 'archived'
  featuredImage?: string
  attachments?: string[]
  views: number
  likesCount: number
  commentsCount: number
  scheduledPublishAt?: string
  publishedAt?: string
  createdAt: string
  updatedAt: string
}

export interface Comment {
  _id: string
  content: string
  author: User
  blogPost: string
  parentComment?: string
  replies?: Comment[]
  likesCount: number
  createdAt: string
  updatedAt: string
}

export interface Like {
  _id: string
  targetType: 'BlogPost' | 'Comment'
  targetId: string
  user: string
  createdAt: string
}

export interface CreateBlogPostData {
  title: string
  content: string
  excerpt: string
  tags?: string[]
  status?: 'draft' | 'published' | 'archived'
  scheduledPublishAt?: Date
}

export interface RegisterData {
  email: string
  password: string
  firstName: string
  lastName: string
}

export interface LoginData {
  email: string
  password: string
}

export interface AuthResponse {
  access_token: string
  user: User
}

export interface ApiResponse<T> {
  data: T
  message?: string
}

export interface PaginatedResponse<T> {
  posts: T[]
  total: number
}

export interface DraftsResponse {
  drafts: BlogPost[]
  total: number
}

export interface CommentsResponse {
  comments: Comment[]
  total: number
}