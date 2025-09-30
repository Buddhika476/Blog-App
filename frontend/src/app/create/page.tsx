import { requireAuth } from '@/lib/auth'
import { blogPostsApi } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { redirect } from 'next/navigation'
import { CreatePostForm } from '@/components/create-post-form'


export default async function CreatePostPage() {
  const user = await requireAuth()

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Create New Post</h1>
        <p className="text-muted-foreground">
          Share your thoughts with the world
        </p>
      </div>

      <CreatePostForm user={user} />
    </div>
  )
}