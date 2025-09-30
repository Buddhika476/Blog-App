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
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="flex items-center space-x-2 mb-2">
              <Link
                href={`/blog/${currentPost._id}`}
                className="hover:text-primary"
              >
                {currentPost.title}
              </Link>
              <Badge
                variant={currentPost.status === 'published' ? 'default' : 'secondary'}
              >
                {currentPost.status}
              </Badge>
            </CardTitle>
            <p className="text-muted-foreground line-clamp-2">
              {currentPost.excerpt}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
            <Link href={`/edit/${currentPost._id}`}>
              <Button variant="outline" size="sm">
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDelete}
              disabled={isDeleting}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <Calendar className="h-4 w-4" />
              <span>
                {currentPost.status === 'published'
                  ? `Published ${new Date(currentPost.publishedAt!).toLocaleDateString()}`
                  : `Created ${new Date(currentPost.createdAt).toLocaleDateString()}`
                }
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <Eye className="h-4 w-4" />
              <span>{currentPost.views}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Heart className="h-4 w-4 text-rose-500" />
              <span className="font-medium">{currentPost.likesCount}</span>
            </div>
            <div className="flex items-center space-x-1">
              <MessageCircle className="h-4 w-4" />
              <span>{currentPost.commentsCount}</span>
            </div>
          </div>
        </div>

        {currentPost.tags && currentPost.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {currentPost.tags.map((tag) => (
              <Badge key={tag} variant="outline">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}