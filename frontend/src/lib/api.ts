import axios from 'axios'
import {
  AuthResponse,
  BlogPost,
  Comment,
  LoginData,
  RegisterData,
  CreateBlogPostData,
  PaginatedResponse,
  DraftsResponse,
  CommentsResponse,
  User,
  Like
} from './types'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

// Add response interceptor for error handling
const addErrorInterceptor = (apiInstance: any) => {
  apiInstance.interceptors.response.use(
    (response: any) => response,
    (error: any) => {
      if (error.response?.status === 401) {
        // Clear authentication and redirect to login
        if (typeof window !== 'undefined') {
          // Client-side: redirect using window
          document.cookie = 'access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
          document.cookie = 'user=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
          window.location.href = '/login'
        }
      }
      return Promise.reject(error)
    }
  )
}

// Create base API instance without auth interceptors
const createApiInstance = () => {
  const instance = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Content-Type': 'application/json',
    },
    withCredentials: true, // This will send cookies with requests
  })

  // Add error handling for client-side instances
  if (typeof window !== 'undefined') {
    addErrorInterceptor(instance)
  }

  return instance
}

// Server-side API instance
export const createServerApi = async () => {
  const api = createApiInstance()

  // Add cookie headers for server-side requests
  api.interceptors.request.use(async (config) => {
    if (typeof window === 'undefined') {
      // Server-side: get token from cookies and add to headers
      const { cookies } = await import('next/headers')
      const cookieStore = await cookies()
      const token = cookieStore.get('access_token')?.value
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }

      // Forward all cookies to backend
      const cookieHeader = cookieStore.toString()
      if (cookieHeader) {
        config.headers.Cookie = cookieHeader
      }
    }
    return config
  })

  return api
}

// Client-side API instance (for client components)
const clientApi = createApiInstance()

export const authApi = {
  async login(data: LoginData): Promise<AuthResponse> {
    const api = createApiInstance()
    const response = await api.post('/auth/login', data)
    return response.data
  },

  async register(data: RegisterData): Promise<AuthResponse> {
    const api = createApiInstance()
    const response = await api.post('/auth/register', data)
    return response.data
  },
}

