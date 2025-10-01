'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Heart, MessageCircle, Edit, Trash2, Calendar, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { BlogPost } from '@/lib/types';
import { blogPostsApi } from '@/lib/api';
import { useRouter } from 'next/navigation';

interface DashboardPostCardProps {
  post: BlogPost;
  onDelete: (postId: string) => Promise<void>;
}

export function DashboardPostCard({ post, onDelete }: DashboardPostCardProps) {
  const router = useRouter();
  const [currentPost, setCurrentPost] = useState(post);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const updatedPost = await blogPostsApi.getById(post._id);
      setCurrentPost(updatedPost);
    } catch (error) {
      console.error('Failed to refresh post:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this post?')) {
      return;
    }

    setIsDeleting(true);
    try {
      await onDelete(post._id);
      router.refresh();
    } catch (error) {
      console.error('Failed to delete post:', error);
      alert('Failed to delete post. Please try again.');
      setIsDeleting(false);
    }
  };

  return (
    <Card className="h-full group hover:shadow-2xl transition-all duration-500 hover:scale-[1.03] bg-slate-50 dark:bg-slate-800/80 backdrop-blur-xl border-slate-200/50 dark:border-slate-700/50 rounded-2xl overflow-hidden">
      <div className="relative">
        {currentPost.featuredImage ? (
          <div className="relative h-52 overflow-hidden">
            <img
              src={currentPost.featuredImage}
              alt={currentPost.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
            <div className="absolute top-3 right-3">
              <Badge variant={currentPost.status === 'published' ? 'default' : 'secondary'}>
                {currentPost.status}
              </Badge>
            </div>
          </div>
        ) : (
          <div className="h-52 bg-gradient-to-br from-slate-100 via-slate-50 to-slate-100 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800 flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-100/20 via-transparent to-indigo-100/20 dark:from-violet-900/10 dark:to-indigo-900/10"></div>
            <MessageCircle className="h-16 w-16 text-slate-400 dark:text-slate-500 relative z-10" />
            <div className="absolute top-3 right-3">
              <Badge variant={currentPost.status === 'published' ? 'default' : 'secondary'}>
                {currentPost.status}
              </Badge>
            </div>
          </div>
        )}
      </div>

      <CardHeader className="pb-4 pt-6">
        <CardTitle className="line-clamp-2 text-xl font-bold leading-tight">
          <Link href={`/blog/${currentPost._id}`} className="hover:text-violet-600 dark:hover:text-violet-400 transition-colors duration-300">
            {currentPost.title}
          </Link>
        </CardTitle>
        <p className="text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed mt-2 text-sm">
          {currentPost.excerpt}
        </p>
      </CardHeader>

      <CardContent className="pt-0 pb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-1 text-xs text-slate-500 dark:text-slate-400">
            <Calendar className="h-3 w-3" />
            <span>
              {currentPost.status === 'published'
                ? new Date(currentPost.publishedAt!).toLocaleDateString()
                : new Date(currentPost.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-700 rounded-full">
              <Eye className="h-3.5 w-3.5 text-slate-600 dark:text-slate-400" />
              <span className="text-xs font-medium text-slate-600 dark:text-slate-400">{currentPost.views}</span>
            </div>
            <div className="flex items-center space-x-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-700 rounded-full">
              <Heart className="h-3.5 w-3.5 text-rose-500" />
              <span className="text-xs font-medium text-slate-600 dark:text-slate-400">{currentPost.likesCount}</span>
            </div>
            <div className="flex items-center space-x-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-700 rounded-full">
              <MessageCircle className="h-3.5 w-3.5 text-emerald-500" />
              <span className="text-xs font-medium text-slate-600 dark:text-slate-400">{currentPost.commentsCount}</span>
            </div>
          </div>
        </div>

        {currentPost.tags && currentPost.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {currentPost.tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 bg-gradient-to-r from-violet-100 to-indigo-100 dark:from-violet-900/30 dark:to-indigo-900/30 text-violet-700 dark:text-violet-300 rounded-full text-xs font-medium"
              >
                {tag}
              </span>
            ))}
            {currentPost.tags.length > 2 && (
              <span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 rounded-full text-xs">
                +{currentPost.tags.length - 2}
              </span>
            )}
          </div>
        )}

        <div className="flex items-center gap-2 pt-4 border-t border-slate-200 dark:border-slate-700">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex-1"
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Link href={`/edit/${currentPost._id}`} className="flex-1">
            <Button variant="outline" size="sm" className="w-full">
              <Edit className="h-4 w-4 mr-1" />
              Edit
            </Button>
          </Link>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDelete}
            disabled={isDeleting}
            className="flex-1 text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}