'use client'

import { useEffect, useRef } from 'react'
import 'quill/dist/quill.snow.css'

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
}

export function RichTextEditor({ value, onChange, placeholder = 'Write your post content here...', disabled = false }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const quillRef = useRef<any>(null)
  const isUpdatingRef = useRef(false)

  useEffect(() => {
    if (!editorRef.current) return

    // Dynamically import Quill to avoid SSR issues
    const initQuill = async () => {
      const Quill = (await import('quill')).default

      if (quillRef.current) return // Already initialized

      quillRef.current = new Quill(editorRef.current!, {
        theme: 'snow',
        placeholder,
        readOnly: disabled,
        modules: {
          toolbar: [
            [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
            [{ 'indent': '-1'}, { 'indent': '+1' }],
            ['blockquote', 'code-block'],
            ['link', 'image'],
            [{ 'align': [] }],
            [{ 'color': [] }, { 'background': [] }],
            ['clean']
          ]
        }
      })

      // Set initial value
      if (value) {
        quillRef.current.root.innerHTML = value
      }

      // Listen for text changes
      quillRef.current.on('text-change', () => {
        if (isUpdatingRef.current) return
        const html = quillRef.current.root.innerHTML
        onChange(html === '<p><br></p>' ? '' : html)
      })
    }

    initQuill()
  }, []) // Only run once on mount

  // Update content when value prop changes externally
  useEffect(() => {
    if (!quillRef.current) return

    const currentContent = quillRef.current.root.innerHTML
    const normalizedValue = value || '<p><br></p>'

    if (currentContent !== normalizedValue) {
      isUpdatingRef.current = true
      quillRef.current.root.innerHTML = normalizedValue
      isUpdatingRef.current = false
    }
  }, [value])

  // Update disabled state
  useEffect(() => {
    if (quillRef.current) {
      quillRef.current.enable(!disabled)
    }
  }, [disabled])

  return (
    <div className="rich-text-editor-wrapper">
      <div ref={editorRef} className="bg-background" />
    </div>
  )
}