export const blogPostsApi = {
  async getAll(page = 1, limit = 10, status?: string): Promise<PaginatedResponse<BlogPost>> {
    const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() })
    if (status) params.append('status', status)
    const api = createApiInstance()
    const response = await api.get(`/blog-posts?${params}`)
    return response.data
  },

  async getById(id: string): Promise<BlogPost> {
    const api = createApiInstance()
    const response = await api.get(`/blog-posts/${id}`)
    return response.data
  },

  async getByIdWithEngagement(id: string): Promise<BlogPost> {
    const api = createApiInstance()
    const response = await api.get(`/blog-posts/${id}/with-engagement`)
    return response.data
  },

  async getMyPosts(page = 1, limit = 10): Promise<PaginatedResponse<BlogPost>> {
    const api = await createServerApi()
    const response = await api.get(`/blog-posts/my-posts?page=${page}&limit=${limit}`)
    return response.data
  },

  async getDrafts(page = 1, limit = 10): Promise<DraftsResponse> {
    const api = await createServerApi()
    const response = await api.get(`/blog-posts/drafts?page=${page}&limit=${limit}`)
    return response.data
  },

  async create(data: CreateBlogPostData): Promise<BlogPost> {
    const api = await createServerApi()
    const response = await api.post('/blog-posts', data)
    return response.data
  },

  async createDraft(data: Partial<CreateBlogPostData>): Promise<BlogPost> {
    const api = await createServerApi()
    const response = await api.post('/blog-posts/drafts', data)
    return response.data
  },

  async update(id: string, data: Partial<CreateBlogPostData>): Promise<BlogPost> {
    const api = await createServerApi()
    const response = await api.patch(`/blog-posts/${id}`, data)
    return response.data
  },

  async publishDraft(id: string, data: { scheduledPublishAt?: Date }): Promise<BlogPost> {
    const api = await createServerApi()
    const response = await api.post(`/blog-posts/drafts/${id}/publish`, data)
    return response.data
  },

  async delete(id: string): Promise<void> {
    const api = await createServerApi()
    await api.delete(`/blog-posts/${id}`)
  },

  async uploadFeaturedImage(id: string, file: File): Promise<{ url: string }> {
    const formData = new FormData()
    formData.append('file', file)
    const api = await createServerApi()
    const response = await api.post(`/blog-posts/${id}/featured-image`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return response.data
  },

  async addAttachment(id: string, file: File): Promise<BlogPost> {
    const formData = new FormData()
    formData.append('file', file)
    const api = await createServerApi()
    const response = await api.post(`/blog-posts/${id}/attachment`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return response.data
  },
}

// Client-side blog posts API (for use in client components)
export const clientBlogPostsApi = {
  async create(data: CreateBlogPostData): Promise<BlogPost> {
    const response = await fetch('/api/blog-posts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to create blog post')
    }

    return response.json()
  },

  async createDraft(data: Partial<CreateBlogPostData>): Promise<BlogPost> {
    const response = await fetch('/api/blog-posts/drafts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to create draft')
    }

    return response.json()
  },

  async uploadFeaturedImage(id: string, file: File): Promise<{ url: string }> {
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch(`/api/blog-posts/${id}/featured-image`, {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to upload featured image')
    }

    return response.json()
  },

  async uploadAttachment(id: string, file: File): Promise<BlogPost> {
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch(`/api/blog-posts/${id}/attachment`, {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to upload attachment')
    }

    return response.json()
  },
}

export const commentsApi = {
  async getByBlogPost(blogPostId: string, page = 1, limit = 10): Promise<CommentsResponse> {
    const api = createApiInstance()
    const response = await api.get(`/comments/blog-post/${blogPostId}?page=${page}&limit=${limit}`)
    return response.data
  },

  async create(data: { content: string; blogPost: string; parentComment?: string }): Promise<Comment> {
    const api = await createServerApi()
    const response = await api.post('/comments', data)
    return response.data
  },

  async update(id: string, data: { content: string }): Promise<Comment> {
    const api = await createServerApi()
    const response = await api.patch(`/comments/${id}`, data)
    return response.data
  },

  async delete(id: string): Promise<void> {
    const api = await createServerApi()
    await api.delete(`/comments/${id}`)
  },

  async getReplies(id: string): Promise<Comment[]> {
    const api = createApiInstance()
    const response = await api.get(`/comments/${id}/replies`)
    return response.data
  },
}

export const likesApi = {
  async toggle(targetType: 'BlogPost' | 'Comment', targetId: string): Promise<{ liked: boolean; count: number; message?: string }> {
    const api = await createServerApi()
    const type = targetType === 'BlogPost' ? 'post' : 'comment'
    const payload = {
      targetType: type,
      ...(targetType === 'BlogPost' ? { blogPost: targetId } : { comment: targetId })
    }
    console.log(`[likesApi.toggle] Calling backend ${type} like:`, targetId, 'payload:', JSON.stringify(payload))
    try {
      const response = await api.post('/likes/toggle', payload)
      console.log('[likesApi.toggle] Backend response:', JSON.stringify(response.data))
      return response.data
    } catch (error: any) {
      console.error('[likesApi.toggle] Backend error:', error.response?.data || error.message)
      throw error
    }
  },

  async getStatus(targetType: 'BlogPost' | 'Comment', targetId: string): Promise<{ liked: boolean }> {
    const api = await createServerApi()
    const backendTargetType = targetType === 'BlogPost' ? 'post' : 'comment'
    console.log(`[likesApi.getStatus] Fetching ${backendTargetType} like status:`, targetId)
    try {
      const response = await api.get(`/likes/status?targetType=${backendTargetType}&targetId=${targetId}`)
      console.log('[likesApi.getStatus] Response:', JSON.stringify(response.data))
      return response.data
    } catch (error: any) {
      console.error('[likesApi.getStatus] Error:', error.response?.data || error.message)
      return { liked: false }
    }
  },

  async getPostLikes(postId: string): Promise<{ count: number; likes: Like[] }> {
    const api = await createServerApi()
    const response = await api.get(`/likes/post/${postId}`)
    return response.data
  },
}

export const uploadsApi = {
  async uploadImage(file: File): Promise<{ url: string; filename: string }> {
    const formData = new FormData()
    formData.append('file', file)
    const api = await createServerApi()
    const response = await api.post('/uploads/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return response.data.file
  },

  async uploadDocument(file: File): Promise<{ url: string; filename: string }> {
    const formData = new FormData()
    formData.append('file', file)
    const api = await createServerApi()
    const response = await api.post('/uploads/document', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return response.data.file
  },

  async deleteFile(filename: string): Promise<void> {
    const api = await createServerApi()
    await api.delete(`/uploads/${filename}`)
  },
}

export const usersApi = {
  async getProfile(id: string): Promise<User> {
    const api = createApiInstance()
    const response = await api.get(`/users/${id}`)
    return response.data
  },

  async updateProfile(id: string, data: Partial<User>): Promise<User> {
    const api = await createServerApi()
    const response = await api.patch(`/users/${id}`, data)
    return response.data
  },
}