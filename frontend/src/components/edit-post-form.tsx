'use client'

import { useState, useTransition } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { ImageUpload } from '@/components/image-upload'
import { BlogPost } from '@/lib/types'
import { useRouter } from 'next/navigation'

interface EditPostFormProps {
  post: BlogPost
}

export function EditPostForm({ post }: EditPostFormProps) {
  const [formData, setFormData] = useState({
    title: post.title,
    excerpt: post.excerpt,
    content: post.content,
    tags: post.tags?.join(', ') || '',
    featuredImage: post.featuredImage || ''
  })
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const handleSubmit = async (action: 'draft' | 'publish') => {
    startTransition(async () => {
      try {
        const payload = {
          title: formData.title,
          excerpt: formData.excerpt,
          content: formData.content,
          tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean),
          status: action === 'publish' ? 'published' : 'draft',
          featuredImage: formData.featuredImage
        }

        console.log('[EditPostForm] Submitting update:', payload)

        const response = await fetch(`/api/blog-posts/${post._id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        })

        const data = await response.json()
        console.log('[EditPostForm] Response:', response.status, data)

        if (response.ok) {
          alert('Post updated successfully!')
          router.push('/dashboard/posts')
          router.refresh()
        } else {
          alert(`Failed to update post: ${data.error || 'Unknown error'}`)
          throw new Error(data.error || 'Failed to update post')
        }
      } catch (error) {
        console.error('[EditPostForm] Error updating post:', error)
        alert(`Error: ${error instanceof Error ? error.message : 'Failed to update post'}`)
      }
    })
  }

  const handlePublishDraft = async () => {
    startTransition(async () => {
      try {
        console.log('[EditPostForm] Publishing draft:', post._id)

        const response = await fetch(`/api/blog-posts/${post._id}/publish`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ publishNow: true }),
        })

        const data = await response.json()
        console.log('[EditPostForm] Publish response:', response.status, data)

        if (response.ok) {
          alert('Draft published successfully!')
          router.push('/dashboard/posts')
          router.refresh()
        } else {
          alert(`Failed to publish draft: ${data.error || 'Unknown error'}`)
          throw new Error(data.error || 'Failed to publish draft')
        }
      } catch (error) {
        console.error('[EditPostForm] Error publishing draft:', error)
        alert(`Error: ${error instanceof Error ? error.message : 'Failed to publish draft'}`)
      }
    })
  }

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <Card className="border-none shadow-xl bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl">
      <CardHeader className="pb-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <CardTitle className="text-3xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
                Edit Your Post
              </CardTitle>
              <Badge
                variant={post.status === 'published' ? 'default' : 'secondary'}
                className="px-3 py-1 text-xs font-semibold"
              >
                {post.status}
              </Badge>
            </div>
            <CardDescription className="text-base">
              Update the details of your blog post below
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-8">
          <div className="space-y-3">
            <Label htmlFor="title" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Title
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="Enter an engaging title for your post..."
              required
              className="text-lg h-12 border-2 border-slate-200 dark:border-slate-700 focus:border-violet-500 dark:focus:border-violet-500 transition-colors"
            />
          </div>

          <div className="space-y-3">
            <Label htmlFor="excerpt" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Excerpt
            </Label>
            <textarea
              id="excerpt"
              value={formData.excerpt}
              onChange={(e) => handleChange('excerpt', e.target.value)}
              placeholder="Write a compelling summary that will hook your readers..."
              className="w-full p-4 border-2 border-slate-200 dark:border-slate-700 focus:border-violet-500 dark:focus:border-violet-500 rounded-lg resize-none transition-colors bg-white dark:bg-slate-900"
              rows={3}
              required
            />
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {formData.excerpt.length}/280 characters
            </p>
          </div>

          <ImageUpload
            onImageUploaded={(url) => handleChange('featuredImage', url)}
            currentImage={formData.featuredImage}
          />

          <div className="space-y-3">
            <Label htmlFor="content" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Content
            </Label>
            <textarea
              id="content"
              value={formData.content}
              onChange={(e) => handleChange('content', e.target.value)}
              placeholder="Share your thoughts, ideas, and stories..."
              className="w-full p-4 border-2 border-slate-200 dark:border-slate-700 focus:border-violet-500 dark:focus:border-violet-500 rounded-lg resize-none transition-colors font-mono text-sm bg-white dark:bg-slate-900"
              rows={18}
              required
            />
            <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>{formData.content.split(/\s+/).filter(Boolean).length} words</span>
              <span>{formData.content.length} characters</span>
            </div>
          </div>

          <div className="space-y-3">
            <Label htmlFor="tags" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Tags
            </Label>
            <Input
              id="tags"
              value={formData.tags}
              onChange={(e) => handleChange('tags', e.target.value)}
              placeholder="e.g., technology, web development, tutorial"
              className="h-12 border-2 border-slate-200 dark:border-slate-700 focus:border-violet-500 dark:focus:border-violet-500 transition-colors"
            />
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Separate tags with commas to help readers discover your content
            </p>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-8 border-t-2 border-slate-200 dark:border-slate-700">
            <div className="text-sm text-slate-500 dark:text-slate-400">
              Last updated: {new Date(post.updatedAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </div>
            <div className="flex flex-wrap gap-3">
              {post.status === 'draft' && (
                <button
                  onClick={handlePublishDraft}
                  disabled={isPending}
                  className="px-5 py-2.5 rounded-lg font-medium text-sm bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 shadow-md hover:shadow-lg"
                >
                  {isPending ? 'Publishing...' : 'Publish Draft'}
                </button>
              )}
              <button
                onClick={() => handleSubmit('draft')}
                disabled={isPending || !formData.title || !formData.excerpt || !formData.content}
                className="px-5 py-2.5 rounded-lg font-medium text-sm border-2 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:border-violet-500 hover:text-violet-600 dark:hover:text-violet-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {isPending ? 'Saving...' : 'Save as Draft'}
              </button>
              <button
                onClick={() => handleSubmit('publish')}
                disabled={isPending || !formData.title || !formData.excerpt || !formData.content}
                className="px-6 py-2.5 rounded-lg font-medium text-sm bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 shadow-md hover:shadow-lg"
              >
                {isPending ? 'Updating...' : post.status === 'published' ? 'Update Post' : 'Publish Post'}
              </button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}