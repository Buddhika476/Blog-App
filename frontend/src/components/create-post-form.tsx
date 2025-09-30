'use client'

import { useState, useTransition } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ImageUpload } from '@/components/image-upload'
import { DocumentUpload } from '@/components/document-upload'
import { RichTextEditor } from '@/components/rich-text-editor'
import { User } from '@/lib/types'
import { useRouter } from 'next/navigation'
import { clientBlogPostsApi } from '@/lib/api'

interface CreatePostFormProps {
  user: User
}

export function CreatePostForm({ user }: CreatePostFormProps) {
  const [formData, setFormData] = useState({
    title: '',
    excerpt: '',
    content: '',
    tags: '',
    featuredImage: ''
  })
  const [featuredImageFile, setFeaturedImageFile] = useState<File | null>(null)
  const [attachments, setAttachments] = useState<Array<{ file: File; url: string; filename: string }>>([])
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

        let result
        if (action === 'publish') {
          result = await clientBlogPostsApi.create({
            title: payload.title,
            content: payload.content,
            excerpt: payload.excerpt,
            tags: payload.tags,
            status: 'published'
          })
        } else {
          result = await clientBlogPostsApi.createDraft({
            title: payload.title,
            content: payload.content,
            excerpt: payload.excerpt,
            tags: payload.tags
          })
        }

        // If there's a featured image file, upload it separately
        if (featuredImageFile) {
          try {
            await clientBlogPostsApi.uploadFeaturedImage(result._id, featuredImageFile)
          } catch (imageError) {
            console.warn('Failed to upload featured image:', imageError)
          }
        }

        // Upload attachments if any
        if (attachments.length > 0) {
          try {
            for (const attachment of attachments) {
              await clientBlogPostsApi.uploadAttachment(result._id, attachment.file)
            }
          } catch (attachmentError) {
            console.warn('Failed to add attachments:', attachmentError)
          }
        }

        router.push('/dashboard')
      } catch (error) {
        console.error('Error creating post:', error)
      }
    })
  }

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleDocumentUpload = (file: File, url: string, filename: string) => {
    setAttachments(prev => [...prev, { file, url, filename }])
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Write Your Post</CardTitle>
        <CardDescription>
          Fill in the details below to create your blog post
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="Enter your post title..."
              required
              className="text-lg"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="excerpt">Excerpt</Label>
            <textarea
              id="excerpt"
              value={formData.excerpt}
              onChange={(e) => handleChange('excerpt', e.target.value)}
              placeholder="Brief summary of your post..."
              className="w-full p-3 border rounded-lg resize-none"
              rows={3}
              required
            />
          </div>

          <ImageUpload
            onImageUploaded={(url, file) => {
              handleChange('featuredImage', url)
              if (file) setFeaturedImageFile(file)
            }}
            currentImage={formData.featuredImage}
          />

          <DocumentUpload
            onDocumentUploaded={handleDocumentUpload}
            currentDocuments={attachments}
          />

          <div className="space-y-2">
            <Label htmlFor="content">Content</Label>
            <RichTextEditor
              value={formData.content}
              onChange={(value) => handleChange('content', value)}
              placeholder="Write your post content here..."
              disabled={isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Tags</Label>
            <Input
              id="tags"
              value={formData.tags}
              onChange={(e) => handleChange('tags', e.target.value)}
              placeholder="Enter tags separated by commas (e.g., technology, web development, tutorial)"
            />
            <p className="text-sm text-muted-foreground">
              Tags help readers discover your content
            </p>
          </div>

          <div className="flex justify-between items-center pt-6 border-t">
            <div className="text-sm text-muted-foreground">
              Publishing as {user.firstName} {user.lastName}
            </div>
            <div className="space-x-4">
              <Button
                onClick={() => handleSubmit('draft')}
                disabled={isPending || !formData.title || !formData.excerpt || !formData.content}
                variant="outline"
              >
                {isPending ? 'Saving...' : 'Save as Draft'}
              </Button>
              <Button
                onClick={() => handleSubmit('publish')}
                disabled={isPending || !formData.title || !formData.excerpt || !formData.content}
              >
                {isPending ? 'Publishing...' : 'Publish Post'}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}