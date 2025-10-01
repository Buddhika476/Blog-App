'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Upload, X, Image as ImageIcon } from 'lucide-react'
import { getImageUrl } from '@/lib/utils'

interface ImageUploadProps {
  onImageUploaded?: (url: string, file?: File) => void
  currentImage?: string
  label?: string
  className?: string
}

export function ImageUpload({
  onImageUploaded,
  currentImage,
  label = "Featured Image",
  className = ""
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Set preview from currentImage on mount/update
  useEffect(() => {
    if (currentImage) {
      const imageUrl = getImageUrl(currentImage) || currentImage
      setPreview(imageUrl)
    } else {
      setPreview(null)
    }
  }, [currentImage])

  const resizeImage = (file: File): Promise<File> => {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const img = document.createElement('img')
        img.onload = () => {
          const canvas = document.createElement('canvas')
          const ctx = canvas.getContext('2d')

          let width = img.width
          let height = img.height
          const maxDimension = 1920

          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = (height / width) * maxDimension
              width = maxDimension
            } else {
              width = (width / height) * maxDimension
              height = maxDimension
            }
          }

          canvas.width = width
          canvas.height = height
          ctx?.drawImage(img, 0, 0, width, height)

          canvas.toBlob((blob) => {
            if (blob) {
              const resizedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now(),
              })
              resolve(resizedFile)
            } else {
              resolve(file)
            }
          }, file.type, 0.9)
        }
        img.src = e.target?.result as string
      }
      reader.readAsDataURL(file)
    })
  }

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('Image size must be less than 10MB')
      return
    }

    setError(null)
    setUploading(true)

    try {
      // Resize image before upload
      const resizedFile = await resizeImage(file)

      // Create preview
      const previewUrl = URL.createObjectURL(resizedFile)
      setPreview(previewUrl)

      // Upload to server
      const formData = new FormData()
      formData.append('file', resizedFile)

      const response = await fetch('/api/uploads/image', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Failed to upload image')
      }

      const data = await response.json()

      if (onImageUploaded) {
        onImageUploaded(data.file?.url || data.url, file)
      }
    } catch (error: any) {
      console.error('Error uploading image:', error)
      const errorMessage = error.message || 'Failed to upload image'
      setError(errorMessage)
      const fallbackUrl = currentImage ? (getImageUrl(currentImage) || currentImage) : null
      setPreview(fallbackUrl)
    } finally {
      setUploading(false)
    }
  }

  const handleRemove = () => {
    setPreview(null)
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    if (onImageUploaded) {
      onImageUploaded('')
    }
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <Label htmlFor="image-upload" className="text-sm font-semibold text-foreground">{label}</Label>

      <div className="border-2 border-dashed border-border rounded-lg p-6 text-center bg-muted/30">
        {preview ? (
          <div className="relative">
            <img
              src={preview}
              alt="Preview"
              className="max-h-64 mx-auto rounded-lg"
            />
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="absolute top-2 right-2"
              onClick={handleRemove}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground" />
            <div>
              <Button
                type="button"
                variant="outline"
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-4 w-4 mr-2" />
                {uploading ? 'Uploading...' : 'Upload Image'}
              </Button>
              <p className="text-sm text-muted-foreground mt-2">
                PNG, JPG, GIF up to 10MB
              </p>
            </div>
          </div>
        )}
      </div>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      <Input
        ref={fileInputRef}
        id="image-upload"
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  )
}