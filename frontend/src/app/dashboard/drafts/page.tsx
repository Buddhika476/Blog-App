import { requireAuth } from '@/lib/auth'
import { blogPostsApi } from '@/lib/api'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Edit, Trash2, Calendar, Plus, Eye } from 'lucide-react'
import Link from 'next/link'

async function getUserDrafts() {
  try {
    const response = await blogPostsApi.getDrafts(1, 50)
    return response.drafts || []
  } catch (error) {
    console.error('Failed to fetch user drafts:', error)
    return []
  }
}

async function deleteDraft(formData: FormData) {
  'use server'

  const user = await requireAuth()
  const draftId = formData.get('draftId') as string

  try {
    await blogPostsApi.delete(draftId)
  } catch (error: any) {
    throw new Error(error?.response?.data?.message || 'Failed to delete draft')
  }

  // Redirect to refresh the page
  redirect('/dashboard/drafts')
}

export default async function DraftsPage() {
  const user = await requireAuth()
  const drafts = await getUserDrafts()

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">My Drafts</h1>
          <p className="text-muted-foreground">
            Continue working on your unpublished posts
          </p>
        </div>
        <Link href="/create">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Draft
          </Button>
        </Link>
      </div>

      {drafts.length > 0 ? (
        <div className="space-y-4">
          {drafts.map((draft) => (
            <Card key={draft._id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center space-x-2 mb-2">
                      <span className="line-clamp-1">{draft.title}</span>
                      <Badge variant="secondary">
                        {draft.status}
                      </Badge>
                    </CardTitle>
                    <p className="text-muted-foreground line-clamp-2">
                      {draft.excerpt}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Link href={`/blog/${draft._id}`}>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4 mr-1" />
                        Preview
                      </Button>
                    </Link>
                    <Link href={`/edit/${draft._id}`}>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4 mr-1" />
                        Continue
                      </Button>
                    </Link>
                    <form action={deleteDraft} className="inline">
                      <input type="hidden" name="draftId" value={draft._id} />
                      <Button
                        variant="outline"
                        size="sm"
                        type="submit"
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </form>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-4 w-4" />
                      <span>
                        Last edited {new Date(draft.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {draft.scheduledPublishAt && (
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-4 w-4" />
                      <span>
                        Scheduled for {new Date(draft.scheduledPublishAt).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>

                {draft.tags && draft.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {draft.tags.map((tag) => (
                      <Badge key={tag} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">You don't have any drafts yet.</p>
          <Link href="/create">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Draft
            </Button>
          </Link>
        </div>
      )}
    </div>
  )
}