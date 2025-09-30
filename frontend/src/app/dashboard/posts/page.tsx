import { requireAuth } from '@/lib/auth'
import { blogPostsApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Edit } from 'lucide-react'
import Link from 'next/link'
import { DashboardPostCard } from '@/components/dashboard-post-card'

async function getUserPosts() {
  try {
    const response = await blogPostsApi.getMyPosts(1, 50)
    return response.posts || []
  } catch (error) {
    console.error('Failed to fetch user posts:', error)
    return []
  }
}

async function deletePostAction(postId: string) {
  'use server'
  await requireAuth()
  try {
    await blogPostsApi.delete(postId)
  } catch (error: any) {
    throw new Error(error?.response?.data?.message || 'Failed to delete post')
  }
}

export default async function PostsManagementPage() {
  const user = await requireAuth()
  const posts = await getUserPosts()

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Manage Posts</h1>
          <p className="text-muted-foreground">
            View and manage all your blog posts
          </p>
        </div>
        <Link href="/create">
          <Button>
            <Edit className="h-4 w-4 mr-2" />
            Create New Post
          </Button>
        </Link>
      </div>

      {posts.length > 0 ? (
        <div className="space-y-4">
          {posts.map((post) => (
            <DashboardPostCard
              key={post._id}
              post={post}
              onDelete={deletePostAction}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">You haven't created any posts yet.</p>
          <Link href="/create">
            <Button>Create Your First Post</Button>
          </Link>
        </div>
      )}
    </div>
  )
}