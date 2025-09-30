import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/auth';
import { likesApi } from '@/lib/api';

export async function GET(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ liked: false });
    }

    const { searchParams } = new URL(request.url);
    const targetType = searchParams.get('targetType');
    const targetId = searchParams.get('targetId');

    if (!targetType || !targetId) {
      return NextResponse.json({ error: 'Missing targetType or targetId' }, { status: 400 });
    }

    const apiTargetType = targetType === 'post' ? 'BlogPost' : 'Comment';
    const result = await likesApi.getStatus(apiTargetType as 'BlogPost' | 'Comment', targetId);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[Like Status API] Error:', error);
    return NextResponse.json({ liked: false });
  }
}