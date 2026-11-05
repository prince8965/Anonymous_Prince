import { Link } from 'react-router-dom'
import {
  Building2,
  Calendar,
  Compass,
  Heart,
  MapPin,
  MessageSquare,
  Sparkles,
  Ticket,
  Users,
} from 'lucide-react'
import { LocationSelector } from '../events/LocationSelector'
import type { CommunityTab, User } from '../../types'

interface Props {
  user: User | null
  activeTab: CommunityTab
  onChangeTab: (tab: CommunityTab) => void
  myPostsCount: number
  followedOrgsCount: number
  totalInteractions: number
  rsvpsCount: number
  localityName: string
  onOpenCreatePost: () => void
}

export function CommunityLeftSidebar({
  user,
  activeTab,
  onChangeTab,
  myPostsCount,
  followedOrgsCount,
  totalInteractions,
  rsvpsCount,
  localityName,
  onOpenCreatePost,
}: Props) {
  const userName = user?.name || 'NearCircle Student'
  const userRole = user?.role || 'participant'
  const avatarUrl = user?.avatarUrl

  // Bio / headline based on user profile & role
  const headline =
    userRole === 'organizer'
      ? 'Campus Event Organizer • Community Host'
      : userRole === 'admin'
      ? 'Platform Administrator • Campus Lead'
      : userRole === 'judge'
      ? 'Hackathon Judge • Technical Mentor'
      : 'Student • Campus Tech & Innovation Enthusiast'

  const navItems: { id: CommunityTab; label: string; icon: typeof Sparkles; badge?: number }[] = [
    { id: 'for-you', label: 'For You Feed', icon: Sparkles },
    { id: 'following', label: 'Following Feed', icon: Users, badge: followedOrgsCount > 0 ? followedOrgsCount : undefined },
    { id: 'nearby', label: `Nearby Hub (${localityName})`, icon: MapPin },
    { id: 'my-posts', label: 'My Posts', icon: MessageSquare, badge: myPostsCount > 0 ? myPostsCount : undefined },
    { id: 'organizations', label: 'Campus Clubs & Orgs', icon: Building2 },
  ]

  return (
    <div className="space-y-4">
      {/* User Profile Card (LinkedIn style) */}
      <div className="card overflow-hidden transition-all duration-200 shadow-card">
        {/* Cover Photo Header */}
        <div className="relative h-20 w-full bg-gradient-to-r from-brand/25 via-brand-purple/20 to-brand/10 border-b border-[#334155]/60 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(#00f2fe_1px,transparent_1px)] [background-size:16px_16px] opacity-20" />
          <div className="absolute right-2 top-2 rounded-full bg-secondary/80 backdrop-blur-xs px-2 py-0.5 text-[10px] font-bold text-brand border border-brand/30">
            Campus Feed
          </div>
        </div>

        {/* Profile Details */}
        <div className="px-4 pb-4 pt-0">
          {/* Avatar */}
          <div className="-mt-10 mb-2 flex justify-center">
            <div className="relative h-20 w-20 rounded-full border-4 border-secondary overflow-hidden shadow-lg bg-[#0F172A]">
              {avatarUrl ? (
                <img src={avatarUrl} alt={userName} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-tr from-brand/30 to-brand-purple/30 text-brand font-bold text-2xl">
                  {userName.charAt(0).toUpperCase()}
                </div>
              )}
              <span
                className="absolute bottom-1 right-1 h-3.5 w-3.5 rounded-full bg-emerald-400 ring-2 ring-secondary"
                title="Active"
              />
            </div>
          </div>

          {/* User Name & Headline */}
          <div className="text-center space-y-1">
            <h2 className="text-base font-bold text-white transition hover:text-brand cursor-pointer truncate">
              {userName}
            </h2>
            <p className="text-xs text-ink-muted leading-relaxed line-clamp-2 px-1">
              {headline}
            </p>
            <div className="pt-1 flex items-center justify-center">
              <span className="inline-flex items-center gap-1 rounded-full bg-[#0F172A] border border-[#334155] px-2.5 py-0.5 text-[10px] font-medium text-ink-muted">
                <MapPin className="h-3 w-3 text-brand" />
                <span>{localityName}</span>
              </span>
            </div>
          </div>

          {/* User Activity Stats (LinkedIn style) */}
          <div className="mt-4 border-t border-[#334155]/60 pt-3 space-y-2">
            <button
              type="button"
              onClick={() => onChangeTab('my-posts')}
              className="flex w-full items-center justify-between text-xs text-ink-muted hover:text-white py-1 px-2 rounded-lg hover:bg-[#0F172A] transition"
            >
              <span className="flex items-center gap-2">
                <MessageSquare className="h-3.5 w-3.5 text-brand" />
                <span>Your Posts</span>
              </span>
              <span className="font-bold text-brand">{myPostsCount}</span>
            </button>

            <button
              type="button"
              onClick={() => onChangeTab('following')}
              className="flex w-full items-center justify-between text-xs text-ink-muted hover:text-white py-1 px-2 rounded-lg hover:bg-[#0F172A] transition"
            >
              <span className="flex items-center gap-2">
                <Users className="h-3.5 w-3.5 text-purple-400" />
                <span>Clubs Followed</span>
              </span>
              <span className="font-bold text-purple-400">{followedOrgsCount}</span>
            </button>

            <div className="flex items-center justify-between text-xs text-ink-muted py-1 px-2">
              <span className="flex items-center gap-2">
                <Heart className="h-3.5 w-3.5 text-rose-400" />
                <span>Cheer &amp; Likes</span>
              </span>
              <span className="font-bold text-rose-400">{totalInteractions}</span>
            </div>

            <Link
              to="/my-events"
              className="flex items-center justify-between text-xs text-ink-muted hover:text-white py-1 px-2 rounded-lg hover:bg-[#0F172A] transition"
            >
              <span className="flex items-center gap-2">
                <Ticket className="h-3.5 w-3.5 text-amber-400" />
                <span>Event RSVPs</span>
              </span>
              <span className="font-bold text-amber-400">{rsvpsCount}</span>
            </Link>
          </div>

          {/* Quick Create Post Action inside Profile Card */}
          <div className="mt-4 pt-3 border-t border-[#334155]/60">
            <button
              type="button"
              onClick={onOpenCreatePost}
              className="btn-primary w-full text-xs font-bold py-2 shadow-cyber hover:shadow-neon"
            >
              + Create Post
            </button>
          </div>
        </div>
      </div>

      {/* Relevant Community Navigation Links (LinkedIn style) */}
      <div className="card p-3 space-y-1 shadow-card">
        <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-ink-faint flex items-center justify-between">
          <span>Community Feeds</span>
        </div>

        <nav className="space-y-1" aria-label="Community Feeds Navigation">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = activeTab === item.id
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onChangeTab(item.id)}
                className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition ${
                  isActive
                    ? 'bg-brand/10 text-brand border border-brand/30 shadow-xs'
                    : 'text-ink-muted hover:bg-[#0F172A] hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <Icon
                    className={`h-4 w-4 shrink-0 ${
                      isActive ? 'text-brand' : 'text-ink-faint'
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span className="rounded-full bg-brand/20 px-1.5 py-0.5 text-[10px] font-bold text-brand">
                    {item.badge}
                  </span>
                )}
              </button>
            )
          })}
        </nav>

        {/* Shortcuts Section */}
        <div className="border-t border-[#334155]/60 pt-2 mt-2 space-y-1">
          <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-ink-faint">
            Quick Shortcuts
          </div>
          <Link
            to="/my-events"
            className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-ink-muted hover:bg-[#0F172A] hover:text-white transition"
          >
            <Calendar className="h-4 w-4 text-ink-faint" />
            <span>My Registered Events</span>
          </Link>
          <Link
            to="/"
            className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-ink-muted hover:bg-[#0F172A] hover:text-white transition"
          >
            <Compass className="h-4 w-4 text-ink-faint" />
            <span>Discover Events</span>
          </Link>
        </div>
      </div>

      {/* Locality Selector Widget */}
      <div className="card p-4 space-y-2.5 shadow-card">
        <div className="flex items-center justify-between text-xs font-bold text-white">
          <span className="flex items-center gap-1.5">
            <MapPin className="h-4 w-4 text-brand" />
            <span>Campus Locality</span>
          </span>
        </div>
        <p className="text-[11px] text-ink-muted leading-relaxed">
          Switch your campus hub to see local posts, organizers, and meetups in your area.
        </p>
        <div className="pt-1">
          <LocationSelector />
        </div>
      </div>
    </div>
  )
}
