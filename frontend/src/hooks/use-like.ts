'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface UseLikeProps {
  targetId: string;
  targetType: 'post' | 'comment';
  initialLiked?: boolean;
  initialCount?: number;
  isAuthenticated?: boolean;
}

interface LikeState {
  liked: boolean;
  count: number;
}

export function useLike({
  targetId,
  targetType,
  initialLiked = false,
  initialCount = 0,
  isAuthenticated = false,
}: UseLikeProps) {
  const router = useRouter();
  const [state, setState] = useState<LikeState>({
    liked: initialLiked,
    count: initialCount,
  });
  const [isLoading, setIsLoading] = useState(false);

  const toggleLike = useCallback(async () => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    // Optimistic update
    const newLiked = !state.liked;
    const newCount = state.count + (newLiked ? 1 : -1);
    const previousState = { ...state };

    setState({ liked: newLiked, count: newCount });
    setIsLoading(true);

    try {
      const response = await fetch('/api/likes/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetType,
          ...(targetType === 'post' ? { blogPost: targetId } : { comment: targetId }),
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          router.push('/login');
          return;
        }
        throw new Error('Failed to toggle like');
      }

      const data = await response.json();
      setState({ liked: data.liked, count: data.count });
    } catch (error) {
      console.error('[useLike] Error toggling like:', error);
      // Revert optimistic update on error
      setState(previousState);
    } finally {
      setIsLoading(false);
    }
  }, [targetId, targetType, state, isAuthenticated, router]);

  return {
    liked: state.liked,
    count: state.count,
    isLoading,
    toggleLike,
  };
}