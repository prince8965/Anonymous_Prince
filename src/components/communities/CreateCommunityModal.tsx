import { useEffect, useRef, useState } from 'react'
import { AlertCircle, Plus, Users, X } from 'lucide-react'
import { useToast } from '../../hooks/ToastContext'

interface Props {
  open: boolean
  onClose: () => void
  onCreated?: (community: { name: string; category: string; description: string }) => void
}

const CATEGORIES = [
  'Technology',
  'AI/ML',
  'Web Development',
  'Programming',
  'Education',
  'Business',
  'Design',
  'Other',
] as const

export function CreateCommunityModal({ open, onClose, onCreated }: Props) {
  const { notify } = useToast()
  const nameInputRef = useRef<HTMLInputElement>(null)

  const [name, setName] = useState('')
  const [category, setCategory] = useState('')
  const [description, setDescription] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Focus on first field when opened and reset form
  useEffect(() => {
    if (open) {
      setName('')
      setCategory('')
      setDescription('')
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

    // Form validation
    const trimmedName = name.trim()
    const trimmedDesc = description.trim()

    if (!trimmedName) {
      setErrorMessage('Please enter a community name.')
      return
    }

    if (!category) {
      setErrorMessage('Please select a category.')
      return
    }

    if (!trimmedDesc) {
      setErrorMessage('Please describe what your community is about.')
      return
    }

    // Prevent duplicate submissions
    if (submitting) return
    setSubmitting(true)

    try {
      // Simulate submission handling (backend API for permanent community creation does not exist)
      await new Promise((resolve) => setTimeout(resolve, 600))

      notify(
        `Community request received for "${trimmedName}". Note: Persistent community creation backend is not yet implemented (prototype demo).`,
        'info',
      )

      onCreated?.({
        name: trimmedName,
        category,
        description: trimmedDesc,
      })

      onClose()
    } catch {
      setErrorMessage('An unexpected error occurred. Please try again.')
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
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand/10 border border-brand/30 text-brand">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h2 id="create-community-title" className="text-lg font-bold text-white">
                Create a New Community
              </h2>
              <p className="text-xs text-ink-muted">
                Start a group for your campus, tech stack, or hobby.
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

          {/* Notice explaining preview / prototype state */}
          <div className="rounded-xl border border-brand/20 bg-brand/5 p-3 text-xs text-ink-muted leading-relaxed">
            <strong className="text-brand">Community Creation:</strong> Provide your community details below. As NearCircle is currently in prototype mode, new communities are submitted for review.
          </div>

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
              placeholder="Enter community name"
              className="input text-sm"
              maxLength={80}
              required
              disabled={submitting}
            />
          </div>

          {/* 2. Category */}
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
                setCategory(e.target.value)
                if (errorMessage) setErrorMessage(null)
              }}
              className="input text-sm cursor-pointer"
              required
              disabled={submitting}
            >
              <option value="" disabled className="bg-secondary text-ink-faint">
                Select a category
              </option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat} className="bg-secondary text-white">
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* 3. Description */}
          <div>
            <label
              htmlFor="community-description-input"
              className="label text-xs font-semibold uppercase tracking-wider text-ink-faint"
            >
              Description <span className="text-rose-400">*</span>
            </label>
            <textarea
              id="community-description-input"
              rows={4}
              value={description}
              onChange={(e) => {
                setDescription(e.target.value)
                if (errorMessage) setErrorMessage(null)
              }}
              placeholder="Describe what your community is about"
              className="input resize-none text-sm leading-relaxed"
              maxLength={500}
              required
              disabled={submitting}
            />
            <div className="mt-1 flex justify-end text-[11px] text-ink-faint">
              {description.length}/500
            </div>
          </div>

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
              <Plus className="h-4 w-4" />
              <span>{submitting ? 'Creating Community…' : 'Create Community'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

