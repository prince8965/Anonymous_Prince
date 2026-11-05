import { useState, useRef, type FormEvent, type ChangeEvent } from 'react'
import { Camera, Loader2, User as UserIcon, X } from 'lucide-react'
import { useAuth } from '../../hooks/AuthContext'
import { useToast } from '../../hooks/ToastContext'
import { uploadFile } from '../../services/storageService'

interface Props {
  open: boolean
  onClose: () => void
}

export function EditProfileModal({ open, onClose }: Props) {
  const { user, updateProfile } = useAuth()
  const { notify } = useToast()

  const [name, setName] = useState(user?.name ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [avatarPreview, setAvatarPreview] = useState(user?.avatarUrl ?? '')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!open || !user) return null

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

    setAvatarFile(file)
    const objectUrl = URL.createObjectURL(file)
    setAvatarPreview(objectUrl)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      notify('Name cannot be empty.', 'error')
      return
    }

    if (!email.trim() || !email.includes('@')) {
      notify('Please enter a valid email address.', 'error')
      return
    }

    setSaving(true)
    try {
      let finalAvatarUrl = avatarPreview

      if (avatarFile) {
        try {
          const extension = avatarFile.name.split('.').pop() || 'jpg'
          const filePath = `avatars/${user.id}-${Date.now()}.${extension}`
          const uploadRes = await uploadFile('public-assets', filePath, avatarFile)
          if (uploadRes.publicUrl) {
            finalAvatarUrl = uploadRes.publicUrl
          }
        } catch {
          // Fallback to base64 Data URL if storage bucket is not created
          const reader = new FileReader()
          finalAvatarUrl = await new Promise<string>((resolve) => {
            reader.onloadend = () => resolve(reader.result as string)
            reader.readAsDataURL(avatarFile)
          })
        }
      }

      await updateProfile({
        name: name.trim(),
        email: email.trim(),
        avatarUrl: finalAvatarUrl,
      })

      notify('Profile updated successfully!', 'success')
      onClose()
    } catch (err: any) {
      notify(err.message || 'Failed to update profile.', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-md rounded-2xl border border-[#334155] bg-[#0F172A] p-6 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          disabled={saving}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-ink-muted hover:bg-white/10 hover:text-white transition"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        <h2 className="text-xl font-bold text-white mb-1">Edit Profile</h2>
        <p className="text-xs text-ink-muted mb-6">Update your personal information and profile picture.</p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Avatar upload */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative group">
              <div className="h-24 w-24 rounded-full overflow-hidden border-2 border-brand/50 bg-[#1E293B] flex items-center justify-center">
                {avatarPreview ? (
                  <img src={avatarPreview} alt={name} className="h-full w-full object-cover" />
                ) : (
                  <UserIcon className="h-10 w-10 text-ink-muted" />
                )}
              </div>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 flex flex-col items-center justify-center rounded-full bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs font-semibold cursor-pointer"
                title="Change Photo"
              >
                <Camera className="h-5 w-5 mb-1 text-brand" />
                <span>Change</span>
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
              className="text-xs text-brand hover:underline font-semibold"
            >
              Upload new picture
            </button>
          </div>

          {/* Full Name */}
          <div>
            <label className="block text-xs font-semibold text-white mb-1.5" htmlFor="edit-profile-name">
              Full Name
            </label>
            <input
              id="edit-profile-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input text-sm"
              placeholder="e.g. John Doe"
              required
            />
          </div>

          {/* Email Address */}
          <div>
            <label className="block text-xs font-semibold text-white mb-1.5" htmlFor="edit-profile-email">
              Email Address
            </label>
            <input
              id="edit-profile-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input text-sm"
              placeholder="e.g. john@example.com"
              required
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#1E293B]">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="btn-secondary px-4 py-2 text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn-primary px-5 py-2 text-xs font-bold"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

