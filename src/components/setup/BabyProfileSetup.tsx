import { useState, useRef, useEffect } from 'react'
import { saveProfile } from '../../db/database'
import { compressImage, blobToDataUrl } from '../../utils/imageCompressor'
import { useToast } from '../common/Toast'
import type { BabyProfile } from '../../db/types'

interface Props {
  existing?: BabyProfile
  onDone: () => void
  isModal?: boolean
}

export default function BabyProfileSetup({ existing, onDone, isModal = false }: Props) {
  const { toast } = useToast()
  const [name, setName] = useState(existing?.name ?? '')
  const [dob, setDob]   = useState(existing?.dob ?? '')
  const [gender, setGender] = useState<'boy' | 'girl' | 'other' | ''>(existing?.gender ?? '')
  const [photoBlob, setPhotoBlob] = useState<Blob | undefined>(existing?.photoBlob)
  const [photoUrl, setPhotoUrl]   = useState<string>('')
  const [saving, setSaving] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (photoBlob) {
      blobToDataUrl(photoBlob).then(setPhotoUrl)
    }
  }, [photoBlob])

  async function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const { blob } = await compressImage(file)
    setPhotoBlob(blob)
  }

  async function handleSave() {
    if (!name.trim()) { toast('Please enter a name', 'error'); return }
    if (!dob)         { toast('Please enter a date of birth', 'error'); return }
    setSaving(true)
    try {
      await saveProfile({ name: name.trim(), dob, gender, photoBlob })
      toast('Profile saved!')
      onDone()
    } catch {
      toast('Failed to save profile', 'error')
    } finally {
      setSaving(false)
    }
  }

  const content = (
    <div className={isModal ? '' : 'min-h-screen bg-rose-50 flex items-center justify-center p-4'}>
      <div className={`bg-white rounded-3xl shadow-lg p-8 w-full max-w-md ${isModal ? '' : 'animate-bounce-in'}`}>
        <div className="text-center mb-6">
          <span className="text-5xl">👶</span>
          <h1 className="mt-3 text-2xl font-extrabold text-rose-600">
            {existing ? 'Edit Profile' : "Welcome!"}
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {existing ? 'Update the baby profile' : "Let's set up your baby's profile to get started"}
          </p>
        </div>

        {/* Photo */}
        <div className="flex justify-center mb-6">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-rose-200 hover:border-rose-400 transition-colors group"
          >
            {photoUrl
              ? <img src={photoUrl} className="w-full h-full object-cover" alt="Baby" />
              : <div className="w-full h-full bg-rose-50 flex items-center justify-center text-4xl">📷</div>
            }
            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold">
              Change
            </div>
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
        </div>

        {/* Name */}
        <label className="block mb-4">
          <span className="text-sm font-semibold text-slate-600 mb-1 block">Baby's Name *</span>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Lily"
            className="w-full border border-rose-200 rounded-2xl px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-300"
          />
        </label>

        {/* DOB */}
        <label className="block mb-4">
          <span className="text-sm font-semibold text-slate-600 mb-1 block">Date of Birth *</span>
          <input
            type="date"
            value={dob}
            max={new Date().toISOString().slice(0, 10)}
            onChange={e => setDob(e.target.value)}
            className="w-full border border-rose-200 rounded-2xl px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-300"
          />
        </label>

        {/* Gender */}
        <div className="mb-6">
          <span className="text-sm font-semibold text-slate-600 mb-2 block">Gender (optional)</span>
          <div className="flex gap-2">
            {(['boy', 'girl', 'other', ''] as const).map(g => (
              <button
                key={g}
                type="button"
                onClick={() => setGender(g)}
                className={`flex-1 py-2 rounded-2xl text-sm font-semibold border transition-colors ${
                  gender === g
                    ? 'bg-rose-400 text-white border-rose-400'
                    : 'bg-rose-50 text-rose-500 border-rose-200 hover:bg-rose-100'
                }`}
              >
                {g === 'boy' ? '👦 Boy' : g === 'girl' ? '👧 Girl' : g === 'other' ? '✨ Other' : '— Skip'}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-3.5 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-base transition-colors disabled:opacity-60"
        >
          {saving ? 'Saving…' : existing ? 'Save Changes' : "Let's Begin! 🎉"}
        </button>
      </div>
    </div>
  )

  if (!isModal) return content

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onDone}>
      <div onClick={e => e.stopPropagation()} className="animate-bounce-in w-full max-w-md">
        {content}
      </div>
    </div>
  )
}
