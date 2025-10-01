import Link from 'next/link'
import { blogPostsApi, likesApi } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar, Eye, Heart, MessageCircle, User, PenTool } from 'lucide-react'
import { BlogPost } from '@/lib/types'
import { getImageUrl } from '@/lib/utils'
import { getUser } from '@/lib/auth'
import { LikeButton } from '@/components/like-button'

async function getBlogPosts() {
  try {
    const response = await blogPostsApi.getAll(1, 10, 'published')
    return response.posts || []
  } catch (error) {
    console.error('Failed to fetch blog posts:', error)
    return []
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
              <span className="px-3 py-1 bg-card backdrop-blur-sm text-foreground rounded-full text-xs font-medium">
                Read More
              </span>
            </div>
          </div>
        ) : (
          <div className="h-52 bg-muted flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 via-transparent to-indigo-500/10"></div>
            <PenTool className="h-16 w-16 text-muted-foreground relative z-10" />
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

export default async function HomePage() {
  const posts = await getBlogPosts()
  const user = await getUser()

  // Get like statuses for all posts
  const likeStatuses = await Promise.all(
    posts.map(post => getLikeStatus(post._id, user))
  )

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section
      <section className="relative overflow-hidden py-20 md:py-32 mb-20">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900"></div>
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-72 h-72 bg-gradient-to-r from-violet-200 to-pink-200 dark:from-violet-900/20 dark:to-pink-900/20 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
          <div className="absolute top-0 right-1/4 w-72 h-72 bg-gradient-to-r from-yellow-200 to-orange-200 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-0 left-1/2 w-72 h-72 bg-gradient-to-r from-blue-200 to-indigo-200 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
        </div>
        <div className="relative text-center px-4">
          <div className="inline-flex items-center px-6 py-3 rounded-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-sm font-medium mb-8 shadow-lg">
            <Heart className="h-4 w-4 mr-2 text-rose-500" />
            Welcome to BlogApp
          </div>
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-extrabold mb-8 leading-tight">
            <span className="bg-gradient-to-r from-slate-900 via-slate-700 to-slate-900 dark:from-white dark:via-slate-200 dark:to-white bg-clip-text text-transparent">
              Share Your
            </span>
            <br />
            <span className="bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 bg-clip-text text-transparent">
              Story
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-slate-600 dark:text-slate-300 mb-10 max-w-4xl mx-auto leading-relaxed font-light">
            Discover amazing stories, share your thoughts, and connect with writers from around the world.
            Join our community of passionate storytellers.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <Link href="/register">
              <Button size="lg" className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white px-10 py-4 text-lg font-semibold rounded-full shadow-2xl hover:shadow-violet-500/25 transition-all duration-300 transform hover:scale-105">
                Get Started
                <User className="ml-3 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/blog">
              <Button variant="outline" size="lg" className="border-2 border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 px-10 py-4 text-lg font-semibold rounded-full backdrop-blur-sm">
                Explore Posts
                <Eye className="ml-3 h-5 w-5" />
              </Button>
            </Link>
          </div>

          <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center group">
              <div className="w-16 h-16 bg-gradient-to-br from-rose-100 to-rose-200 dark:from-rose-900/30 dark:to-rose-800/30 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300">
                <MessageCircle className="h-8 w-8 text-rose-600 dark:text-rose-400" />
              </div>
              <h3 className="text-lg font-semibold mb-3 text-slate-800 dark:text-slate-200">Engage & Discuss</h3>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">Comment and like posts to connect with writers</p>
            </div>
            <div className="text-center group">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-100 to-emerald-200 dark:from-emerald-900/30 dark:to-emerald-800/30 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300">
                <PenTool className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 className="text-lg font-semibold mb-3 text-slate-800 dark:text-slate-200">Write & Publish</h3>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">Create beautiful posts with rich media support</p>
            </div>
            <div className="text-center group">
              <div className="w-16 h-16 bg-gradient-to-br from-violet-100 to-violet-200 dark:from-violet-900/30 dark:to-violet-800/30 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300">
                <User className="h-8 w-8 text-violet-600 dark:text-violet-400" />
              </div>
              <h3 className="text-lg font-semibold mb-3 text-slate-800 dark:text-slate-200">Build Community</h3>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">Follow writers and build lasting connections</p>
            </div>
          </div>
        </div>
      </section> */}

      {/* Latest Posts */}
      <section>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold mb-2 text-foreground">Latest Posts</h2>
            <p className="text-muted-foreground">Discover the newest stories from our community</p>
          </div>
          <Link href="/blog">
            <Button variant="outline" className="border-2 hover:bg-accent">
              View All Posts
              <Eye className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>

        {posts.length > 0 ? (
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
        ) : (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-muted rounded-full mx-auto mb-6 flex items-center justify-center">
              <PenTool className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-3 text-foreground">No posts yet</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Be the first to share your story and inspire others in our community.
            </p>
            <Link href="/register">
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                Be the first to write!
                <PenTool className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        )}
      </section>
    </div>
  )
}
