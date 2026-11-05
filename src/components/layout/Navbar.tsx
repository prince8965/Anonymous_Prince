import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { LogOut, Menu, UserPen, X } from 'lucide-react'
import { useAuth } from '../../hooks/AuthContext'
import { useToast } from '../../hooks/ToastContext'
import { NotificationBell } from '../notifications/NotificationBell'
import { Logo } from './Logo'
import { EditProfileModal } from '../profile/EditProfileModal'

export function Navbar() {
  const [open, setOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [avatarError, setAvatarError] = useState(false)
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const { user, isOrganizer, signOut } = useAuth()
  const { notify } = useToast()
  const navigate = useNavigate()
  const location = useLocation()

  // Close dropdown on outside click or Escape key
  useEffect(() => {
    if (!dropdownOpen) return

    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('touchstart', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('touchstart', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [dropdownOpen])

  // Close dropdown on navigation
  useEffect(() => {
    setDropdownOpen(false)
  }, [location.pathname])

  // Reset avatar error when user changes
  useEffect(() => {
    setAvatarError(false)
  }, [user?.avatarUrl])

  // User initials fallback
  const initials = useMemo(() => {
    if (!user?.name) return 'U'
    const parts = user.name.trim().split(/\s+/)
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    }
    return user.name.slice(0, 2).toUpperCase()
  }, [user?.name])

  const links = useMemo(() => {
    const items = [{ to: '/', label: 'Discover', end: true }]
    if (user) {
      items.push(
        { to: '/community', label: 'Community', end: false },
        { to: '/communities', label: 'Communities', end: false },
      )
      if (isOrganizer) {
        items.push({ to: '/organizer', label: 'Organizer Dashboard', end: false })
      } else {
        items.push({ to: '/my-events', label: 'My Events', end: false })
      }
      if (user.role === 'judge' || isOrganizer || user.role === 'admin') {
        items.push({ to: '/judge', label: 'Judging', end: false })
      }
      if (user.role === 'admin') {
        items.push({ to: '/admin', label: 'Admin Portal', end: false })
      }
    }
    return items
  }, [user, isOrganizer])

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `rounded-lg px-3 py-2 text-sm font-semibold transition ${isActive ? 'bg-brand text-[#0B0F19] shadow-cyber' : 'text-ink-muted hover:bg-secondary hover:text-white'
    }`

  const handleSignOut = async () => {
    setDropdownOpen(false)
    setOpen(false)
    await signOut()
    notify('Signed out successfully.', 'info')
    navigate('/login')
  }

  return (
    <header className="glass sticky top-0 z-40 border-b border-white/[0.06]">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:rounded-lg focus:bg-secondary focus:text-brand focus:px-3 focus:py-2 focus:ring-2 focus:ring-brand"
      >
        Skip to content
      </a>
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8" aria-label="Main">
        <Link to="/" aria-label="NearCircle home" onClick={() => setOpen(false)}>
          <Logo />
        </Link>

        {/* Dynamic Desktop Links */}
        <div className="hidden items-center gap-1 lg:flex">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end} className={linkClass}>
              {l.label}
            </NavLink>
          ))}
        </div>

        {/* User / Authentication actions & Mobile trigger */}
        <div className="flex items-center gap-2 sm:gap-3">
          {user ? (
            <>
              <NotificationBell />

              {/* Circular Profile Avatar & Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setDropdownOpen((prev) => !prev)}
                  className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-[#334155] bg-[#0F172A] transition-all duration-150 hover:border-brand/70 hover:shadow-cyber focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 focus:ring-offset-canvas active:scale-95 cursor-pointer"
                  aria-expanded={dropdownOpen}
                  aria-haspopup="true"
                  aria-label="User account menu"
                >
                  {user.avatarUrl && !avatarError ? (
                    <img
                      src={user.avatarUrl}
                      alt={user.name}
                      onError={() => setAvatarError(true)}
                      className="h-full w-full rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center rounded-full bg-gradient-to-tr from-brand/20 to-brand-purple/20 text-brand font-bold text-xs sm:text-sm select-none">
                      {initials}
                    </div>
                  )}
                  <span
                    className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-canvas"
                    title="Online"
                  />
                </button>

                {/* Dropdown Menu */}
                {dropdownOpen && (
                  <div
                    className="absolute right-0 top-full mt-2 w-72 sm:w-80 max-w-[calc(100vw-2rem)] rounded-2xl border border-[#334155] bg-secondary p-4 shadow-lift z-50 animate-in fade-in zoom-in-95 duration-150"
                    role="menu"
                    aria-orientation="vertical"
                  >
                    {/* Top: User profile information */}
                    <div className="flex items-center gap-3">
                      <div className="relative h-12 w-12 shrink-0 rounded-full border border-[#334155] overflow-hidden bg-[#0F172A]">
                        {user.avatarUrl && !avatarError ? (
                          <img
                            src={user.avatarUrl}
                            alt={user.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-gradient-to-tr from-brand/20 to-brand-purple/20 text-brand font-bold text-base select-none">
                            {initials}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-white text-sm truncate" title={user.name}>
                          {user.name}
                        </p>
                        <p className="text-xs text-ink-muted truncate mt-0.5" title={user.email}>
                          {user.email}
                        </p>
                        <span className="inline-block mt-1.5 rounded-full bg-brand/10 border border-brand/30 px-2 py-0.5 text-[10px] font-bold text-brand uppercase tracking-wider">
                          {user.role}
                        </span>
                      </div>
                    </div>

                    {/* Subtle Divider */}
                    <div className="my-3 border-t border-[#334155]/60" />

                    {/* Edit Profile Option */}
                    <button
                      type="button"
                      onClick={() => {
                        setDropdownOpen(false)
                        setIsEditProfileOpen(true)
                      }}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs sm:text-sm font-semibold text-ink-muted hover:bg-white/10 hover:text-white transition-colors duration-150 cursor-pointer"
                      role="menuitem"
                    >
                      <UserPen className="h-4 w-4 shrink-0 text-brand" aria-hidden />
                      <span>Edit Profile</span>
                    </button>

                    {/* Bottom: Sign Out Option */}
                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs sm:text-sm font-semibold text-rose-400 hover:bg-rose-950/40 hover:text-rose-300 transition-colors duration-150 cursor-pointer"
                      role="menuitem"
                    >
                      <LogOut className="h-4 w-4 shrink-0" aria-hidden />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="hidden items-center gap-2 lg:flex">
              <Link to="/login" className="btn-ghost">
                Log in
              </Link>
              <Link to="/signup" className="btn-primary">
                Sign up
              </Link>
            </div>
          )}

          {/* Mobile menu button */}
          <button
            type="button"
            className="rounded-lg p-2 text-ink-muted hover:bg-secondary hover:text-white lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? 'Close menu' : 'Open menu'}
            onClick={() => setOpen((o) => !o)}
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </nav>

      {/* Mobile drawer */}
      {open && (
        <div id="mobile-menu" className="border-t border-[#1E293B] bg-[#0B0F19] px-4 pb-4 pt-2 lg:hidden">
          <div className="flex flex-col gap-1">
            {links.map((l) => (
              <NavLink key={l.to} to={l.to} end={l.end} className={linkClass} onClick={() => setOpen(false)}>
                {l.label}
              </NavLink>
            ))}
          </div>
          <div className="mt-3 flex flex-col gap-2 border-t border-[#1E293B] pt-3">
            {user ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between rounded-lg bg-secondary px-3 py-2 text-xs">
                  <span className="font-semibold text-white">{user.name}</span>
                  <span className="rounded bg-brand/10 border border-brand/30 px-2 py-0.5 text-[10px] font-bold text-brand uppercase">
                    {user.role}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false)
                    setIsEditProfileOpen(true)
                  }}
                  className="btn-secondary w-full text-xs"
                >
                  <UserPen className="h-4 w-4" aria-hidden /> Edit Profile
                </button>
                <button type="button" onClick={handleSignOut} className="btn-secondary w-full text-xs">
                  <LogOut className="h-4 w-4" aria-hidden /> Sign out
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Link to="/login" className="btn-secondary flex-1" onClick={() => setOpen(false)}>
                  Log in
                </Link>
                <Link to="/signup" className="btn-primary flex-1" onClick={() => setOpen(false)}>
                  Sign up
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      <EditProfileModal
        open={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
      />
    </header>
  )
}
