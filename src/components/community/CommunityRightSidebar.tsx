import { useState } from 'react'
import {
  Building2,
  Check,
  CheckCircle2,
  Flame,
  Hash,
  Heart,
  Info,
  MessageSquare,
  Plus,
  TrendingUp,
} from 'lucide-react'
import { useToast } from '../../hooks/ToastContext'
import { followOrganization, unfollowOrganization } from '../../services'
import type { CommunityPost, Organization } from '../../types'

interface Props {
  organizations: Organization[]
  posts: CommunityPost[]
  onSelectOrg: (org: Organization) => void
  onFollowToggled: () => void
  onSelectTopic: (topic: string) => void
  onSelectPost: (postId: string) => void
  onViewAllOrgs: () => void
}

const TRENDING_TOPICS = [
  { tag: '#AIHackathon2026', count: '142 posts', query: 'AI' },
  { tag: '#WebDevelopment', count: '98 posts', query: 'Web Development' },
  { tag: '#CampusMeetups', count: '76 discussions', query: 'meetup' },
  { tag: '#OpenSource', count: '54 posts', query: 'open source' },
  { tag: '#StudentStartups', count: '38 updates', query: 'startup' },
]

export function CommunityRightSidebar({
  organizations,
  posts,
  onSelectOrg,
  onFollowToggled,
  onSelectTopic,
  onSelectPost,
  onViewAllOrgs,
}: Props) {
  const { notify } = useToast()
  const [busyOrgId, setBusyOrgId] = useState<string | null>(null)

  // Top popular discussions by engagement score
  const popularDiscussions = [...posts]
    .sort((a, b) => b.likesCount * 2 + b.commentsCount * 3 - (a.likesCount * 2 + a.commentsCount * 3))
    .slice(0, 3)

  // Suggested campus clubs (take first 4)
  const suggestedClubs = organizations.slice(0, 4)

  const handleToggleFollow = async (e: React.MouseEvent, org: Organization) => {
    e.stopPropagation()
    setBusyOrgId(org.id)
    try {
      if (org.isFollowing) {
        await unfollowOrganization(org.id)
        notify(`Unfollowed ${org.name}.`, 'info')
      } else {
        await followOrganization(org.id)
        notify(`Following ${org.name}! Updates will appear in your Following feed.`, 'success')
      }
      onFollowToggled()
    } catch {
      notify('Could not update follow status.', 'error')
    } finally {
      setBusyOrgId(null)
    }
  }

  return (
    <div className="space-y-4">
      {/* Trending Community Topics (LinkedIn News style) */}
      <div className="card p-4 space-y-3 shadow-card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-brand" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">
              Trending Campus Topics
            </h3>
          </div>
          <span className="text-[10px] font-semibold text-brand bg-brand/10 px-2 py-0.5 rounded-full border border-brand/20">
            Live
          </span>
        </div>

        <div className="space-y-1">
          {TRENDING_TOPICS.map((item) => (
            <button
              key={item.tag}
              type="button"
              onClick={() => onSelectTopic(item.query)}
              className="group flex w-full items-start justify-between rounded-xl p-2 text-left transition hover:bg-[#0F172A]"
            >
              <div className="space-y-0.5 min-w-0">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-white group-hover:text-brand transition truncate">
                  <Hash className="h-3 w-3 text-ink-faint group-hover:text-brand shrink-0" />
                  <span className="truncate">{item.tag}</span>
                </div>
                <p className="text-[11px] text-ink-muted pl-4">{item.count}</p>
              </div>
              <span className="text-[11px] font-semibold text-brand opacity-0 group-hover:opacity-100 transition shrink-0 ml-2">
                Filter →
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Popular Discussions */}
      {popularDiscussions.length > 0 && (
        <div className="card p-4 space-y-3 shadow-card">
          <div className="flex items-center gap-2">
            <Flame className="h-4 w-4 text-amber-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">
              Popular Discussions
            </h3>
          </div>

          <div className="space-y-2.5">
            {popularDiscussions.map((post) => (
              <div
                key={post.id}
                onClick={() => onSelectPost(post.id)}
                className="group cursor-pointer rounded-xl p-2.5 transition hover:bg-[#0F172A] border border-transparent hover:border-[#334155]"
              >
                <div className="flex items-center gap-2 mb-1">
                  {post.authorAvatar ? (
                    <img
                      src={post.authorAvatar}
                      alt={post.authorName}
                      className="h-5 w-5 rounded-full object-cover border border-[#334155]"
                    />
                  ) : (
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-brand/20 text-brand text-[10px] font-bold">
                      {post.authorName.charAt(0)}
                    </div>
                  )}
                  <span className="text-xs font-medium text-ink-muted truncate">
                    {post.authorName}
                  </span>
                </div>

                <p className="text-xs text-white line-clamp-2 leading-relaxed group-hover:text-brand transition">
                  {post.content}
                </p>

                <div className="mt-2 flex items-center gap-3 text-[11px] text-ink-muted">
                  <span className="flex items-center gap-1">
                    <Heart className="h-3 w-3 text-rose-400" />
                    {post.likesCount}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageSquare className="h-3 w-3 text-brand" />
                    {post.commentsCount}
                  </span>
                  <span className="text-[10px] text-ink-faint ml-auto">
                    {post.category}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Suggested Users / Organisations (LinkedIn "Add to your feed" style) */}
      <div className="card p-4 space-y-3 shadow-card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-purple-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">
              Campus Clubs to Follow
            </h3>
          </div>
          <button
            type="button"
            onClick={onViewAllOrgs}
            className="text-xs font-semibold text-brand hover:underline"
          >
            View All →
          </button>
        </div>

        <div className="space-y-3">
          {suggestedClubs.map((org) => (
            <div
              key={org.id}
              onClick={() => onSelectOrg(org)}
              className="group flex cursor-pointer items-start justify-between gap-3 rounded-xl p-2 transition hover:bg-[#0F172A]"
            >
              <div className="flex items-start gap-2.5 min-w-0">
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[#0B0F19] text-xs font-bold shadow-xs mt-0.5"
                  style={{ backgroundColor: org.accentColor }}
                >
                  {org.name.charAt(0)}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1">
                    <p className="truncate text-xs font-bold text-white group-hover:text-brand transition">
                      {org.name}
                    </p>
                    {org.isVerified && (
                      <CheckCircle2 className="h-3 w-3 fill-brand text-[#0B0F19] shrink-0" />
                    )}
                  </div>
                  <p className="text-[11px] text-ink-muted truncate">{org.category}</p>
                  <p className="text-[10px] text-ink-faint">
                    {org.followerCount.toLocaleString('en-IN')} followers
                  </p>
                </div>
              </div>

              {/* Functional Follow / Following Button */}
              <button
                type="button"
                onClick={(e) => handleToggleFollow(e, org)}
                disabled={busyOrgId === org.id}
                className={`btn shrink-0 text-[11px] px-2.5 py-1 rounded-lg font-semibold transition ${
                  org.isFollowing
                    ? 'bg-[#1E293B] text-ink-muted border border-[#334155] hover:border-rose-500/50 hover:text-rose-400'
                    : 'btn-primary'
                }`}
                aria-label={org.isFollowing ? `Unfollow ${org.name}` : `Follow ${org.name}`}
              >
                {org.isFollowing ? (
                  <>
                    <Check className="h-3 w-3" />
                    <span>Following</span>
                  </>
                ) : (
                  <>
                    <Plus className="h-3 w-3" />
                    <span>Follow</span>
                  </>
                )}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Relevant Community Guidelines & Updates */}
      <div className="card p-4 space-y-2 border-[#334155]/60 text-xs text-ink-muted shadow-card">
        <div className="flex items-center gap-1.5 text-white font-semibold">
          <Info className="h-3.5 w-3.5 text-brand" />
          <span>Campus Community Standards</span>
        </div>
        <ul className="space-y-1 list-disc list-inside text-[11px] leading-relaxed text-ink-muted">
          <li>Keep interactions respectful and helpful.</li>
          <li>Share verified campus projects &amp; hackathons.</li>
          <li>Report suspicious links or spam immediately.</li>
        </ul>
        <div className="pt-2 border-t border-[#334155]/60 text-[10px] text-ink-faint flex items-center justify-between">
          <span>NearCircle Community © 2026</span>
          <span className="text-brand font-medium">Safe &amp; Verified</span>
        </div>
      </div>
    </div>
  )
}
