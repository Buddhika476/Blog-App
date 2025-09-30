'use client'

import { useState, useTransition, useOptimistic, useEffect } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LikeButton } from './like-button'
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

interface ReplyFormState {
  [commentId: string]: boolean
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
  const [showReplyForm, setShowReplyForm] = useState<ReplyFormState>({})
  const [replyContents, setReplyContents] = useState<{ [commentId: string]: string }>({})

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

  const handleSubmitReply = async (parentCommentId: string) => {
    const content = replyContents[parentCommentId]
    if (!content?.trim()) return

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
            parentComment: parentCommentId,
          }),
        })

        if (response.ok) {
          const newReply = await response.json()
          setComments(prev => {
            return prev.map(comment => {
              if (comment._id === parentCommentId) {
                return {
                  ...comment,
                  replies: [...(comment.replies || []), newReply]
                }
              }
              return comment
            })
          })
          setReplyContents(prev => ({ ...prev, [parentCommentId]: '' }))
          setShowReplyForm(prev => ({ ...prev, [parentCommentId]: false }))
        }
      } catch (error) {
        console.error('Failed to post reply:', error)
      }
    })
  }

  const toggleReplyForm = (commentId: string) => {
    setShowReplyForm(prev => ({
      ...prev,
      [commentId]: !prev[commentId]
    }))
  }

  const handleReplyChange = (commentId: string, content: string) => {
    setReplyContents(prev => ({
      ...prev,
      [commentId]: content
    }))
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
          <div key={comment._id}>
            <Card className={comment.optimistic ? 'opacity-60' : ''}>
              <CardContent className="pt-6">
                <div className="flex items-start space-x-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="font-medium">
                        {comment.author.firstName} {comment.author.lastName}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {new Date(comment.createdAt).toLocaleDateString()}
                      </span>
                      {comment.optimistic && (
                        <span className="text-xs text-muted-foreground">(posting...)</span>
                      )}
                    </div>
                    <p className="text-gray-700">{comment.content}</p>
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
                            onClick={() => toggleReplyForm(comment._id)}
                          >
                            Reply
                          </Button>
                        )}
                      </div>
                    )}

                    {/* Reply Form */}
                    {showReplyForm[comment._id] && user && (
                      <div className="mt-4 pl-4 border-l-2 border-gray-200">
                        <div className="space-y-3">
                          <textarea
                            value={replyContents[comment._id] || ''}
                            onChange={(e) => handleReplyChange(comment._id, e.target.value)}
                            className="w-full p-3 border rounded-lg resize-none"
                            rows={3}
                            placeholder="Write a reply..."
                          />
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              onClick={() => handleSubmitReply(comment._id)}
                              disabled={isPending || !replyContents[comment._id]?.trim()}
                            >
                              {isPending ? 'Posting...' : 'Post Reply'}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => toggleReplyForm(comment._id)}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Replies */}
                    {comment.replies && comment.replies.length > 0 && (
                      <div className="mt-4 pl-4 border-l-2 border-gray-200 space-y-3">
                        {comment.replies.map((reply) => (
                          <Card key={reply._id} className="bg-gray-50">
                            <CardContent className="pt-4">
                              <div className="flex items-start space-x-3">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2 mb-2">
                                    <span className="font-medium text-sm">
                                      {reply.author.firstName} {reply.author.lastName}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                      {new Date(reply.createdAt).toLocaleDateString()}
                                    </span>
                                  </div>
                                  <p className="text-gray-700 text-sm">{reply.content}</p>
                                  <div className="flex items-center space-x-3 mt-2">
                                    {user && (
                                      <LikeButton
                                        targetType="comment"
                                        targetId={reply._id}
                                        initialLiked={commentLikeStatuses[reply._id] || false}
                                        initialCount={reply.likesCount}
                                        isAuthenticated={!!user}
                                        variant="compact"
                                      />
                                    )}
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
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