import { notFound, redirect } from 'next/navigation'
import { requireAuth } from '@/lib/auth'
import { blogPostsApi } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { EditPostForm } from '@/components/edit-post-form'

interface EditPostPageProps {
  params: Promise<{ id: string }>
}

async function getBlogPost(id: string) {
  try {
    // Try to get the post first (works for both published posts and drafts)
    const post = await blogPostsApi.getById(id)
    return post
  } catch (error) {
    console.error('[EditPage] Failed to fetch blog post:', error)
    return null
  }
}


export default async function EditPostPage({ params }: EditPostPageProps) {
  const { id } = await params
  const user = await requireAuth()
  const post = await getBlogPost(id)

  console.log('[EditPage] User ID:', user._id)
  console.log('[EditPage] Post ID:', id)
  console.log('[EditPage] Post author ID:', post?.author?._id)
  console.log('[EditPage] Post found:', !!post)

  if (!post) {
    console.log('[EditPage] Post not found, showing 404')
    notFound()
  }

  // Check if user owns this post - compare as strings
  const authorId = typeof post.author === 'string' ? post.author : post.author._id
  // Handle both _id and id for backward compatibility
  const userId = (user as any)._id || (user as any).id

  console.log('[EditPage] Comparing author:', authorId, 'with user:', userId)

  if (!userId) {
    console.log('[EditPage] User ID not found in user object:', user)
    redirect('/login')
  }

  if (authorId !== userId) {
    console.log('[EditPage] User does not own this post, redirecting to dashboard')
    redirect('/dashboard')
  }

  console.log('[EditPage] Authorization passed, rendering edit form')

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <div className="flex items-center space-x-4 mb-2">
          <h1 className="text-3xl font-bold">Edit Post</h1>
          <Badge variant={post.status === 'published' ? 'default' : 'secondary'}>
            {post.status}
          </Badge>
        </div>
        <p className="text-muted-foreground">
          Make changes to your blog post
        </p>
      </div>

      <EditPostForm post={post} />
    </div>
  )
}