import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft, Camera, Loader2, LogOut, Menu, UserPen, X } from 'lucide-react'
import { useAuth } from '../../hooks/AuthContext'
import { useToast } from '../../hooks/ToastContext'
import { uploadFile } from '../../services/storageService'
import { NotificationBell } from '../notifications/NotificationBell'
import { Logo } from './Logo'

export function Navbar() {
  const [open, setOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [avatarError, setAvatarError] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const { user, isOrganizer, signOut, updateProfile } = useAuth()
  const { notify } = useToast()
  const navigate = useNavigate()
  const location = useLocation()

  // Inline edit form state
  const [editName, setEditName] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editAvatarPreview, setEditAvatarPreview] = useState('')
  const [editAvatarFile, setEditAvatarFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Close dropdown on outside click or Escape key
  useEffect(() => {
    if (!dropdownOpen) return

    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
        setEditMode(false)
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (editMode) {
          setEditMode(false)
        } else {
          setDropdownOpen(false)
        }
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
    setEditMode(false)
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
    setEditMode(false)
    setOpen(false)
    await signOut()
    notify('Signed out successfully.', 'info')
    navigate('/login')
  }

  const openEditMode = () => {
    setEditName(user?.name ?? '')
    setEditEmail(user?.email ?? '')
    setEditAvatarPreview(user?.avatarUrl ?? '')
    setEditAvatarFile(null)
    setEditMode(true)
  }

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      notify('Please select a valid image file (PNG, JPG, WebP).', 'error')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      notify('Image size must be less than 5 MB.', 'error')
      return
    }
    setEditAvatarFile(file)
    setEditAvatarPreview(URL.createObjectURL(file))
  }

  const handleSaveProfile = async () => {
    if (!user) return
    if (!editName.trim()) {
      notify('Name cannot be empty.', 'error')
      return
    }
    if (!editEmail.trim() || !editEmail.includes('@')) {
      notify('Please enter a valid email address.', 'error')
      return
    }
    setSaving(true)
    try {
      let finalAvatarUrl = editAvatarPreview
      if (editAvatarFile) {
        try {
          const ext = editAvatarFile.name.split('.').pop() || 'jpg'
          const filePath = `avatars/${user.id}-${Date.now()}.${ext}`
          const res = await uploadFile('public-assets', filePath, editAvatarFile)
          if (res.publicUrl) finalAvatarUrl = res.publicUrl
        } catch {
          const reader = new FileReader()
          finalAvatarUrl = await new Promise<string>((resolve) => {
            reader.onloadend = () => resolve(reader.result as string)
            reader.readAsDataURL(editAvatarFile)
          })
        }
      }
      await updateProfile({
        name: editName.trim(),
        email: editEmail.trim(),
        avatarUrl: finalAvatarUrl,
      })
      notify('Profile updated successfully!', 'success')
      setEditMode(false)
    } catch (err: any) {
      notify(err.message || 'Failed to update profile.', 'error')
    } finally {
      setSaving(false)
    }
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
                    {editMode ? (
                      /* ---- INLINE EDIT PROFILE FORM ---- */
                      <div className="space-y-4">
                        {/* Header with back button */}
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setEditMode(false)}
                            disabled={saving}
                            className="rounded-lg p-1.5 text-ink-muted hover:bg-white/10 hover:text-white transition"
                            aria-label="Back to menu"
                          >
                            <ArrowLeft className="h-4 w-4" />
                          </button>
                          <h3 className="text-sm font-bold text-white">Edit Profile</h3>
                        </div>

                        {/* Avatar upload */}
                        <div className="flex flex-col items-center gap-2">
                          <div className="relative group">
                            <div className="h-20 w-20 rounded-full overflow-hidden border-2 border-brand/50 bg-[#0F172A] flex items-center justify-center">
                              {editAvatarPreview ? (
                                <img src={editAvatarPreview} alt={editName} className="h-full w-full object-cover" />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center bg-gradient-to-tr from-brand/20 to-brand-purple/20 text-brand font-bold text-2xl select-none">
                                  {initials}
                                </div>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => fileInputRef.current?.click()}
                              className="absolute inset-0 flex flex-col items-center justify-center rounded-full bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs font-semibold cursor-pointer"
                              title="Change Photo"
                            >
                              <Camera className="h-5 w-5 mb-0.5 text-brand" />
                              <span className="text-[10px]">Change</span>
                            </button>
                          </div>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/png,image/jpeg,image/webp"
                            onChange={handleImageChange}
                            className="hidden"
                          />
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="text-[11px] text-brand hover:underline font-semibold"
                          >
                            Upload new picture
                          </button>
                        </div>

                        {/* Name field */}
                        <div>
                          <label className="block text-[11px] font-semibold text-ink-muted mb-1" htmlFor="inline-edit-name">
                            Full Name
                          </label>
                          <input
                            id="inline-edit-name"
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="input text-xs h-9"
                            placeholder="e.g. John Doe"
                            required
                          />
                        </div>

                        {/* Email field */}
                        <div>
                          <label className="block text-[11px] font-semibold text-ink-muted mb-1" htmlFor="inline-edit-email">
                            Email Address
                          </label>
                          <input
                            id="inline-edit-email"
                            type="email"
                            value={editEmail}
                            onChange={(e) => setEditEmail(e.target.value)}
                            className="input text-xs h-9"
                            placeholder="e.g. john@example.com"
                            required
                          />
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#334155]/60">
                          <button
                            type="button"
                            onClick={() => setEditMode(false)}
                            disabled={saving}
                            className="btn-secondary px-3 py-1.5 text-xs"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={handleSaveProfile}
                            disabled={saving}
                            className="btn-primary px-4 py-1.5 text-xs font-bold"
                          >
                            {saving ? (
                              <>
                                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving…
                              </>
                            ) : (
                              'Save Changes'
                            )}
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* ---- NORMAL DROPDOWN MENU ---- */
                      <>
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
                          onClick={openEditMode}
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
                      </>
                    )}
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
                    setDropdownOpen(true)
                    openEditMode()
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

    </header>
  )
}
