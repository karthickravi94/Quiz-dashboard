import { useLiveQuery } from 'dexie-react-hooks'
import { db, deleteMilestone } from '../../db/database'
import { formatDateDisplay } from '../../utils/ageCalculator'
import MilestoneCard from '../milestone/MilestoneCard'
import type { Milestone } from '../../db/types'

interface Props {
  date: string
  profile?: { dob: string; name?: string }
  onClose: () => void
  onAdd: () => void
  onEdit: (m: Milestone) => void
  onDelete: (id: number) => void
}

export default function DayModal({ date, profile, onClose, onAdd, onEdit, onDelete }: Props) {
  const milestones = useLiveQuery(
    () => db.milestones.where('date').equals(date).toArray(),
    [date]
  ) ?? []

  async function handleDelete(id: number) {
    await deleteMilestone(id)
    onDelete(id)
    if (milestones.length <= 1) onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div
        className="bg-rose-50 w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl shadow-xl flex flex-col max-h-[85vh] animate-slide-up"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div>
            <h2 className="text-lg font-extrabold text-slate-800">{formatDateDisplay(date)}</h2>
            <p className="text-sm text-slate-400">{milestones.length} milestone{milestones.length !== 1 ? 's' : ''}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onAdd}
              className="px-3 py-2 rounded-2xl bg-rose-400 text-white text-sm font-semibold hover:bg-rose-500 transition-colors"
            >
              + Add
            </button>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-white text-slate-400 hover:text-slate-600 shadow-sm">×</button>
          </div>
        </div>

        <div className="overflow-y-auto flex-1 px-5 pb-5 space-y-3">
          {milestones.map(m => (
            <MilestoneCard
              key={m.id}
              milestone={m}
              dob={profile?.dob}
              onEdit={onEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
