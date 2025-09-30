import { NextRequest, NextResponse } from 'next/server'
import { getUser } from '@/lib/auth'
import { blogPostsApi } from '@/lib/api'

export async function POST(request: NextRequest) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { title, content, excerpt, tags, status, featuredImage } = body

    if (!title || !content || !excerpt) {
      return NextResponse.json(
        { error: 'Title, content, and excerpt are required' },
        { status: 400 }
      )
    }

    const postData = {
      title,
      content,
      excerpt,
      tags,
      status,
      ...(featuredImage && { featuredImage })
    }

    let result
    if (status === 'draft') {
      result = await blogPostsApi.createDraft(postData)
    } else {
      result = await blogPostsApi.create(postData)
    }

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Error creating blog post:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create blog post' },
      { status: 500 }
    )
  }
}