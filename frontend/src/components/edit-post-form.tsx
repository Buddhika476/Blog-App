'use client'

import { useState, useTransition, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { ImageUpload } from '@/components/image-upload'
import { DocumentUpload } from '@/components/document-upload'
import { RichTextEditor } from '@/components/rich-text-editor'
import { BlogPost } from '@/lib/types'
import { useRouter } from 'next/navigation'
import { clientBlogPostsApi } from '@/lib/api'
import { useToast } from '@/components/toast-container'

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
  const [attachments, setAttachments] = useState<Array<{ file?: File; url: string; filename: string }>>(
    post.attachments?.map(att => ({ url: att.url, filename: att.filename })) || []
  )
  const [newAttachments, setNewAttachments] = useState<Array<{ file: File; url: string; filename: string }>>([])
  const [errors, setErrors] = useState({
    title: '',
    excerpt: '',
    content: ''
  })
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const { showToast } = useToast()

  // Log the initial featured image for debugging
  console.log('[EditPostForm] Initial featuredImage:', post.featuredImage)
  console.log('[EditPostForm] FormData featuredImage:', formData.featuredImage)

  // Sync formData when post changes (e.g., after save)
  useEffect(() => {
    setFormData({
      title: post.title,
      excerpt: post.excerpt,
      content: post.content,
      tags: post.tags?.join(', ') || '',
      featuredImage: post.featuredImage || ''
    })
    setAttachments(post.attachments?.map(att => ({ url: att.url, filename: att.filename })) || [])
  }, [post])

  const validateForm = (): boolean => {
    const newErrors = {
      title: '',
      excerpt: '',
      content: ''
    }

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required'
    } else if (formData.title.length < 5) {
      newErrors.title = 'Title must be at least 5 characters'
    } else if (formData.title.length > 200) {
      newErrors.title = 'Title must be less than 200 characters'
    }

    if (!formData.excerpt.trim()) {
      newErrors.excerpt = 'Excerpt is required'
    } else if (formData.excerpt.length < 20) {
      newErrors.excerpt = 'Excerpt must be at least 20 characters'
    } else if (formData.excerpt.length > 280) {
      newErrors.excerpt = 'Excerpt must be less than 280 characters'
    }

    if (!formData.content.trim()) {
      newErrors.content = 'Content is required'
    } else if (formData.content.length < 50) {
      newErrors.content = 'Content must be at least 50 characters'
    }

    setErrors(newErrors)
    return !newErrors.title && !newErrors.excerpt && !newErrors.content
  }

  const handleSubmit = async (action: 'draft' | 'publish') => {
    if (!validateForm()) {
      showToast('Please fix all validation errors', 'error')
      return
    }

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
          // Upload new attachments if any
          if (newAttachments.length > 0) {
            try {
              for (const attachment of newAttachments) {
                await clientBlogPostsApi.uploadAttachment(post._id, attachment.file)
              }
            } catch (attachmentError) {
              console.warn('Failed to add attachments:', attachmentError)
            }
          }

          showToast('Post updated successfully!', 'success')
          router.push('/dashboard/posts')
          router.refresh()
        } else {
          showToast(`Failed to update post: ${data.error || 'Unknown error'}`, 'error')
          throw new Error(data.error || 'Failed to update post')
        }
      } catch (error) {
        console.error('[EditPostForm] Error updating post:', error)
        showToast(`Error: ${error instanceof Error ? error.message : 'Failed to update post'}`, 'error')
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
          showToast('Draft published successfully!', 'success')
          router.push('/dashboard/posts')
          router.refresh()
        } else {
          showToast(`Failed to publish draft: ${data.error || 'Unknown error'}`, 'error')
          throw new Error(data.error || 'Failed to publish draft')
        }
      } catch (error) {
        console.error('[EditPostForm] Error publishing draft:', error)
        showToast(`Error: ${error instanceof Error ? error.message : 'Failed to publish draft'}`, 'error')
      }
    })
  }

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handleDocumentUpload = (file: File, url: string, filename: string) => {
    const newDoc = { file, url, filename }
    setAttachments(prev => [...prev, newDoc])
    setNewAttachments(prev => [...prev, newDoc])
  }

  return (
    <Card className="border-none shadow-xl bg-white/80 dark:bg-slate-800/30 backdrop-blur-xl">
      <CardHeader className="pb-4">
      </CardHeader>
      <CardContent>
        <div className="space-y-8">
          <div className="space-y-3">
            <Label htmlFor="title" className="text-sm font-semibold text-foreground">
              Title *
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="Enter an engaging title for your post..."
              required
              className={`text-lg h-12 border-2 focus:border-violet-500 dark:focus:border-violet-500 transition-colors ${errors.title ? 'border-red-500' : ''}`}
            />
            {errors.title && (
              <p className="text-sm text-red-600 dark:text-red-400">{errors.title}</p>
            )}
          </div>

          <div className="space-y-3">
            <Label htmlFor="excerpt" className="text-sm font-semibold text-foreground">
              Excerpt *
            </Label>
            <textarea
              id="excerpt"
              value={formData.excerpt}
              onChange={(e) => handleChange('excerpt', e.target.value)}
              placeholder="Write a compelling summary that will hook your readers..."
              className={`w-full p-4 border-2 focus:border-violet-500 dark:focus:border-violet-500 rounded-lg resize-none transition-colors bg-background text-foreground ${errors.excerpt ? 'border-red-500' : ''}`}
              rows={3}
              required
            />
            <p className={`text-xs ${formData.excerpt.length > 280 ? 'text-red-600' : 'text-muted-foreground'}`}>
              {formData.excerpt.length}/280 characters
            </p>
            {errors.excerpt && (
              <p className="text-sm text-red-600 dark:text-red-400">{errors.excerpt}</p>
            )}
          </div>

          <ImageUpload
            onImageUploaded={(url) => handleChange('featuredImage', url)}
            currentImage={formData.featuredImage}
          />

          <DocumentUpload
            onDocumentUploaded={handleDocumentUpload}
            currentDocuments={attachments}
          />

          <div className="space-y-3">
            <Label htmlFor="content" className="text-sm font-semibold text-foreground">
              Content *
            </Label>
            <RichTextEditor
              value={formData.content}
              onChange={(value) => handleChange('content', value)}
              placeholder="Share your thoughts, ideas, and stories..."
              disabled={isPending}
            />
            {errors.content && (
              <p className="text-sm text-red-600 dark:text-red-400">{errors.content}</p>
            )}
          </div>

          <div className="space-y-3">
            <Label htmlFor="tags" className="text-sm font-semibold text-foreground">
              Tags
            </Label>
            <Input
              id="tags"
              value={formData.tags}
              onChange={(e) => handleChange('tags', e.target.value)}
              placeholder="e.g., technology, web development, tutorial"
              className="h-12 border-2 focus:border-violet-500 dark:focus:border-violet-500 transition-colors"
            />
            <p className="text-xs text-muted-foreground">
              Separate tags with commas to help readers discover your content
            </p>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-8 border-t-2">
            <div className="text-sm text-muted-foreground">
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
                className="px-5 py-2.5 rounded-lg font-medium text-sm border-2 hover:border-violet-500 hover:text-violet-600 dark:hover:text-violet-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
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