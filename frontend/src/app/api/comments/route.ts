import { NextRequest, NextResponse } from 'next/server'
import { getUser } from '@/lib/auth'
import { commentsApi } from '@/lib/api'

export async function POST(request: NextRequest) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { content, blogPost, parentComment } = body

    if (!content || !blogPost) {
      return NextResponse.json(
        { error: 'Content and blogPost are required' },
        { status: 400 }
      )
    }

    const comment = await commentsApi.create({
      content,
      blogPost,
      parentComment,
    })

    return NextResponse.json(comment)
  } catch (error: any) {
    console.error('Error creating comment:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create comment' },
      { status: 500 }
    )
  }
}