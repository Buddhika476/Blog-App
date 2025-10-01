'use client'

import { useState, useEffect, use, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { BlogPost } from '@/lib/types'
import Link from 'next/link'
import { Search, X, Eye, Heart, MessageCircle, Calendar, User as UserIcon } from 'lucide-react'
import { getImageUrl } from '@/lib/utils'

export default function SearchPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SearchContent />
    </Suspense>
  )
}

function SearchContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [query, setQuery] = useState(searchParams.get('q') || '')
  const [selectedTags, setSelectedTags] = useState<string[]>(
    searchParams.get('tags')?.split(',').filter(Boolean) || []
  )
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [allTags, setAllTags] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [total, setTotal] = useState(0)

  // Fetch all tags for filter
  useEffect(() => {
    const fetchTags = async () => {
      try {
        const response = await fetch('/api/blog-posts?status=published&limit=1000')
        if (response.ok) {
          const data = await response.json()
          const tags = new Set<string>()
          data.posts.forEach((post: BlogPost) => {
            post.tags?.forEach((tag: string) => tags.add(tag))
          })
          setAllTags(Array.from(tags).sort())
        }
      } catch (error) {
        console.error('Failed to fetch tags:', error)
      }
    }
    fetchTags()
  }, [])

  // Perform search
  useEffect(() => {
    const performSearch = async () => {
      setIsLoading(true)
      try {
        const params = new URLSearchParams()
        if (query) params.append('query', query)
        if (selectedTags.length > 0) {
          selectedTags.forEach(tag => params.append('tags', tag))
        }
        params.append('limit', '50')

        const response = await fetch(`/api/blog-posts/search?${params.toString()}`)
        if (response.ok) {
          const data = await response.json()
          setPosts(data.posts || [])
          setTotal(data.total || 0)
        }
      } catch (error) {
        console.error('Search failed:', error)
      } finally {
        setIsLoading(false)
      }
    }

    performSearch()
  }, [query, selectedTags])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    updateURL()
  }

  const updateURL = () => {
    const params = new URLSearchParams()
    if (query) params.set('q', query)
    if (selectedTags.length > 0) params.set('tags', selectedTags.join(','))
    router.push(`/search?${params.toString()}`)
  }

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    )
  }

  const clearFilters = () => {
    setQuery('')
    setSelectedTags([])
    router.push('/search')
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-foreground">Search Posts</h1>

        {/* Search Bar */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search by title, content, or tags..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button type="submit">Search</Button>
              {(query || selectedTags.length > 0) && (
                <Button type="button" variant="outline" onClick={clearFilters}>
                  Clear
                </Button>
              )}
            </form>
          </CardContent>
        </Card>

        {/* Filter by Tags */}
        {allTags.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Filter by Tags</span>
                {selectedTags.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedTags([])}
                  >
                    Clear
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {allTags.map((tag) => (
                  <Badge
                    key={tag}
                    variant={selectedTags.includes(tag) ? 'default' : 'outline'}
                    className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                    onClick={() => toggleTag(tag)}
                  >
                    {tag}
                    {selectedTags.includes(tag) && (
                      <X className="ml-1 h-3 w-3" />
                    )}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Results */}
        <div>
            <div className="mb-4 text-slate-700 dark:text-slate-300 font-medium">
              {isLoading ? (
                'Searching...'
              ) : (
                `Found ${total} result${total !== 1 ? 's' : ''}`
              )}
            </div>

            <div className="space-y-6">
              {posts.map((post) => (
                <Card key={post._id} className="hover:shadow-lg transition-shadow">
                  <div className="flex flex-col md:flex-row">
                    {post.featuredImage && (
                      <div className="md:w-48 h-48 overflow-hidden">
                        <img
                          src={getImageUrl(post.featuredImage) || post.featuredImage}
                          alt={post.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1">
                      <CardHeader>
                        <CardTitle className="text-xl">
                          <Link href={`/blog/${post._id}`} className="hover:text-primary transition-colors">
                            {post.title}
                          </Link>
                        </CardTitle>
                        <CardDescription className="line-clamp-2">
                          {post.excerpt}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-3">
                          <div className="flex items-center gap-1">
                            <UserIcon className="h-4 w-4" />
                            <span>{post.author.firstName} {post.author.lastName}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>{new Date(post.publishedAt || post.createdAt).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Eye className="h-4 w-4" />
                            <span>{post.views}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Heart className="h-4 w-4" />
                            <span>{post.likesCount}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MessageCircle className="h-4 w-4" />
                            <span>{post.commentsCount}</span>
                          </div>
                        </div>
                        {post.tags && post.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {post.tags.map((tag) => (
                              <Badge
                                key={tag}
                                variant="default"
                                className="cursor-pointer hover:opacity-80"
                                onClick={() => toggleTag(tag)}
                              >
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </div>
                  </div>
                </Card>
              ))}

              {!isLoading && posts.length === 0 && (
                <Card>
                  <CardContent className="text-center py-12">
                    <Search className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-xl font-semibold mb-2 text-foreground">No results found</h3>
                    <p className="text-muted-foreground">
                      Try adjusting your search terms or filters
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
        </div>
      </div>
    </div>
  )
}