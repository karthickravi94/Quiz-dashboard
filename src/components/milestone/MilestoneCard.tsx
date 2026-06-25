import { useState, useEffect } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, deleteMedia } from '../../db/database'
import { blobToDataUrl } from '../../utils/imageCompressor'
import { calcAge, formatDateDisplay } from '../../utils/ageCalculator'
import { useToast } from '../common/Toast'
import ConfirmModal from '../common/ConfirmModal'
import MediaLightbox from './MediaLightbox'
import type { Milestone, MediaItem } from '../../db/types'
import { MILESTONE_TEMPLATES, TYPE_BG_LIGHT, TYPE_DOT_COLOR } from '../../db/types'

interface Props {
  milestone: Milestone
  dob?: string
  onEdit: (m: Milestone) => void
  onDelete: (id: number) => void
}

export default function MilestoneCard({ milestone, dob, onEdit, onDelete }: Props) {
  const { toast } = useToast()
  const [thumbUrls, setThumbUrls] = useState<Map<number, string>>(new Map())
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const mediaItems = useLiveQuery(
    () => db.media.where('milestoneId').equals(milestone.id!).toArray(),
    [milestone.id]
  ) ?? []

  useEffect(() => {
    async function load() {
      const map = new Map<number, string>()
      for (const item of mediaItems) {
        if (item.kind === 'image') {
          map.set(item.id!, await blobToDataUrl(item.thumbnailBlob ?? item.blob))
        }
      }
      setThumbUrls(map)
    }
    if (mediaItems.length) load()
  }, [mediaItems])

  const tmpl = MILESTONE_TEMPLATES.find(t => t.type === milestone.type)
  const age  = dob ? calcAge(dob, milestone.date) : null

  return (
    <>
      <div className="bg-white rounded-2xl shadow-sm border border-rose-50 p-4 animate-fade-in">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-3xl shrink-0">{tmpl?.emoji ?? '✨'}</span>
            <div className="min-w-0">
              <h3 className="font-bold text-slate-800 text-base leading-tight truncate">{milestone.title}</h3>
              <p className="text-xs text-slate-400 mt-0.5">{formatDateDisplay(milestone.date)}</p>
            </div>
          </div>
          <div className="flex gap-1 shrink-0">
            <button
              onClick={() => onEdit(milestone)}
              className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors text-sm"
            >✏️</button>
            <button
              onClick={() => setConfirmDelete(true)}
              className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-rose-100 flex items-center justify-center text-slate-400 hover:text-rose-500 transition-colors text-sm"
            >🗑️</button>
          </div>
        </div>

        {/* Badge + age */}
        <div className="flex items-center gap-2 mb-3">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${TYPE_BG_LIGHT[milestone.type]}`}>
            <span className={`inline-block w-2 h-2 rounded-full mr-1 ${TYPE_DOT_COLOR[milestone.type]}`} />
            {tmpl?.label ?? 'Custom'}
          </span>
          {age && <span className="text-xs text-rose-400 font-medium">🎂 {age}</span>}
        </div>

        {/* Description */}
        {milestone.description && (
          <p className="text-sm text-slate-500 mb-3 leading-relaxed">{milestone.description}</p>
        )}

        {/* Media grid */}
        {mediaItems.length > 0 && (
          <div className="grid grid-cols-4 gap-1.5">
            {mediaItems.slice(0, 7).map((item, i) => (
              <div
                key={item.id}
                className="aspect-square rounded-xl overflow-hidden bg-slate-100 cursor-pointer hover:opacity-90 transition-opacity relative"
                onClick={() => setLightboxIdx(i)}
              >
                {item.kind === 'image' && thumbUrls.get(item.id!) ? (
                  <img src={thumbUrls.get(item.id!)} className="w-full h-full object-cover" alt="" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl">🎬</div>
                )}
                {i === 6 && mediaItems.length > 7 && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white font-bold text-sm">
                    +{mediaItems.length - 7}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {lightboxIdx !== null && (
        <MediaLightbox items={mediaItems} startIndex={lightboxIdx} onClose={() => setLightboxIdx(null)} />
      )}

      {confirmDelete && (
        <ConfirmModal
          title="Delete milestone?"
          message={`"${milestone.title}" and all its photos will be permanently deleted.`}
          confirmLabel="Delete"
          danger
          onConfirm={() => { onDelete(milestone.id!); setConfirmDelete(false); toast('Milestone deleted') }}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
    </>
  )
}
