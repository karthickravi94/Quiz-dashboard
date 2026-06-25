import { useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, deleteMilestone } from '../../db/database'
import MilestoneCard from '../milestone/MilestoneCard'
import type { Milestone } from '../../db/types'
import { formatDateDisplay } from '../../utils/ageCalculator'

interface Props {
  profile?: { dob: string }
  filterDate?: string | null
  onEdit: (m: Milestone) => void
  onAdd: () => void
}

export default function TimelineView({ profile, filterDate, onEdit, onAdd }: Props) {
  const milestones = useLiveQuery(() => db.milestones.orderBy('date').toArray(), []) ?? []

  const filtered = useMemo(() => {
    if (filterDate) return milestones.filter(m => m.date === filterDate)
    return milestones
  }, [milestones, filterDate])

  // Group by date
  const grouped = useMemo(() => {
    const map = new Map<string, Milestone[]>()
    for (const m of filtered) {
      const list = map.get(m.date) ?? []
      list.push(m)
      map.set(m.date, list)
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]))
  }, [filtered])

  async function handleDelete(id: number) {
    await deleteMilestone(id)
  }

  if (!milestones.length) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <span className="text-6xl mb-4">👶</span>
        <h3 className="text-xl font-bold text-slate-600 mb-2">No milestones yet</h3>
        <p className="text-slate-400 mb-6 max-w-xs">Start capturing the precious first moments of your baby's journey!</p>
        <button
          onClick={onAdd}
          className="px-6 py-3 bg-rose-500 text-white font-bold rounded-2xl hover:bg-rose-600 transition-colors"
        >
          Add First Milestone 🎉
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {filterDate && (
        <div className="bg-rose-100 text-rose-700 text-sm font-semibold px-4 py-2 rounded-2xl">
          Showing milestones for {formatDateDisplay(filterDate)}
        </div>
      )}

      {grouped.length === 0 && (
        <div className="text-center py-10 text-slate-400">
          No milestones on this date.
        </div>
      )}

      {grouped.map(([date, items]) => (
        <div key={date}>
          {/* Date header */}
          <div className="flex items-center gap-3 mb-3">
            <div className="w-3 h-3 rounded-full bg-rose-300 shrink-0" />
            <h3 className="font-bold text-slate-600 text-sm">{formatDateDisplay(date)}</h3>
            <div className="flex-1 h-px bg-rose-100" />
          </div>
          <div className="pl-6 space-y-3">
            {items.map(m => (
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
      ))}
    </div>
  )
}
