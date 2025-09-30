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
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Only image files are allowed' }, { status: 400 })
    }

    const result = await blogPostsApi.uploadFeaturedImage(id, file)
    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Error uploading featured image:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to upload featured image' },
      { status: 500 }
    )
  }
}