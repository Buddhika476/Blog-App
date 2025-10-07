'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Heart, MessageCircle, Edit, Trash2, Calendar, RefreshCw, PenTool } from 'lucide-react';
import Link from 'next/link';
import { BlogPost } from '@/lib/types';
import { blogPostsApi } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { getImageUrl } from '@/lib/utils';
import { useToast } from '@/components/toast-container';

interface DashboardPostCardProps {
  post: BlogPost;
  onDelete: (postId: string) => Promise<void>;
}

export function DashboardPostCard({ post, onDelete }: DashboardPostCardProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [currentPost, setCurrentPost] = useState(post);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

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

  const handleDeleteClick = () => {
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    setShowDeleteModal(false);
    setIsDeleting(true);
    try {
      await onDelete(post._id);
      showToast('Post deleted successfully', 'success');
      router.refresh();
    } catch (error: any) {
      console.error('Failed to delete post:', error);
      showToast(error?.message || 'Failed to delete post. Please try again.', 'error');
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
  };

  return (
    <Card className="h-full group hover:shadow-2xl transition-all duration-500 hover:scale-[1.03] bg-card backdrop-blur-xl border-border rounded-2xl overflow-hidden">
      <div className="relative overflow-hidden">
        {currentPost.featuredImage ? (
          <div className="relative h-52 overflow-hidden">
            <img
              src={getImageUrl(currentPost.featuredImage) || currentPost.featuredImage}
              alt={currentPost.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500" />
            <div className="absolute top-3 right-3">
              <Badge variant={currentPost.status === 'published' ? 'default' : 'secondary'}>
                {currentPost.status}
              </Badge>
            </div>
          </div>
        ) : (
          <div className="h-52 bg-muted flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 via-transparent to-indigo-500/10"></div>
            <PenTool className="h-16 w-16 text-muted-foreground relative z-10" />
            <div className="absolute top-3 right-3">
              <Badge variant={currentPost.status === 'published' ? 'default' : 'secondary'}>
                {currentPost.status}
              </Badge>
            </div>
          </div>
        )}
      </div>

      <CardHeader className="pb-4 pt-6">
        <CardTitle className="line-clamp-2 text-xl font-bold leading-tight text-card-foreground">
          <Link href={`/blog/${currentPost._id}`} className="hover:text-primary transition-colors duration-300">
            {currentPost.title}
          </Link>
        </CardTitle>
        <p className="text-muted-foreground line-clamp-2 leading-relaxed mt-2 text-sm">
          {currentPost.excerpt}
        </p>
      </CardHeader>

      <CardContent className="pt-0 pb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-1 text-xs text-muted-foreground">
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
            <div className="flex items-center space-x-2 px-3 py-1.5 bg-muted rounded-full">
              <Eye className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground">{currentPost.views}</span>
            </div>
            <div className="flex items-center space-x-2 px-3 py-1.5 bg-muted rounded-full">
              <Heart className="h-3.5 w-3.5 text-rose-500" />
              <span className="text-xs font-medium text-muted-foreground">{currentPost.likesCount}</span>
            </div>
            <div className="flex items-center space-x-2 px-3 py-1.5 bg-muted rounded-full">
              <MessageCircle className="h-3.5 w-3.5 text-emerald-500" />
              <span className="text-xs font-medium text-muted-foreground">{currentPost.commentsCount}</span>
            </div>
          </div>
        </div>

        {currentPost.tags && currentPost.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {currentPost.tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 bg-gradient-to-r from-violet-500 to-indigo-500 text-white rounded-full text-xs font-medium shadow-sm"
              >
                {tag}
              </span>
            ))}
            {currentPost.tags.length > 2 && (
              <span className="px-2 py-1 bg-muted text-muted-foreground rounded-full text-xs">
                +{currentPost.tags.length - 2}
              </span>
            )}
          </div>
        )}

        <div className="flex items-center gap-2 pt-4 border-t border-border">
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
            onClick={handleDeleteClick}
            disabled={isDeleting}
            className="flex-1 text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Delete
          </Button>
        </div>
      </CardContent>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <>
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-in fade-in duration-200"
            onClick={handleDeleteCancel}
          />
          <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md animate-in zoom-in-95 duration-200">
            <div className="bg-card border border-border rounded-2xl shadow-2xl p-6 m-4">
              <div className="flex items-start gap-4 mb-6">
                <div className="flex-shrink-0 w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center">
                  <Trash2 className="h-6 w-6 text-destructive" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-card-foreground mb-2">
                    Delete Post
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Are you sure you want to delete "<span className="font-semibold text-card-foreground">{currentPost.title}</span>"? This action cannot be undone.
                  </p>
                </div>
              </div>
              <div className="flex gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={handleDeleteCancel}
                  disabled={isDeleting}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteConfirm}
                  disabled={isDeleting}
                  className="bg-destructive hover:bg-destructive/90"
                >
                  {isDeleting ? 'Deleting...' : 'Delete Post'}
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </Card>
  );
}