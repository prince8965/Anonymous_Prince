import { useEffect, useRef, useState } from 'react'
import { AlertCircle, Loader2, Plus, Users, X } from 'lucide-react'
import { LOCALITIES } from '../../data/localities'
import { useAuth } from '../../hooks/AuthContext'
import { useToast } from '../../hooks/ToastContext'
import { createCommunity, type CommunityWithState } from '../../services'
import { CATEGORIES, type Category } from '../../types'

interface Props {
  open: boolean
  onClose: () => void
  onCreated?: (community: CommunityWithState) => void
}

const ACCENT_COLORS = [
  '#00F2FE', // Brand Cyan
  '#A855F7', // Purple
  '#38BDF8', // Sky Blue
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#EC4899', // Pink
  '#818CF8', // Indigo
  '#F43F5E', // Rose
]

export function CreateCommunityModal({ open, onClose, onCreated }: Props) {
  const { user } = useAuth()
  const { notify } = useToast()
  const nameInputRef = useRef<HTMLInputElement>(null)

  const [name, setName] = useState('')
  const [category, setCategory] = useState<Category>('Technology')
  const [description, setDescription] = useState('')
  const [localityId, setLocalityId] = useState('andheri')
  const [accent, setAccent] = useState(ACCENT_COLORS[0])
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Focus on first field when opened and reset form
  useEffect(() => {
    if (open) {
      setName('')
      setCategory('Technology')
      setDescription('')
      setLocalityId('andheri')
      setAccent(ACCENT_COLORS[0])
      setErrorMessage(null)
      setSubmitting(false)
      const timer = setTimeout(() => {
        nameInputRef.current?.focus()
      }, 50)
      return () => clearTimeout(timer)
    }
  }, [open])

  // Close on Escape key & manage body scroll
  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !submitting) {
        onClose()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      window.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = prev
    }
  }, [open, submitting, onClose])

  if (!open) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    if (!user) {
      setErrorMessage('You must be signed in to create a community.')
      return
    }

    const trimmedName = name.trim()
    const trimmedDesc = description.trim()

    if (!trimmedName) {
      setErrorMessage('Please enter a community name.')
      return
    }

    if (!trimmedDesc) {
      setErrorMessage('Please describe what your community is about.')
      return
    }

    if (submitting) return
    setSubmitting(true)

    try {
      const created = await createCommunity({
        name: trimmedName,
        category,
        description: trimmedDesc,
        localityId,
        accent,
      })

      notify(`Community "${trimmedName}" created and live! Visible to all students and organizations.`, 'success')

      onCreated?.(created)
      onClose()
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-6"
      role="presentation"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150"
        onClick={submitting ? undefined : onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-community-title"
        className="relative flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-[#334155] bg-secondary p-6 shadow-lift z-10 animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#334155]/60 pb-4">
          <div className="flex items-center gap-2.5 text-white">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl text-[#0B0F19] font-bold shadow-cyber transition-colors"
              style={{ backgroundColor: accent }}
            >
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h2 id="create-community-title" className="text-lg font-bold text-white">
                Create a Community
              </h2>
              <p className="text-xs text-ink-muted">
                Open to both student participants and campus organizations.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-lg p-1.5 text-ink-muted hover:bg-[#334155] hover:text-white transition disabled:opacity-50"
            aria-label="Close dialog"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-y-auto pt-4 space-y-4">
          {errorMessage && (
            <div
              role="alert"
              className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-950/40 p-3 text-xs font-medium text-rose-300"
            >
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* 1. Community Name */}
          <div>
            <label
              htmlFor="community-name-input"
              className="label text-xs font-semibold uppercase tracking-wider text-ink-faint"
            >
              Community Name <span className="text-rose-400">*</span>
            </label>
            <input
              ref={nameInputRef}
              id="community-name-input"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                if (errorMessage) setErrorMessage(null)
              }}
              placeholder="e.g. Mumbai AI Builders, Navi Mumbai Design Club"
              className="input text-sm"
              maxLength={80}
              required
              disabled={submitting}
            />
          </div>

          {/* 2. Category & Locality in grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="community-category-select"
                className="label text-xs font-semibold uppercase tracking-wider text-ink-faint"
              >
                Category <span className="text-rose-400">*</span>
              </label>
              <select
                id="community-category-select"
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value as Category)
                  if (errorMessage) setErrorMessage(null)
                }}
                className="input text-sm cursor-pointer"
                required
                disabled={submitting}
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat} className="bg-secondary text-white">
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="community-locality-select"
                className="label text-xs font-semibold uppercase tracking-wider text-ink-faint"
              >
                Locality Hub
              </label>
              <select
                id="community-locality-select"
                value={localityId}
                onChange={(e) => setLocalityId(e.target.value)}
                className="input text-sm cursor-pointer"
                disabled={submitting}
              >
                {LOCALITIES.map((loc) => (
                  <option key={loc.id} value={loc.id} className="bg-secondary text-white">
                    {loc.name} ({loc.city})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 3. Accent Color Picker */}
          <div>
            <label className="label text-xs font-semibold uppercase tracking-wider text-ink-faint">
              Theme Accent Color
            </label>
            <div className="flex items-center gap-2 pt-1">
              {ACCENT_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setAccent(c)}
                  className={`h-7 w-7 rounded-full transition-transform cursor-pointer ${
                    accent === c ? 'scale-125 ring-2 ring-white ring-offset-2 ring-offset-canvas' : 'opacity-80 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: c }}
                  aria-label={`Select accent color ${c}`}
                />
              ))}
            </div>
          </div>

          {/* 4. Description */}
          <div>
            <label
              htmlFor="community-description-input"
              className="label text-xs font-semibold uppercase tracking-wider text-ink-faint"
            >
              Description <span className="text-rose-400">*</span>
            </label>
            <textarea
              id="community-description-input"
              rows={3}
              value={description}
              onChange={(e) => {
                setDescription(e.target.value)
                if (errorMessage) setErrorMessage(null)
              }}
              placeholder="What is this community about? Who should join?"
              className="input resize-none text-sm leading-relaxed"
              maxLength={500}
              required
              disabled={submitting}
            />
            <div className="mt-1 flex justify-end text-[11px] text-ink-faint">
              {description.length}/500
            </div>
          </div>

          {/* Creator Attribution Info */}
          {user && (
            <div className="rounded-xl border border-brand/20 bg-brand/5 p-3 text-xs text-ink-muted">
              Publishing as <strong className="text-white">{user.name}</strong> ({user.role}). Your community will be publicly listed and visible to everyone.
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#334155]">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="btn-secondary text-xs sm:text-sm px-4 py-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary flex items-center gap-2 text-xs sm:text-sm px-5 py-2 font-bold shadow-cyber hover:shadow-neon"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Creating…</span>
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  <span>Create Community</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
