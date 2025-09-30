'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LikeButton } from './like-button'
import { Comment, User } from '@/lib/types'

interface CommentItemProps {
  comment: Comment
  user: User | null
  blogPostId: string
  commentLikeStatuses: { [commentId: string]: boolean }
  onReply: (parentId: string, content: string) => Promise<void>
  isPending: boolean
  depth?: number
}

export function CommentItem({
  comment,
  user,
  blogPostId,
  commentLikeStatuses,
  onReply,
  isPending,
  depth = 0
}: CommentItemProps) {
  const [showReplyForm, setShowReplyForm] = useState(false)
  const [replyContent, setReplyContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmitReply = async () => {
    if (!replyContent.trim()) return

    setIsSubmitting(true)
    try {
      await onReply(comment._id, replyContent)
      setReplyContent('')
      setShowReplyForm(false)
    } catch (error) {
      console.error('Failed to post reply:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Calculate padding based on depth
  const paddingClass = depth > 0 ? `pl-${Math.min(depth * 4, 16)} border-l-2 border-border` : ''

  return (
    <div className={`${paddingClass} ${depth > 0 ? 'mt-4' : ''}`}>
      <Card className={`${comment.optimistic ? 'opacity-60' : ''} ${depth > 0 ? 'bg-muted/30' : ''}`}>
        <CardContent className="pt-6">
          <div className="flex items-start space-x-4">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <span className="font-medium text-foreground">
                  {comment.author.firstName} {comment.author.lastName}
                </span>
                <span className="text-sm text-muted-foreground">
                  {new Date(comment.createdAt).toLocaleDateString()}
                </span>
                {comment.optimistic && (
                  <span className="text-xs text-muted-foreground">(posting...)</span>
                )}
              </div>
              <p className="text-foreground">{comment.content}</p>
              {!comment.optimistic && (
                <div className="flex items-center space-x-4 mt-2">
                  {user && (
                    <LikeButton
                      targetType="comment"
                      targetId={comment._id}
                      initialLiked={commentLikeStatuses[comment._id] || false}
                      initialCount={comment.likesCount}
                      isAuthenticated={!!user}
                      variant="compact"
                    />
                  )}
                  {user && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowReplyForm(!showReplyForm)}
                    >
                      {showReplyForm ? 'Cancel' : 'Reply'}
                    </Button>
                  )}
                </div>
              )}

              {/* Reply Form */}
              {showReplyForm && user && (
                <div className="mt-4 space-y-3">
                  <textarea
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    className="w-full p-3 border border-border rounded-lg resize-none bg-background text-foreground"
                    rows={3}
                    placeholder="Write a reply..."
                  />
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      onClick={handleSubmitReply}
                      disabled={isSubmitting || !replyContent.trim()}
                    >
                      {isSubmitting ? 'Posting...' : 'Post Reply'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setShowReplyForm(false)
                        setReplyContent('')
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Render nested replies recursively */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-2">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply._id}
              comment={reply}
              user={user}
              blogPostId={blogPostId}
              commentLikeStatuses={commentLikeStatuses}
              onReply={onReply}
              isPending={isPending}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}