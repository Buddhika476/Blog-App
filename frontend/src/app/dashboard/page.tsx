import { requireAuth } from '@/lib/auth'
import { blogPostsApi } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PenTool, FileText, Eye, Heart, MessageCircle, Plus } from 'lucide-react'
import Link from 'next/link'

async function getUserPosts(page = 1) {
  try {
    const response = await blogPostsApi.getMyPosts(page, 10)
    // Filter to only show published posts in dashboard stats
    const publishedPosts = (response.posts || []).filter(post => post.status === 'published')
    return publishedPosts
  } catch (error) {
    console.error('Failed to fetch user posts:', error)
    return []
  }
}

async function getUserDrafts(page = 1) {
  try {
    const response = await blogPostsApi.getDrafts(page, 10)
    return response.drafts || []
  } catch (error) {
    console.error('Failed to fetch user drafts:', error)
    return []
  }
}

export default async function DashboardPage() {
  const user = await requireAuth()
  const posts = await getUserPosts()
  const drafts = await getUserDrafts()

  const totalViews = posts.reduce((sum, post) => sum + post.views, 0)
  const totalLikes = posts.reduce((sum, post) => sum + post.likesCount, 0)
  const totalComments = posts.reduce((sum, post) => sum + post.commentsCount, 0)

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          Welcome back, {user.firstName}!
        </h1>
        <p className="text-muted-foreground">
          Manage your blog posts and track your performance
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <Card className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 border-slate-200/50 dark:border-slate-700/50 shadow-xl backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-slate-700 dark:text-slate-300">Total Posts</CardTitle>
            <div className="p-3 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-xl shadow-lg">
              <FileText className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-1">{posts.length}</div>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Published articles
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 border-slate-200/50 dark:border-slate-700/50 shadow-xl backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-slate-700 dark:text-slate-300">Total Views</CardTitle>
            <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-lg">
              <Eye className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-1">{totalViews.toLocaleString()}</div>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Article views
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 border-slate-200/50 dark:border-slate-700/50 shadow-xl backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-slate-700 dark:text-slate-300">Total Likes</CardTitle>
            <div className="p-3 bg-gradient-to-br from-rose-500 to-pink-600 rounded-xl shadow-lg">
              <Heart className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-1">{totalLikes.toLocaleString()}</div>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Post reactions
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 border-slate-200/50 dark:border-slate-700/50 shadow-xl backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-slate-700 dark:text-slate-300">Total Comments</CardTitle>
            <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl shadow-lg">
              <MessageCircle className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-1">{totalComments.toLocaleString()}</div>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Discussions started
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-6 text-foreground">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Link href="/create" className="group">
            <Card className="transition-all duration-500 hover:shadow-2xl hover:scale-[1.05] cursor-pointer bg-card border-border">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-xl group-hover:shadow-violet-500/25 transition-all duration-500 group-hover:scale-110">
                  <PenTool className="h-8 w-8 text-white" />
                </div>
                <h3 className="font-bold mb-2 text-foreground text-lg">Write New Post</h3>
                <p className="text-sm text-muted-foreground">Create a new blog post</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/dashboard/posts" className="group">
            <Card className="transition-all duration-500 hover:shadow-2xl hover:scale-[1.05] cursor-pointer bg-card border-border">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-xl group-hover:shadow-emerald-500/25 transition-all duration-500 group-hover:scale-110">
                  <FileText className="h-8 w-8 text-white" />
                </div>
                <h3 className="font-bold mb-2 text-foreground text-lg">Manage Posts</h3>
                <p className="text-sm text-muted-foreground">Edit and delete posts</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/dashboard/drafts" className="group">
            <Card className="transition-all duration-500 hover:shadow-2xl hover:scale-[1.05] cursor-pointer bg-card border-border">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-xl group-hover:shadow-amber-500/25 transition-all duration-500 group-hover:scale-110">
                  <Plus className="h-8 w-8 text-white" />
                </div>
                <h3 className="font-bold mb-2 text-foreground text-lg">View Drafts</h3>
                <p className="text-sm text-muted-foreground">Continue writing drafts</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/blog" className="group">
            <Card className="transition-all duration-500 hover:shadow-2xl hover:scale-[1.05] cursor-pointer bg-card border-border">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-rose-500 to-pink-600 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-xl group-hover:shadow-rose-500/25 transition-all duration-500 group-hover:scale-110">
                  <Eye className="h-8 w-8 text-white" />
                </div>
                <h3 className="font-bold mb-2 text-foreground text-lg">View All Posts</h3>
                <p className="text-sm text-muted-foreground">Browse published posts</p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        {/* Recent Posts */}
        <Card className="shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-500/5 to-indigo-500/5">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  <span>Recent Posts</span>
                </CardTitle>
                <CardDescription>Your latest published posts</CardDescription>
              </div>
              <Link href="/dashboard/posts">
                <Button variant="outline" size="sm" className="hover:bg-blue-50">View All</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {posts.length > 0 ? (
              <div className="space-y-4">
                {posts.slice(0, 5).map((post) => (
                  <div key={post._id} className="group p-4 border rounded-lg hover:shadow-md transition-all hover:border-blue-200">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <Link href={`/blog/${post._id}`} className="group-hover:text-blue-600 transition-colors">
                          <h3 className="font-medium line-clamp-1 mb-1">{post.title}</h3>
                        </Link>
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                          {post.excerpt}
                        </p>
                        <div className="flex items-center text-xs text-muted-foreground space-x-4">
                          <span>{new Date(post.publishedAt || post.createdAt).toLocaleDateString()}</span>
                          <div className="flex items-center space-x-3">
                            <div className="flex items-center space-x-1">
                              <Eye className="h-3 w-3" />
                              <span>{post.views}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Heart className="h-3 w-3" />
                              <span>{post.likesCount}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <MessageCircle className="h-3 w-3" />
                              <span>{post.commentsCount}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-blue-500/20 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <FileText className="h-8 w-8 text-blue-600" />
                </div>
                <p className="text-muted-foreground mb-4">You haven't published any posts yet.</p>
                <Link href="/create">
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Post
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Drafts */}
        <Card className="shadow-lg">
          <CardHeader className="bg-gradient-to-r from-orange-500/5 to-yellow-500/5">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center space-x-2">
                  <PenTool className="h-5 w-5 text-orange-600" />
                  <span>Drafts ({drafts.length})</span>
                </CardTitle>
                <CardDescription>Posts you're working on</CardDescription>
              </div>
              <Link href="/dashboard/drafts">
                <Button variant="outline" size="sm" className="hover:bg-orange-50">View All</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {drafts.length > 0 ? (
              <div className="space-y-4">
                {drafts.slice(0, 5).map((draft) => (
                  <div key={draft._id} className="group p-4 border rounded-lg hover:shadow-md transition-all hover:border-orange-200">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium line-clamp-1 mb-1 group-hover:text-orange-600 transition-colors">{draft.title}</h3>
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                          {draft.excerpt}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">
                            Last edited {new Date(draft.updatedAt).toLocaleDateString()}
                          </span>
                          <Link href={`/edit/${draft._id}`}>
                            <Button variant="ghost" size="sm" className="text-orange-600 hover:bg-orange-50">
                              Continue
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-orange-500/20 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <PenTool className="h-8 w-8 text-orange-600" />
                </div>
                <p className="text-muted-foreground mb-4">No drafts saved.</p>
                <Link href="/create">
                  <Button variant="outline" className="border-orange-200 text-orange-600 hover:bg-orange-50">
                    <Plus className="h-4 w-4 mr-2" />
                    Start Writing
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}