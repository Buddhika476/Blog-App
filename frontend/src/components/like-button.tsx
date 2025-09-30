'use client';

import { Heart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLike } from '@/hooks/use-like';

interface LikeButtonProps {
  targetId: string;
  targetType: 'post' | 'comment';
  initialLiked?: boolean;
  initialCount?: number;
  isAuthenticated?: boolean;
  variant?: 'default' | 'compact';
  className?: string;
  showWhenNotAuthenticated?: boolean; // Show as read-only when not authenticated
}

export function LikeButton({
  targetId,
  targetType,
  initialLiked = false,
  initialCount = 0,
  isAuthenticated = false,
  variant = 'default',
  className,
  showWhenNotAuthenticated = true,
}: LikeButtonProps) {
  const { liked, count, isLoading, toggleLike } = useLike({
    targetId,
    targetType,
    initialLiked,
    initialCount,
    isAuthenticated,
  });

  const isCompact = variant === 'compact';

  // If not authenticated and shouldn't show, return null
  if (!isAuthenticated && !showWhenNotAuthenticated) {
    return null;
  }

  if (isCompact) {
    // Compact variant - matches the design of views/comments badges
    return (
      <button
        onClick={toggleLike}
        disabled={isLoading || !isAuthenticated}
        suppressHydrationWarning
        className={cn(
          'flex items-center space-x-2 px-3 py-1.5 rounded-full transition-all duration-200',
          liked
            ? 'bg-rose-100 dark:bg-rose-900/30 hover:bg-rose-200 dark:hover:bg-rose-900/50'
            : 'bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600',
          isLoading && 'opacity-70 cursor-wait',
          !isAuthenticated && 'cursor-default opacity-80',
          isAuthenticated && !isLoading && 'cursor-pointer',
          className
        )}
        aria-label={isAuthenticated ? (liked ? 'Unlike' : 'Like') : 'Login to like'}
        title={!isAuthenticated ? 'Login to like this post' : undefined}
      >
        <Heart
          className={cn(
            'h-3.5 w-3.5 transition-all duration-200',
            liked ? 'text-rose-500 fill-rose-500' : 'text-rose-500'
          )}
        />
        <span
          className={cn(
            'text-xs font-medium',
            liked ? 'text-rose-600 dark:text-rose-400' : 'text-slate-600 dark:text-slate-400'
          )}
        >
          {count}
        </span>
      </button>
    );
  }

  // Default variant - larger button style
  return (
    <button
      onClick={toggleLike}
      disabled={isLoading || !isAuthenticated}
      suppressHydrationWarning
      className={cn(
        'inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md font-medium transition-all duration-200',
        'hover:bg-slate-100 dark:hover:bg-slate-800',
        liked && 'text-rose-600 hover:text-rose-700',
        !liked && 'text-slate-600 dark:text-slate-400',
        isLoading && 'opacity-70 cursor-wait',
        !isAuthenticated && 'cursor-default opacity-80',
        isAuthenticated && !isLoading && 'cursor-pointer',
        className
      )}
      aria-label={isAuthenticated ? (liked ? 'Unlike' : 'Like') : 'Login to like'}
      title={!isAuthenticated ? 'Login to like this post' : undefined}
    >
      <Heart
        className={cn(
          'h-5 w-5 transition-all duration-200',
          liked && 'fill-current scale-110'
        )}
      />
      <span>{count}</span>
    </button>
  );
}