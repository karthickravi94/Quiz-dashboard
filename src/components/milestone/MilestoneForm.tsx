import { useState, useRef, useEffect } from 'react'
import { addMilestone, updateMilestone, addMedia, getMediaForMilestone, deleteMedia } from '../../db/database'
import { compressImage, blobToDataUrl, formatBytes } from '../../utils/imageCompressor'
import { calcAge } from '../../utils/ageCalculator'
import { useToast } from '../common/Toast'
import MediaLightbox from './MediaLightbox'
import type { Milestone, MediaItem, MilestoneType } from '../../db/types'
import { MILESTONE_TEMPLATES, TYPE_BG_LIGHT } from '../../db/types'

interface Props {
  profile?: { dob: string }
  initialDate?: string
  existing?: Milestone
  onDone: () => void
  onCancel: () => void
}

export default function MilestoneForm({ profile, initialDate, existing, onDone, onCancel }: Props) {
  const { toast } = useToast()
  const today = new Date().toISOString().slice(0, 10)

  const [type, setType]   = useState<MilestoneType>(existing?.type ?? 'custom')
  const [title, setTitle] = useState(existing?.title ?? '')
  const [date, setDate]   = useState(existing?.date ?? initialDate ?? today)
  const [desc, setDesc]   = useState(existing?.description ?? '')
  const [media, setMedia] = useState<MediaItem[]>([])
  const [thumbUrls, setThumbUrls] = useState<Map<number | string, string>>(new Map())
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  // Load existing media
  useEffect(() => {
    if (existing?.id) {
      getMediaForMilestone(existing.id).then(items => {
        setMedia(items)
        loadThumbs(items)
      })
    }
  }, [existing?.id])

  async function loadThumbs(items: MediaItem[]) {
    const map = new Map<number | string, string>()
    for (const item of items) {
      if (item.kind === 'image') {
        map.set(item.id!, await blobToDataUrl(item.thumbnailBlob ?? item.blob))
      }
    }
    setThumbUrls(new Map(map))
  }

  // Auto-fill title from template
  function selectType(t: MilestoneType) {
    setType(t)
    const tmpl = MILESTONE_TEMPLATES.find(x => x.type === t)
    if (tmpl && !title) setTitle(tmpl.label)
  }

  async function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return

    for (const file of files) {
      const isImage = file.type.startsWith('image/')
      const isVideo = file.type.startsWith('video/')
      if (!isImage && !isVideo) continue

      if (isImage) {
        const { blob, thumbnail } = await compressImage(file)
        const tempId = `temp-${Date.now()}-${Math.random()}`
        const item: MediaItem = {
          id: tempId as unknown as number,
          milestoneId: existing?.id ?? 0,
          kind: 'image',
          blob,
          thumbnailBlob: thumbnail,
          filename: file.name,
          size: blob.size,
        }
        setMedia(prev => [...prev, item])
        const url = await blobToDataUrl(thumbnail)
        setThumbUrls(prev => new Map(prev).set(tempId as unknown as number, url))
      } else {
        const tempId = `temp-${Date.now()}-${Math.random()}`
        const item: MediaItem = {
          id: tempId as unknown as number,
          milestoneId: existing?.id ?? 0,
          kind: 'video',
          blob: file,
          filename: file.name,
          size: file.size,
        }
        setMedia(prev => [...prev, item])
      }
    }
    e.target.value = ''
  }

  async function removeMedia(item: MediaItem) {
    const tempId = String(item.id)
    if (!tempId.startsWith('temp-') && typeof item.id === 'number') {
      await deleteMedia(item.id)
    }
    setMedia(prev => prev.filter(m => m.id !== item.id))
    setThumbUrls(prev => { const m = new Map(prev); m.delete(item.id!); return m })
  }

  async function handleSave() {
    if (!title.trim()) { toast('Please add a title', 'error'); return }
    if (!date)         { toast('Please pick a date', 'error'); return }
    setSaving(true)

    try {
      let milestoneId: number

      if (existing?.id) {
        await updateMilestone(existing.id, { type, title: title.trim(), date, description: desc })
        milestoneId = existing.id
      } else {
        milestoneId = await addMilestone({ type, title: title.trim(), date, description: desc, createdAt: Date.now() })
      }

      // Persist new (temp) media
      for (const item of media) {
        const tempId = String(item.id)
        if (tempId.startsWith('temp-')) {
          await addMedia({ ...item, milestoneId })
        }
      }

      toast(existing ? 'Milestone updated!' : 'Milestone saved!')
      onDone()
    } catch {
      toast('Failed to save', 'error')
    } finally {
      setSaving(false)
    }
  }

  const age = profile?.dob && date ? calcAge(profile.dob, date) : null
  const tmpl = MILESTONE_TEMPLATES.find(t => t.type === type)

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onCancel}>
      <div
        className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl shadow-xl flex flex-col max-h-[92vh] animate-slide-up"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-rose-50">
          <h2 className="text-lg font-extrabold text-slate-800">
            {existing ? 'Edit Milestone' : 'Add Milestone'}
          </h2>
          <button onClick={onCancel} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 text-lg">×</button>
        </div>

        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">

          {/* Type selector */}
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2 block">Milestone Type</label>
            <div className="grid grid-cols-3 gap-2">
              {MILESTONE_TEMPLATES.map(t => (
                <button
                  key={t.type}
                  type="button"
                  onClick={() => selectType(t.type)}
                  className={`flex flex-col items-center gap-1 py-2.5 px-1 rounded-2xl border text-xs font-semibold transition-all ${
                    type === t.type
                      ? `${TYPE_BG_LIGHT[t.type]} border-transparent ring-2 ring-offset-1 ring-rose-300`
                      : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  <span className="text-xl">{t.emoji}</span>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <label className="block">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1 block">Title *</span>
            <div className="flex items-center gap-2 border border-rose-200 rounded-2xl px-4 py-3 focus-within:ring-2 focus-within:ring-rose-300">
              <span className="text-xl">{tmpl?.emoji ?? '✨'}</span>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. First Giggle"
                className="flex-1 text-slate-800 focus:outline-none"
              />
            </div>
          </label>

          {/* Date + age */}
          <div className="flex gap-3 items-end">
            <label className="flex-1 block">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1 block">Date *</span>
              <input
                type="date"
                value={date}
                max={today}
                onChange={e => setDate(e.target.value)}
                className="w-full border border-rose-200 rounded-2xl px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-300"
              />
            </label>
            {age && (
              <div className="bg-rose-50 rounded-2xl px-3 py-3 text-xs text-rose-600 font-semibold whitespace-nowrap">
                🎂 {age}
              </div>
            )}
          </div>

          {/* Notes */}
          <label className="block">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1 block">Notes</span>
            <textarea
              value={desc}
              onChange={e => setDesc(e.target.value)}
              rows={3}
              placeholder="How did it happen? What did you feel?"
              className="w-full border border-rose-200 rounded-2xl px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-300 resize-none"
            />
          </label>

          {/* Media */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Photos & Videos</span>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="text-xs font-semibold text-rose-500 hover:text-rose-600 flex items-center gap-1"
              >
                + Add
              </button>
            </div>
            <input ref={fileRef} type="file" accept="image/*,video/*" multiple className="hidden" onChange={handleFiles} />

            {media.length > 0 && (
              <div className="grid grid-cols-4 gap-2">
                {media.map((item, i) => (
                  <div key={String(item.id)} className="relative group aspect-square rounded-xl overflow-hidden bg-slate-100">
                    {item.kind === 'image' && thumbUrls.get(item.id!) ? (
                      <img
                        src={thumbUrls.get(item.id!)}
                        className="w-full h-full object-cover cursor-pointer"
                        onClick={() => setLightboxIdx(i)}
                        alt=""
                      />
                    ) : (
                      <div
                        className="w-full h-full flex items-center justify-center text-2xl cursor-pointer"
                        onClick={() => setLightboxIdx(i)}
                      >🎬</div>
                    )}
                    <button
                      onClick={() => removeMedia(item)}
                      className="absolute top-1 right-1 w-5 h-5 bg-black/60 rounded-full text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >×</button>
                    <div className="absolute bottom-0 left-0 right-0 bg-black/40 text-white text-[9px] px-1 py-0.5 truncate opacity-0 group-hover:opacity-100 transition-opacity">
                      {formatBytes(item.size)}
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="aspect-square rounded-xl border-2 border-dashed border-rose-200 flex items-center justify-center text-rose-300 hover:border-rose-400 hover:text-rose-400 transition-colors text-2xl"
                >+</button>
              </div>
            )}

            {media.length === 0 && (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="w-full border-2 border-dashed border-rose-200 rounded-2xl py-6 flex flex-col items-center gap-2 text-rose-300 hover:border-rose-400 hover:text-rose-400 transition-colors"
              >
                <span className="text-3xl">📷</span>
                <span className="text-sm font-semibold">Add photos or videos</span>
              </button>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-rose-50 flex gap-3">
          <button onClick={onCancel} className="flex-1 py-3 rounded-2xl bg-slate-100 text-slate-600 font-semibold hover:bg-slate-200 transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-2 flex-grow py-3 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-bold transition-colors disabled:opacity-60"
          >
            {saving ? 'Saving…' : existing ? 'Save Changes' : 'Save Milestone 🎉'}
          </button>
        </div>
      </div>

      {lightboxIdx !== null && (
        <MediaLightbox items={media} startIndex={lightboxIdx} onClose={() => setLightboxIdx(null)} />
      )}
    </div>
  )
}
