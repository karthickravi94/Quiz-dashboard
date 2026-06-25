import { useState, useEffect } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, deleteMilestone } from '../../db/database'
import { blobToDataUrl } from '../../utils/imageCompressor'
import { calcAge, formatDateDisplay } from '../../utils/ageCalculator'
import ConfirmModal from '../common/ConfirmModal'
import { useToast } from '../common/Toast'
import type { Milestone } from '../../db/types'
import { MILESTONE_TEMPLATES, TYPE_BG_LIGHT } from '../../db/types'

interface Props {
  profile?: { dob: string }
  onEdit: (m: Milestone) => void
  onAdd: () => void
}

export default function GridView({ profile, onEdit, onAdd }: Props) {
  const milestones = useLiveQuery(() => db.milestones.orderBy('date').toArray(), []) ?? []
  // `.where()` requires an indexed field — use `.filter()` for non-indexed `kind`
  const allMedia   = useLiveQuery(() => db.media.filter(m => m.kind === 'image').toArray(), []) ?? []

  const [urls, setUrls] = useState<Map<number, string>>(new Map())

  useEffect(() => {
    async function load() {
      const firstByMilestone = new Map<number, Blob>()
      for (const item of allMedia) {
        if (!firstByMilestone.has(item.milestoneId)) {
          firstByMilestone.set(item.milestoneId, item.thumbnailBlob ?? item.blob)
        }
      }
      const map = new Map<number, string>()
      for (const [mid, blob] of firstByMilestone) {
        map.set(mid, await blobToDataUrl(blob))
      }
      setUrls(map)
    }
    if (allMedia.length) load()
  }, [allMedia])

  if (!milestones.length) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <span className="text-6xl mb-4">📸</span>
        <h3 className="text-xl font-bold text-slate-600 mb-2">No milestones yet</h3>
        <p className="text-slate-400 mb-6 max-w-xs">Your photo grid will fill up here as you add milestones!</p>
        <button onClick={onAdd} className="px-6 py-3 bg-rose-500 text-white font-bold rounded-2xl hover:bg-rose-600 transition-colors">
          Add First Milestone 🎉
        </button>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {milestones.map(m => (
        <GridCard
          key={m.id}
          milestone={m}
          thumbUrl={urls.get(m.id!)}
          dob={profile?.dob}
          onEdit={() => onEdit(m)}
        />
      ))}
    </div>
  )
}

function GridCard({ milestone, thumbUrl, dob, onEdit }: {
  milestone: Milestone
  thumbUrl?: string
  dob?: string
  onEdit: () => void
}) {
  const { toast } = useToast()
  const [confirm, setConfirm] = useState(false)
  const tmpl = MILESTONE_TEMPLATES.find(t => t.type === milestone.type)
  const age  = dob ? calcAge(dob, milestone.date) : null

  async function handleDelete() {
    await deleteMilestone(milestone.id!)
    toast('Milestone deleted')
  }

  return (
    <>
      <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-rose-50 group animate-fade-in">
        {/* Photo area */}
        <div className="aspect-square relative bg-rose-50">
          {thumbUrl
            ? <img src={thumbUrl} className="w-full h-full object-cover" alt={milestone.title} />
            : <div className="w-full h-full flex items-center justify-center text-5xl">{tmpl?.emoji ?? '✨'}</div>
          }
          {/* Action overlay */}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
            <button
              onClick={onEdit}
              className="w-9 h-9 bg-white rounded-full flex items-center justify-center text-slate-700 shadow hover:scale-110 transition-transform"
            >✏️</button>
            <button
              onClick={() => setConfirm(true)}
              className="w-9 h-9 bg-white rounded-full flex items-center justify-center text-rose-500 shadow hover:scale-110 transition-transform"
            >🗑️</button>
          </div>
        </div>

        {/* Info */}
        <div className="p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${TYPE_BG_LIGHT[milestone.type]}`}>
              {tmpl?.label ?? 'Custom'}
            </span>
          </div>
          <h4 className="font-bold text-slate-800 text-sm leading-tight truncate">{milestone.title}</h4>
          <p className="text-xs text-slate-400 mt-0.5">{formatDateDisplay(milestone.date)}</p>
          {age && <p className="text-xs text-rose-400 font-medium mt-0.5">🎂 {age}</p>}
        </div>
      </div>

      {confirm && (
        <ConfirmModal
          title="Delete milestone?"
          message={`"${milestone.title}" will be permanently deleted.`}
          confirmLabel="Delete"
          danger
          onConfirm={() => { handleDelete(); setConfirm(false) }}
          onCancel={() => setConfirm(false)}
        />
      )}
    </>
  )
}
