import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/auth';
import { likesApi } from '@/lib/api';

export async function POST(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { targetType, blogPost, comment } = body;

    // Validate input
    if (!targetType || !['post', 'comment'].includes(targetType)) {
      return NextResponse.json({ error: 'Invalid targetType' }, { status: 400 });
    }

    const targetId = targetType === 'post' ? blogPost : comment;
    if (!targetId) {
      return NextResponse.json({ error: 'Target ID is required' }, { status: 400 });
    }

    // Call backend API
    const apiTargetType = targetType === 'post' ? 'BlogPost' : 'Comment';
    const result = await likesApi.toggle(apiTargetType as 'BlogPost' | 'Comment', targetId);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[Like Toggle API] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to toggle like' },
      { status: error.response?.status || 500 }
    );
  }
}