import { useEffect, useMemo, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import {
  Building2,
  Filter,
  MessageSquare,
  Search,
  Sparkles,
  TrendingUp,
  Users,
  X,
} from 'lucide-react'
import { CommunityLeftSidebar } from '../components/community/CommunityLeftSidebar'
import { CommunityPostCard } from '../components/community/CommunityPostCard'
import { CommunityRightSidebar } from '../components/community/CommunityRightSidebar'
import { CreatePostCard } from '../components/community/CreatePostCard'
import { CreatePostModal } from '../components/community/CreatePostModal'
import { OrganizationCard } from '../components/community/OrganizationCard'
import { OrganizationProfileModal } from '../components/community/OrganizationProfileModal'
import { LocationSelector } from '../components/events/LocationSelector'
import { CategoryChip } from '../components/ui/CategoryChip'
import { EmptyState } from '../components/ui/EmptyState'
import { ErrorState } from '../components/ui/ErrorState'
import { Skeleton } from '../components/ui/Skeleton'
import { getLocality } from '../data/localities'
import { useApp } from '../hooks/AppContext'
import { useAuth } from '../hooks/AuthContext'
import { useAsync } from '../hooks/useAsync'
import {
  getCommunityPosts,
  getCurrentUserId,
  getOrganizations,
  subscribeChange,
} from '../services'
import { readRsvps } from '../services/db'
import {
  CATEGORIES,
  type Category,
  type CommunityTab,
  type Organization,
  type PostSortKey,
} from '../types'

export default function CommunityPage() {
  const { id: routeOrgId } = useParams<{ id: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const { localityId, interests } = useApp()
  const { user } = useAuth()

  // Query parameter handling: ?tab=..., ?postId=..., ?shareEventId=..., ?org=...
  const initialTab = (searchParams.get('tab') as CommunityTab) || 'for-you'
  const targetPostId = searchParams.get('postId')
  const shareEventId = searchParams.get('shareEventId')
  const targetOrgId = searchParams.get('org') || routeOrgId

  const [activeTab, setActiveTab] = useState<CommunityTab>(initialTab)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<Category | 'all'>('all')
  const [sort, setSort] = useState<PostSortKey>('newest')

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(Boolean(shareEventId))
  const [createModalMode, setCreateModalMode] = useState<'default' | 'image' | 'event'>('default')
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null)
  const [rsvpsVersion, setRsvpsVersion] = useState(0)

  const currentUserId = getCurrentUserId()

  // Feed loader
  const {
    data: posts,
    loading: postsLoading,
    error: postsError,
    reload: reloadPosts,
  } = useAsync(
    () =>
      getCommunityPosts({
        tab: activeTab,
        category,
        query,
        sort,
        localityId,
        interests,
      }),
    [activeTab, category, query, sort, localityId, interests],
  )

  // Organizations loader (for Organizations tab, lookup, and sidebar suggestions)
  const {
    data: organizations,
    loading: orgsLoading,
    error: orgsError,
    reload: reloadOrgs,
  } = useAsync(getOrganizations, [])

  // Auto-subscribe to changes on the bus so any likes/follows/new posts re-render automatically
  useEffect(() => {
    const unsub = subscribeChange(() => {
      reloadPosts()
      reloadOrgs()
      setRsvpsVersion((v) => v + 1)
    })
    return unsub
  }, [reloadPosts, reloadOrgs])

  // Open target organization modal if specified in query param or route
  useEffect(() => {
    if (targetOrgId && organizations && organizations.length > 0) {
      const match = organizations.find((o) => o.id === targetOrgId)
      if (match) setSelectedOrg(match)
    }
  }, [targetOrgId, organizations])

  // Keep selectedOrg in sync when organizations list updates
  useEffect(() => {
    if (selectedOrg && organizations) {
      const match = organizations.find((o) => o.id === selectedOrg.id)
      if (
        match &&
        (match.isFollowing !== selectedOrg.isFollowing ||
          match.followerCount !== selectedOrg.followerCount)
      ) {
        setSelectedOrg(match)
      }
    }
  }, [organizations, selectedOrg])

  // If shareEventId was passed in, auto-open the create post modal
  useEffect(() => {
    if (shareEventId) {
      setIsCreateModalOpen(true)
      setCreateModalMode('event')
    }
  }, [shareEventId])

  // Scroll to targeted post if ?postId=... is present
  useEffect(() => {
    if (targetPostId && posts && posts.length > 0) {
      const element = document.getElementById(`post-${targetPostId}`)
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }, 150)
      }
    }
  }, [targetPostId, posts])

  // Real user activity stats
  const myPostsCount = useMemo(() => {
    return (posts ?? []).filter((p) => p.authorId === currentUserId).length
  }, [posts, currentUserId])

  const followedOrgsCount = useMemo(() => {
    return (organizations ?? []).filter((o) => o.isFollowing).length
  }, [organizations])

  const totalInteractions = useMemo(() => {
    return (posts ?? [])
      .filter((p) => p.authorId === currentUserId)
      .reduce((sum, p) => sum + p.likesCount + p.commentsCount, 0)
  }, [posts, currentUserId])

  const rsvpsCount = useMemo(() => {
    // Read user's real RSVPs count
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    rsvpsVersion // recompute when version changes
    const rsvps = readRsvps()
    return rsvps.filter((r) => r.status === 'going').length
  }, [rsvpsVersion])

  const handleTabChange = (tab: CommunityTab) => {
    setActiveTab(tab)
    const nextParams = new URLSearchParams(searchParams)
    nextParams.set('tab', tab)
    setSearchParams(nextParams, { replace: true })
  }

  const handleOpenOrgProfile = (orgId: string) => {
    const match = (organizations ?? []).find((o) => o.id === orgId)
    if (match) setSelectedOrg(match)
  }

  const handleOpenCreate = (mode: 'default' | 'image' | 'event' = 'default') => {
    setCreateModalMode(mode)
    setIsCreateModalOpen(true)
  }

  const handleSelectTopic = (topicQuery: string) => {
    setQuery(topicQuery)
    if (activeTab === 'organizations') {
      setActiveTab('for-you')
    }
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSelectPost = (postId: string) => {
    if (activeTab === 'organizations') {
      setActiveTab('for-you')
    }
    setTimeout(() => {
      const el = document.getElementById(`post-${postId}`)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        el.classList.add('ring-2', 'ring-brand', 'shadow-cyber')
        setTimeout(() => {
          el.classList.remove('ring-2', 'ring-brand', 'shadow-cyber')
        }, 3000)
      }
    }, 150)
  }

  // Filter organizations when in the Organizations tab
  const filteredOrganizations = useMemo(() => {
    if (!organizations) return []
    const q = query.trim().toLowerCase()
    return organizations.filter(
      (o) =>
        (category === 'all' || o.category === category) &&
        (!q ||
          o.name.toLowerCase().includes(q) ||
          o.description.toLowerCase().includes(q) ||
          o.category.toLowerCase().includes(q)),
    )
  }, [organizations, query, category])

  const currentLocality = getLocality(localityId)

  return (
    <div className="min-h-screen bg-canvas text-ink py-6">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Mobile-Only Header Snippet */}
        <div className="mb-4 lg:hidden">
          <div className="card p-4 flex items-center justify-between gap-3 shadow-card">
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative h-11 w-11 rounded-full border border-brand/40 overflow-hidden bg-[#0F172A] shrink-0">
                {user?.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-tr from-brand/20 to-brand-purple/20 text-brand font-bold text-sm">
                    {(user?.name || 'S').charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <h2 className="text-sm font-bold text-white truncate">
                  {user?.name || 'NearCircle Student'}
                </h2>
                <div className="flex items-center gap-2 text-[11px] text-ink-muted">
                  <span>{myPostsCount} posts</span>
                  <span>•</span>
                  <span>{followedOrgsCount} followed</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleOpenCreate('default')}
              className="btn-primary shrink-0 text-xs px-3.5 py-2 font-bold shadow-cyber"
            >
              Post
            </button>
          </div>

          {/* Mobile Horizontal Tabs */}
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {(
              [
                { id: 'for-you', label: 'For You' },
                { id: 'following', label: 'Following' },
                { id: 'nearby', label: 'Nearby' },
                { id: 'my-posts', label: 'My Posts' },
                { id: 'organizations', label: 'Clubs & Orgs' },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => handleTabChange(t.id)}
                className={`shrink-0 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition ${
                  activeTab === t.id
                    ? 'bg-brand/15 text-brand border border-brand/40'
                    : 'bg-secondary text-ink-muted hover:text-white border border-[#334155]/60'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Three-Column LinkedIn Layout on Desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr_310px] xl:grid-cols-[280px_1fr_330px] gap-6 items-start">
          {/* LEFT SIDEBAR (Desktop) */}
          <aside className="hidden lg:block sticky top-20" aria-label="Community Profile and Navigation">
            <CommunityLeftSidebar
              user={user}
              activeTab={activeTab}
              onChangeTab={handleTabChange}
              myPostsCount={myPostsCount}
              followedOrgsCount={followedOrgsCount}
              totalInteractions={totalInteractions}
              rsvpsCount={rsvpsCount}
              localityName={currentLocality.name}
              onOpenCreatePost={() => handleOpenCreate('default')}
            />
          </aside>

          {/* CENTER FEED */}
          <main className="min-w-0 space-y-4" aria-label="Community Feed">
            {/* LinkedIn-style Create Post Card */}
            <CreatePostCard
              user={user}
              onOpenCreate={handleOpenCreate}
            />

            {/* Filter & Search Bar */}
            <div className="card p-3 sm:p-4 space-y-3 shadow-card">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                {/* Search Bar */}
                <div className="relative flex-1">
                  <label htmlFor="community-search-feed" className="sr-only">
                    Search community posts, topics, or clubs
                  </label>
                  <Search
                    className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-brand"
                    aria-hidden
                  />
                  <input
                    id="community-search-feed"
                    type="search"
                    className="input h-10 pl-10 text-xs sm:text-sm"
                    placeholder={
                      activeTab === 'organizations'
                        ? 'Search campus clubs, student societies, or tags…'
                        : 'Search posts, discussions, questions, or topics…'
                    }
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                  {query && (
                    <button
                      type="button"
                      onClick={() => setQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-faint hover:text-white"
                      aria-label="Clear search"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {/* Sort selector & Area selector */}
                <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-auto">
                  {activeTab === 'nearby' && (
                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="font-semibold text-ink-muted">Area:</span>
                      <LocationSelector />
                    </div>
                  )}

                  {activeTab !== 'organizations' && (
                    <div className="flex items-center gap-1.5">
                      <Filter className="h-3.5 w-3.5 text-ink-faint" />
                      <label htmlFor="sort-select" className="sr-only">
                        Sort posts
                      </label>
                      <select
                        id="sort-select"
                        value={sort}
                        onChange={(e) => setSort(e.target.value as PostSortKey)}
                        className="input h-10 py-1 text-xs font-semibold max-w-[150px]"
                      >
                        <option value="newest" className="bg-secondary text-white">
                          Sort: Newest
                        </option>
                        <option value="popular" className="bg-secondary text-white">
                          Sort: Top / Popular
                        </option>
                      </select>
                    </div>
                  )}
                </div>
              </div>

              {/* Category Chips Scrollbar */}
              <div
                className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none"
                role="group"
                aria-label="Filter feed by category"
              >
                <CategoryChip
                  category="all"
                  selected={category === 'all'}
                  onClick={() => setCategory('all')}
                  size="sm"
                />
                {CATEGORIES.map((cat) => (
                  <CategoryChip
                    key={cat}
                    category={cat}
                    selected={category === cat}
                    onClick={() => setCategory(category === cat ? 'all' : cat)}
                    size="sm"
                  />
                ))}
              </div>
            </div>

            {/* Active Tab Notice Banner (for Following / Nearby) */}
            {activeTab === 'following' && (
              <div className="rounded-xl border border-brand/20 bg-brand/5 p-3.5 text-xs text-ink-muted flex items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <Users className="h-4 w-4 text-brand shrink-0" />
                  <span className="truncate">
                    Showing posts from <strong>{followedOrgsCount} followed clubs</strong> &amp; your network.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleTabChange('organizations')}
                  className="text-xs font-bold text-brand hover:underline shrink-0"
                >
                  Explore Clubs →
                </button>
              </div>
            )}

            {activeTab === 'nearby' && (
              <div className="rounded-xl border border-brand/20 bg-brand/5 p-3.5 text-xs text-ink-muted flex items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <Sparkles className="h-4 w-4 text-brand shrink-0" />
                  <span className="truncate">
                    Showing posts from students &amp; organizers near <strong>{currentLocality.name}</strong>.
                  </span>
                </div>
              </div>
            )}

            {/* Content Feed: Organizations View OR Posts View */}
            {activeTab === 'organizations' ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-brand" />
                    <span>Campus Clubs &amp; Student Societies</span>
                  </h3>
                  <span className="text-xs text-ink-muted">
                    {filteredOrganizations.length}{' '}
                    {filteredOrganizations.length === 1 ? 'organization' : 'organizations'}
                  </span>
                </div>

                {orgsLoading ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <Skeleton key={i} className="h-44 w-full rounded-2xl" />
                    ))}
                  </div>
                ) : orgsError ? (
                  <ErrorState message={orgsError} onRetry={reloadOrgs} />
                ) : filteredOrganizations.length === 0 ? (
                  <EmptyState
                    icon={Building2}
                    title="No organizations found"
                    description="Try another search query or category filter."
                    actionLabel="Reset filters"
                    onAction={() => {
                      setQuery('')
                      setCategory('all')
                    }}
                  />
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {filteredOrganizations.map((org) => (
                      <OrganizationCard
                        key={org.id}
                        organization={org}
                        onSelect={(o) => setSelectedOrg(o)}
                        onFollowToggled={() => {
                          reloadOrgs()
                          reloadPosts()
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              /* Chronological Feed Posts */
              <div className="space-y-4">
                {postsLoading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="card p-5 space-y-3">
                        <div className="flex items-center gap-3">
                          <Skeleton className="h-11 w-11 rounded-full" />
                          <div className="space-y-1.5 flex-1">
                            <Skeleton className="h-4 w-36" />
                            <Skeleton className="h-3 w-24" />
                          </div>
                        </div>
                        <Skeleton className="h-16 w-full rounded-xl" />
                        <Skeleton className="h-8 w-full rounded-xl" />
                      </div>
                    ))}
                  </div>
                ) : postsError ? (
                  <ErrorState message={postsError} onRetry={reloadPosts} />
                ) : !posts || posts.length === 0 ? (
                  <EmptyState
                    icon={MessageSquare}
                    title={
                      activeTab === 'my-posts'
                        ? 'You haven’t posted yet'
                        : activeTab === 'following'
                        ? 'No posts from followed clubs yet'
                        : activeTab === 'nearby'
                        ? `No community posts in ${currentLocality.name}`
                        : 'No community posts found'
                    }
                    description={
                      activeTab === 'my-posts'
                        ? 'Share your thoughts, showcase a project, or ask a question to get started.'
                        : activeTab === 'following'
                        ? 'Follow campus organizations and student societies to see their latest updates here.'
                        : 'Try searching with different keywords or reset your category filter.'
                    }
                    actionLabel={
                      activeTab === 'my-posts'
                        ? 'Create First Post'
                        : activeTab === 'following'
                        ? 'Explore Organizations'
                        : 'Reset Filters'
                    }
                    onAction={() => {
                      if (activeTab === 'my-posts') {
                        handleOpenCreate('default')
                      } else if (activeTab === 'following') {
                        handleTabChange('organizations')
                      } else {
                        setQuery('')
                        setCategory('all')
                      }
                    }}
                  />
                ) : (
                  <div className="space-y-4">
                    {posts.map((post) => (
                      <CommunityPostCard
                        key={post.id}
                        post={post}
                        onPostUpdated={() => {
                          reloadPosts()
                          reloadOrgs()
                        }}
                        onOpenOrgProfile={handleOpenOrgProfile}
                        isHighlighted={post.id === targetPostId}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </main>

          {/* RIGHT SIDEBAR (Desktop) */}
          <aside className="hidden lg:block sticky top-20" aria-label="Trending Topics and Suggested Clubs">
            <CommunityRightSidebar
              organizations={organizations ?? []}
              posts={posts ?? []}
              onSelectOrg={(org) => setSelectedOrg(org)}
              onFollowToggled={() => {
                reloadOrgs()
                reloadPosts()
              }}
              onSelectTopic={handleSelectTopic}
              onSelectPost={handleSelectPost}
              onViewAllOrgs={() => handleTabChange('organizations')}
            />
          </aside>
        </div>

        {/* Mobile-Only Collapsible Trending & Suggested Section at bottom */}
        <div className="mt-8 space-y-4 lg:hidden">
          <div className="border-t border-[#334155]/60 pt-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-ink-faint mb-3 flex items-center gap-1.5">
              <TrendingUp className="h-4 w-4 text-brand" />
              <span>Campus Buzz &amp; Trending Topics</span>
            </h3>
            <div className="flex flex-wrap gap-2">
              {[
                { tag: '#AIHackathon2026', query: 'AI' },
                { tag: '#WebDevelopment', query: 'Web Development' },
                { tag: '#CampusMeetups', query: 'meetup' },
                { tag: '#OpenSource', query: 'open source' },
                { tag: '#StudentStartups', query: 'startup' },
              ].map((t) => (
                <button
                  key={t.tag}
                  type="button"
                  onClick={() => handleSelectTopic(t.query)}
                  className="rounded-full bg-[#1E293B] border border-[#334155] px-3 py-1 text-xs font-semibold text-white hover:text-brand hover:border-brand/40 transition"
                >
                  {t.tag}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Create Post Modal */}
      <CreatePostModal
        open={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false)
          // Clear shareEventId query param if set
          if (shareEventId) {
            const nextParams = new URLSearchParams(searchParams)
            nextParams.delete('shareEventId')
            setSearchParams(nextParams, { replace: true })
          }
        }}
        onCreated={() => {
          reloadPosts()
          reloadOrgs()
        }}
        initialEventId={shareEventId ?? undefined}
        initialMode={createModalMode}
      />

      {/* Organization Profile Modal */}
      <OrganizationProfileModal
        organization={selectedOrg}
        posts={posts ?? []}
        onClose={() => setSelectedOrg(null)}
        onFollowToggled={() => {
          reloadOrgs()
          reloadPosts()
        }}
        onPostUpdated={() => {
          reloadPosts()
          reloadOrgs()
        }}
      />
    </div>
  )
}
