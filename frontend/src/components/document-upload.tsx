'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Upload, X, FileText, Download } from 'lucide-react'

interface DocumentUploadProps {
  onDocumentUploaded?: (file: File, url: string, filename: string) => void
  currentDocuments?: Array<{ file?: File; url: string; filename: string }>
  label?: string
  className?: string
  multiple?: boolean
}

export function DocumentUpload({
  onDocumentUploaded,
  currentDocuments = [],
  label = "Document Attachments",
  className = "",
  multiple = true
}: DocumentUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [documents, setDocuments] = useState<Array<{ file?: File; url: string; filename: string }>>(currentDocuments)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    if (files.length === 0) return

    setError(null)
    setUploading(true)

    try {
      for (const file of files) {
        // Validate file type
        const allowedTypes = [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ]

        if (!allowedTypes.includes(file.type)) {
          setError('Please select PDF or Word documents only')
          continue
        }

        // Validate file size (10MB)
        if (file.size > 10 * 1024 * 1024) {
          setError('Document size must be less than 10MB')
          continue
        }

        // Upload to server
        const formData = new FormData()
        formData.append('file', file)

        const response = await fetch('/api/uploads/document', {
          method: 'POST',
          body: formData,
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to upload document')
        }

        const data = await response.json()
        const documentData = {
          file: file,
          url: data.file?.url || data.url,
          filename: data.file?.originalName || data.filename || file.name
        }

        setDocuments(prev => [...prev, documentData])

        if (onDocumentUploaded) {
          onDocumentUploaded(file, documentData.url, documentData.filename)
        }
      }
    } catch (error: any) {
      console.error('Error uploading document:', error)
      const errorMessage = error.message || 'Failed to upload document'
      setError(errorMessage)
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleRemove = (indexToRemove: number) => {
    const newDocuments = documents.filter((_, index) => index !== indexToRemove)
    setDocuments(newDocuments)
    setError(null)
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <Label htmlFor="document-upload">{label}</Label>

      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
        <div className="space-y-4">
          <FileText className="h-12 w-12 mx-auto text-gray-400" />
          <div>
            <Button
              type="button"
              variant="outline"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-4 w-4 mr-2" />
              {uploading ? 'Uploading...' : 'Upload Documents'}
            </Button>
            <p className="text-sm text-muted-foreground mt-2">
              PDF, DOC, DOCX up to 10MB each
            </p>
          </div>
        </div>
      </div>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      {/* Document List */}
      {documents.length > 0 && (
        <div className="space-y-2">
          <Label>Attached Documents ({documents.length})</Label>
          <div className="space-y-2">
            {documents.map((doc, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
                <div className="flex items-center space-x-3">
                  <FileText className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="text-sm font-medium truncate max-w-xs">
                      {doc.filename}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
                      const fullUrl = doc.url.startsWith('http') ? doc.url : `${API_BASE_URL}${doc.url}`
                      window.open(fullUrl, '_blank')
                    }}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemove(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <Input
        ref={fileInputRef}
        id="document-upload"
        type="file"
        accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        onChange={handleFileSelect}
        className="hidden"
        multiple={multiple}
      />
    </div>
  )
}