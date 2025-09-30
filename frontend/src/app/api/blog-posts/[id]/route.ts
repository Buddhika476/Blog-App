import { NextRequest, NextResponse } from 'next/server'
import { getUser } from '@/lib/auth'
import { blogPostsApi } from '@/lib/api'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { title, content, excerpt, tags, status, featuredImage } = body

    if (!title || !content || !excerpt) {
      return NextResponse.json(
        { error: 'Title, content, and excerpt are required' },
        { status: 400 }
      )
    }

    const updateData = {
      title,
      content,
      excerpt,
      tags,
      status,
      ...(featuredImage && { featuredImage })
    }

    const result = await blogPostsApi.update(id, updateData)
    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Error updating blog post:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update blog post' },
      { status: 500 }
    )
  }
}