import { NextRequest, NextResponse } from 'next/server'
import { getUser } from '@/lib/auth'
import { blogPostsApi } from '@/lib/api'

export async function POST(
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
    const { scheduledPublishAt } = body

    const result = await blogPostsApi.publishDraft(id, { scheduledPublishAt })
    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Error publishing draft:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to publish draft' },
      { status: 500 }
    )
  }
}