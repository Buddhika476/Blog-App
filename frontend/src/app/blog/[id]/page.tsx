import { notFound } from 'next/navigation'
import { blogPostsApi, commentsApi, likesApi } from '@/lib/api'
import { getUser } from '@/lib/auth'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar, Eye, Heart, MessageCircle, User, FileText, Download } from 'lucide-react'
import Link from 'next/link'
import { LikeButton } from '@/components/like-button'
import { CommentsSection } from '@/components/comments-section'
import { getImageUrl } from '@/lib/utils'

interface BlogPostPageProps {
  params: Promise<{ id: string }>
}

async function getBlogPost(id: string) {
  try {
    return await blogPostsApi.getByIdWithEngagement(id)
  } catch (error) {
    return null
  }
}

async function getComments(blogPostId: string) {
  try {
    const response = await commentsApi.getByBlogPost(blogPostId)
    return response.comments || []
  } catch (error) {
    console.error('Failed to fetch comments:', error)
    return []
  }
}

async function getLikeStatus(targetType: 'BlogPost' | 'Comment', targetId: string) {
  try {
    const user = await getUser()
    if (!user) return { liked: false }

    return await likesApi.getStatus(targetType, targetId)
  } catch (error) {
    return { liked: false }
  }
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { id } = await params
  const post = await getBlogPost(id)
  const user = await getUser()

  if (!post) {
    notFound()
  }

  const [comments, likeStatus] = await Promise.all([
    getComments(id),
    getLikeStatus('BlogPost', id)
  ])

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <article>
        {/* Featured Image */}
        {post.featuredImage && (
          <img
            src={getImageUrl(post.featuredImage) || post.featuredImage}
            alt={post.title}
            className="w-full h-64 md:h-96 object-cover rounded-lg mb-8"
          />
        )}

        {/* Post Header */}
        <header className="mb-8">
          <h1 className="text-4xl font-bold mb-4">{post.title}</h1>

          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <User className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">
                  {post.author.firstName} {post.author.lastName}
                </span>
              </div>
              <div className="flex items-center space-x-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>{new Date(post.publishedAt || post.createdAt).toLocaleDateString()}</span>
              </div>
            </div>

            <div className="flex items-center space-x-4 text-muted-foreground">
              <div className="flex items-center space-x-1">
                <Eye className="h-4 w-4" />
                <span>{post.views}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Heart className="h-4 w-4" />
                <span>{post.likesCount}</span>
              </div>
              <div className="flex items-center space-x-1">
                <MessageCircle className="h-4 w-4" />
                <span>{post.commentsCount}</span>
              </div>
            </div>
          </div>

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-sm"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </header>

        {/* Post Content */}
        <div className="prose prose-lg max-w-none mb-12">
          <div dangerouslySetInnerHTML={{ __html: post.content }} />
        </div>

        {/* Attachments Section */}
        {post.attachments && post.attachments.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4">Attachments</h3>
            <div className="space-y-2">
              {post.attachments.map((attachment, index) => {
                const filename = attachment.split('/').pop() || 'Document'
                const fullUrl = getImageUrl(attachment) || attachment
                return (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                    <div className="flex items-center space-x-3">
                      <FileText className="h-6 w-6 text-blue-500" />
                      <span className="font-medium text-gray-700">{filename}</span>
                    </div>
                    <a
                      href={fullUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-2 text-blue-600 hover:text-blue-800"
                    >
                      <Download className="h-5 w-5" />
                      <span className="text-sm font-medium">Download</span>
                    </a>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Engagement Actions */}
        <div className="border-t border-b py-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <LikeButton
                targetType="post"
                targetId={post._id}
                initialLiked={likeStatus.liked}
                initialCount={post.likesCount}
                isAuthenticated={!!user}
              />
            </div>
            <div className="text-sm text-muted-foreground">
              Published on {new Date(post.publishedAt || post.createdAt).toLocaleDateString()}
            </div>
          </div>
        </div>

        {/* Comments Section */}
        <CommentsSection
          blogPostId={post._id}
          initialComments={comments}
          user={user}
        />
      </article>
    </div>
  )
}