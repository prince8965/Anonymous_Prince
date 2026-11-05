import { Calendar, Image as ImageIcon, MessageSquare, Sparkles } from 'lucide-react'
import type { User } from '../../types'

interface Props {
  user: User | null
  onOpenCreate: (mode?: 'default' | 'image' | 'event') => void
}

export function CreatePostCard({ user, onOpenCreate }: Props) {
  const userName = user?.name || 'Student'
  const firstName = userName.split(' ')[0]
  const avatarUrl = user?.avatarUrl

  return (
    <div className="card p-4 sm:p-5 transition-all duration-200 hover:border-[#475569]/80 shadow-card">
      {/* Top Input Row */}
      <div className="flex items-center gap-3">
        {/* User Avatar */}
        <div className="relative shrink-0">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={userName}
              className="h-10 w-10 sm:h-11 sm:w-11 rounded-full object-cover border border-[#334155]"
            />
          ) : (
            <div className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full bg-gradient-to-tr from-brand/20 to-brand-purple/20 text-brand font-bold text-sm sm:text-base border border-brand/30">
              {userName.charAt(0).toUpperCase()}
            </div>
          )}
          <span
            className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-secondary"
            title="Online"
          />
        </div>

        {/* Clickable Fake Input Trigger (LinkedIn style) */}
        <button
          type="button"
          onClick={() => onOpenCreate('default')}
          className="group flex flex-1 items-center rounded-full border border-[#334155] bg-[#0F172A] px-4 py-2.5 text-left text-xs sm:text-sm text-ink-muted transition hover:border-brand/40 hover:bg-[#1E293B] hover:text-white"
          aria-label="Start a community post"
        >
          <span className="truncate">
            What's on your mind, {firstName}? Share a project or event…
          </span>
        </button>
      </div>

      {/* Bottom Action Options (LinkedIn style) */}
      <div className="mt-3 flex items-center justify-between border-t border-[#334155]/60 pt-3 flex-wrap gap-1">
        {/* Media / Photo Button */}
        <button
          type="button"
          onClick={() => onOpenCreate('image')}
          className="flex items-center gap-2 rounded-xl px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-ink-muted transition hover:bg-[#0F172A] hover:text-emerald-400 group"
          aria-label="Upload photo or media attachment"
        >
          <ImageIcon className="h-4 w-4 text-emerald-400 transition-transform group-hover:scale-110" />
          <span className="hidden xs:inline sm:inline">Media</span>
        </button>

        {/* Event Button */}
        <button
          type="button"
          onClick={() => onOpenCreate('event')}
          className="flex items-center gap-2 rounded-xl px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-ink-muted transition hover:bg-[#0F172A] hover:text-amber-400 group"
          aria-label="Link or announce an event"
        >
          <Calendar className="h-4 w-4 text-amber-400 transition-transform group-hover:scale-110" />
          <span className="hidden xs:inline sm:inline">Event</span>
        </button>

        {/* Project Update Button */}
        <button
          type="button"
          onClick={() => onOpenCreate('default')}
          className="flex items-center gap-2 rounded-xl px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-ink-muted transition hover:bg-[#0F172A] hover:text-brand group"
          aria-label="Share a project update"
        >
          <Sparkles className="h-4 w-4 text-brand transition-transform group-hover:scale-110" />
          <span className="hidden xs:inline sm:inline">Project</span>
        </button>

        {/* Discussion / Article Button */}
        <button
          type="button"
          onClick={() => onOpenCreate('default')}
          className="flex items-center gap-2 rounded-xl px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-ink-muted transition hover:bg-[#0F172A] hover:text-purple-400 group"
          aria-label="Start a discussion"
        >
          <MessageSquare className="h-4 w-4 text-purple-400 transition-transform group-hover:scale-110" />
          <span className="hidden xs:inline sm:inline">Discussion</span>
        </button>
      </div>
    </div>
  )
}

