import { blogPostsApi, likesApi } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar, Eye, Heart, MessageCircle, User } from 'lucide-react'
import Link from 'next/link'
import { BlogPost } from '@/lib/types'
import { getImageUrl } from '@/lib/utils'
import { getUser } from '@/lib/auth'
import { LikeButton } from '@/components/like-button'

interface BlogPageProps {
  searchParams: Promise<{ page?: string }>
}

async function getBlogPosts(page: number) {
  try {
    const response = await blogPostsApi.getAll(page, 12, 'published')
    return {
      posts: response.posts || [],
      pagination: {
        total: response.total || 0,
        page: page,
        limit: 12,
        totalPages: Math.ceil((response.total || 0) / 12)
      }
    }
  } catch (error) {
    console.error('Failed to fetch blog posts:', error)
    return {
      posts: [],
      pagination: { total: 0, page: 1, limit: 12, totalPages: 1 }
    }
  }
}

async function getLikeStatus(postId: string, user: any) {
  if (!user) return { liked: false }
  try {
    return await likesApi.getStatus('BlogPost', postId)
  } catch (error) {
    return { liked: false }
  }
}

function BlogPostCard({ post, initialLiked, isAuthenticated }: { post: BlogPost; initialLiked: boolean; isAuthenticated: boolean }) {
  return (
    <Card className="h-full group hover:shadow-2xl transition-all duration-500 hover:scale-[1.03] bg-card backdrop-blur-xl border-border rounded-2xl overflow-hidden">
      <div className="relative overflow-hidden">
        {post.featuredImage ? (
          <div className="relative h-52 overflow-hidden">
            <img
              src={getImageUrl(post.featuredImage) || post.featuredImage}
              alt={post.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500" />
            <div className="absolute bottom-4 left-4 opacity-0 group-hover:opacity-100 transition-all duration-500 delay-100">
              <span className="px-3 py-1 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm text-slate-800 dark:text-slate-200 rounded-full text-xs font-medium">
                Read More
              </span>
            </div>
          </div>
        ) : (
          <div className="h-52 bg-muted flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 via-transparent to-indigo-500/10"></div>
            <MessageCircle className="h-16 w-16 text-muted-foreground relative z-10" />
          </div>
        )}
      </div>

      <CardHeader className="pb-4 pt-6">
        <CardTitle className="line-clamp-2 text-xl font-bold leading-tight text-card-foreground">
          <Link href={`/blog/${post._id}`} className="hover:text-primary transition-colors duration-300">
            {post.title}
          </Link>
        </CardTitle>
        <CardDescription className="line-clamp-3 leading-relaxed mt-2">
          {post.excerpt}
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-0 pb-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-violet-400 to-indigo-500 rounded-full flex items-center justify-center shadow-lg">
              <User className="h-4 w-4 text-white" />
            </div>
            <div>
              <span className="font-semibold text-foreground text-sm">
                {post.author.firstName} {post.author.lastName}
              </span>
              <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                <span>{new Date(post.publishedAt || post.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 px-3 py-1.5 bg-muted rounded-full">
              <Eye className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground">{post.views}</span>
            </div>
            <LikeButton
              targetId={post._id}
              targetType="post"
              initialCount={post.likesCount}
              initialLiked={initialLiked}
              isAuthenticated={isAuthenticated}
              variant="compact"
            />
            <div className="flex items-center space-x-2 px-3 py-1.5 bg-muted rounded-full">
              <MessageCircle className="h-3.5 w-3.5 text-emerald-500" />
              <span className="text-xs font-medium text-muted-foreground">{post.commentsCount}</span>
            </div>
          </div>

          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {post.tags.slice(0, 1).map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 bg-gradient-to-r from-violet-500 to-indigo-500 text-white rounded-full text-xs font-medium shadow-sm"
                >
                  {tag}
                </span>
              ))}
              {post.tags.length > 1 && (
                <span className="px-2 py-1 bg-muted text-muted-foreground rounded-full text-xs">
                  +{post.tags.length - 1}
                </span>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function Pagination({ pagination }: { pagination: any }) {
  const { page, totalPages } = pagination

  if (totalPages <= 1) return null

  return (
    <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mt-12 pt-8 border-t-2 border-slate-200 dark:border-slate-800">
      {page > 1 && (
        <Link href={`/blog?page=${page - 1}`}>
          <button className="px-6 py-3 rounded-lg font-medium text-sm border-2 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:border-violet-500 hover:text-violet-600 dark:hover:text-violet-400 transition-all duration-200 hover:scale-105 shadow-sm hover:shadow-md min-w-[120px]">
            ← Previous
          </button>
        </Link>
      )}

      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold px-4 py-2 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md">
          Page {page} of {totalPages}
        </span>
      </div>

      {page < totalPages && (
        <Link href={`/blog?page=${page + 1}`}>
          <button className="px-6 py-3 rounded-lg font-medium text-sm bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-700 hover:to-indigo-700 transition-all duration-200 hover:scale-105 shadow-md hover:shadow-lg min-w-[120px]">
            Next →
          </button>
        </Link>
      )}
    </div>
  )
}

export default async function BlogPage({ searchParams }: BlogPageProps) {
  const { page } = await searchParams
  const currentPage = parseInt(page || '1', 10)
  const { posts, pagination } = await getBlogPosts(currentPage)
  const user = await getUser()

  // Get like statuses for all posts
  const likeStatuses = await Promise.all(
    posts.map(post => getLikeStatus(post._id, user))
  )

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="text-center mb-16 relative">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-200 dark:bg-violet-900/20 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-indigo-200 dark:bg-indigo-900/20 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
        </div>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold mb-6 bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent leading-tight">
          Explore Stories
        </h1>
        <div className="mt-8 flex justify-center gap-2">
          <span className="px-4 py-2 bg-violet-100 dark:bg-violet-900/30 rounded-full text-sm font-medium text-black dark:text-white">
            {pagination.total} {pagination.total === 1 ? 'Post' : 'Posts'}
          </span>
        </div>
      </div>

      {posts.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {posts.map((post, index) => (
              <BlogPostCard
                key={post._id}
                post={post}
                initialLiked={likeStatuses[index]?.liked || false}
                isAuthenticated={!!user}
              />
            ))}
          </div>

          <Pagination pagination={pagination} />
        </>
      ) : (
        <div className="text-center py-16">
          <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full mx-auto mb-6 flex items-center justify-center">
            <MessageCircle className="h-10 w-10 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold mb-3">No posts yet</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Be the first to share your story and inspire others in our community.
          </p>
          <Link href="/register">
            <Button className="bg-blue-600 hover:bg-blue-700">
              Be the first to write!
              <MessageCircle className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      )}
    </div>
  )
}