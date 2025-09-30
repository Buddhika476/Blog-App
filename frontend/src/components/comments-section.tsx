'use client'

import { useState, useTransition, useOptimistic, useEffect } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CommentItem } from './comment-item'
import { Comment, User } from '@/lib/types'
import Link from 'next/link'

interface CommentsSectionProps {
  blogPostId: string
  initialComments: Comment[]
  user: User | null
}

interface OptimisticComment extends Comment {
  optimistic?: boolean
}

export function CommentsSection({ blogPostId, initialComments, user }: CommentsSectionProps) {
  const [comments, setComments] = useState<Comment[]>(initialComments)
  const [commentLikeStatuses, setCommentLikeStatuses] = useState<{ [commentId: string]: boolean }>({})
  const [optimisticComments, addOptimisticComment] = useOptimistic<OptimisticComment[], string>(
    comments,
    (state, newComment) => [
      ...state,
      {
        _id: 'temp-' + Date.now(),
        content: newComment,
        author: user!,
        blogPost: blogPostId,
        likesCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        optimistic: true,
      },
    ]
  )
  const [isPending, startTransition] = useTransition()
  const [newComment, setNewComment] = useState('')

  // Fetch like statuses for all comments when user is available
  useEffect(() => {
    if (!user) return

    const fetchLikeStatuses = async () => {
      const allCommentIds = [
        ...optimisticComments.map(c => c._id),
        ...optimisticComments.flatMap(c => (c.replies || []).map(r => r._id))
      ].filter(id => !id.startsWith('temp-')) // Exclude optimistic comments

      const statuses: { [commentId: string]: boolean } = {}

      await Promise.all(
        allCommentIds.map(async (commentId) => {
          try {
            const response = await fetch(`/api/likes/status?targetType=comment&targetId=${commentId}`)
            if (response.ok) {
              const data = await response.json()
              statuses[commentId] = data.liked
            }
          } catch (error) {
            console.error('Failed to fetch like status for comment:', commentId, error)
            statuses[commentId] = false
          }
        })
      )

      setCommentLikeStatuses(statuses)
    }

    fetchLikeStatuses()
  }, [user, optimisticComments])

  const handleSubmitComment = async (formData: FormData) => {
    const content = formData.get('content') as string
    if (!content.trim()) return

    addOptimisticComment(content)
    setNewComment('')

    startTransition(async () => {
      try {
        const response = await fetch('/api/comments', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            content,
            blogPost: blogPostId,
          }),
        })

        if (response.ok) {
          const newCommentData = await response.json()
          setComments(prev => [...prev, newCommentData])
        }
      } catch (error) {
        console.error('Failed to post comment:', error)
      }
    })
  }

  const handleSubmitReply = async (parentCommentId: string, content: string) => {
    if (!content?.trim()) return

    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
          blogPost: blogPostId,
          parentComment: parentCommentId,
        }),
      })

      if (response.ok) {
        const newReply = await response.json()

        // Recursively update nested comments
        const updateCommentsRecursively = (comments: Comment[]): Comment[] => {
          return comments.map(comment => {
            if (comment._id === parentCommentId) {
              return {
                ...comment,
                replies: [...(comment.replies || []), newReply]
              }
            }
            if (comment.replies && comment.replies.length > 0) {
              return {
                ...comment,
                replies: updateCommentsRecursively(comment.replies)
              }
            }
            return comment
          })
        }

        setComments(prev => updateCommentsRecursively(prev))
      }
    } catch (error) {
      console.error('Failed to post reply:', error)
      throw error
    }
  }

  return (
    <section>
      <h2 className="text-2xl font-bold mb-6">
        Comments ({optimisticComments.length})
      </h2>

      {user ? (
        <Card className="mb-6">
          <CardHeader>
            <h3 className="text-lg font-semibold">Add a Comment</h3>
          </CardHeader>
          <CardContent>
            <form action={handleSubmitComment} className="space-y-4">
              <textarea
                name="content"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="w-full p-3 border rounded-lg resize-none"
                rows={4}
                placeholder="Share your thoughts..."
                required
              />
              <Button type="submit" disabled={isPending || !newComment.trim()}>
                {isPending ? 'Posting...' : 'Post Comment'}
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Card className="mb-6">
          <CardContent className="text-center py-6">
            <p className="text-muted-foreground mb-4">
              Please log in to leave a comment
            </p>
            <Link href="/login">
              <Button>Login</Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Comments List */}
      <div className="space-y-4">
        {optimisticComments.map((comment) => (
          <CommentItem
            key={comment._id}
            comment={comment}
            user={user}
            blogPostId={blogPostId}
            commentLikeStatuses={commentLikeStatuses}
            onReply={handleSubmitReply}
            isPending={isPending}
          />
        ))}

        {optimisticComments.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No comments yet. Be the first to comment!
          </div>
        )}
      </div>
    </section>
  )
}