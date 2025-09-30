import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('query') || ''
    const tags = searchParams.getAll('tags')
    const page = searchParams.get('page') || '1'
    const limit = searchParams.get('limit') || '10'

    const params = new URLSearchParams()
    if (query) params.append('query', query)
    tags.forEach(tag => params.append('tags', tag))
    params.append('page', page)
    params.append('limit', limit)

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/blog-posts/search?${params.toString()}`,
      {
        cache: 'no-store',
      }
    )

    if (!response.ok) {
      throw new Error('Failed to search posts')
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json(
      { error: 'Failed to search posts' },
      { status: 500 }
    )
  }
}