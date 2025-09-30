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

    const result = await blogPostsApi.createDraft(body)
    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Error creating draft:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create draft' },
      { status: 500 }
    )
  }
}