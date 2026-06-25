import { useState, useMemo, useRef } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval,
         isSameMonth, isToday, isFuture, parseISO, getYear, getMonth } from 'date-fns'
import { db } from '../../db/database'
import { blobToDataUrl } from '../../utils/imageCompressor'
import type { Milestone, MediaItem, MilestoneType } from '../../db/types'
import { TYPE_DOT_COLOR, MILESTONE_TEMPLATES } from '../../db/types'
import DayModal from './DayModal'

interface Props {
  profile?: { dob: string; name?: string }
  onAddMilestone: (date: string) => void
  onEditMilestone: (m: Milestone) => void
  onDeleteMilestone: (id: number) => void
}

const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function CalendarView({ profile, onAddMilestone, onEditMilestone, onDeleteMilestone }: Props) {
  const [current, setCurrent] = useState(() => new Date())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [yearMode, setYearMode] = useState(false)
  const touchStartX = useRef<number>(0)

  // Live milestones for this month ± buffer
  const allMilestones = useLiveQuery(() => db.milestones.toArray(), []) ?? []
  const allMedia      = useLiveQuery(() => db.media.toArray(), []) ?? []

  // Group milestones by date string
  const byDate = useMemo(() => {
    const map = new Map<string, Milestone[]>()
    for (const m of allMilestones) {
      const list = map.get(m.date) ?? []
      list.push(m)
      map.set(m.date, list)
    }
    return map
  }, [allMilestones])

  // First media item per milestone id → thumbnailBlob (only images)
  const thumbByMilestone = useMemo(() => {
    const map = new Map<number, MediaItem>()
    for (const item of allMedia) {
      if (item.kind === 'image' && !map.has(item.milestoneId)) {
        map.set(item.milestoneId, item)
      }
    }
    return map
  }, [allMedia])

  // Calendar grid days
  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(current))
    const end   = endOfWeek(endOfMonth(current))
    return eachDayOfInterval({ start, end })
  }, [current])

  function prevMonth() { setCurrent(d => new Date(d.getFullYear(), d.getMonth() - 1, 1)) }
  function nextMonth() { setCurrent(d => new Date(d.getFullYear(), d.getMonth() + 1, 1)) }
  function goToday()   { setCurrent(new Date()); setYearMode(false) }

  function handleDayClick(dateStr: string) {
    const milestones = byDate.get(dateStr)
    if (milestones?.length) {
      setSelectedDate(dateStr)
    } else {
      const d = parseISO(dateStr)
      if (!isFuture(d) || isToday(d)) {
        onAddMilestone(dateStr)
      }
    }
  }

  // Touch swipe for month navigation
  function onTouchStart(e: React.TouchEvent) { touchStartX.current = e.touches[0].clientX }
  function onTouchEnd(e: React.TouchEvent) {
    const dx = e.changedTouches[0].clientX - touchStartX.current
    if (Math.abs(dx) > 50) { dx < 0 ? nextMonth() : prevMonth() }
  }

  if (yearMode) {
    return <YearGrid current={current} byDate={byDate} onSelectMonth={(y, m) => {
      setCurrent(new Date(y, m, 1)); setYearMode(false)
    }} onBack={() => setYearMode(false)} />
  }

  return (
    <div className="select-none" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      {/* Month nav */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={prevMonth} className="w-9 h-9 flex items-center justify-center rounded-full bg-white shadow-sm hover:bg-rose-50 text-slate-600 text-lg transition-colors">‹</button>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setYearMode(true)}
            className="font-extrabold text-slate-800 text-xl hover:text-rose-500 transition-colors"
          >
            {format(current, 'MMMM yyyy')}
          </button>
          <button onClick={goToday} className="text-xs px-2 py-1 rounded-full bg-rose-100 text-rose-600 font-semibold hover:bg-rose-200 transition-colors">
            Today
          </button>
        </div>
        <button onClick={nextMonth} className="w-9 h-9 flex items-center justify-center rounded-full bg-white shadow-sm hover:bg-rose-50 text-slate-600 text-lg transition-colors">›</button>
      </div>

      {/* Day-of-week headers */}
      <div className="grid grid-cols-7 mb-1">
        {DOW.map(d => (
          <div key={d} className="text-center text-xs font-bold text-slate-400 py-1">{d}</div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-1">
        {days.map(day => {
          const dateStr   = format(day, 'yyyy-MM-dd')
          const inMonth   = isSameMonth(day, current)
          const today     = isToday(day)
          const future    = isFuture(day) && !today
          const entries   = byDate.get(dateStr) ?? []
          const hasEntry  = entries.length > 0
          const types     = [...new Set(entries.map(e => e.type as MilestoneType))].slice(0, 3)
          const firstMedia = hasEntry ? thumbByMilestone.get(entries[0].id!) : undefined

          return (
            <DayCell
              key={dateStr}
              dateStr={dateStr}
              day={day}
              inMonth={inMonth}
              today={today}
              future={future}
              hasEntry={hasEntry}
              entryCount={entries.length}
              types={types}
              firstMedia={firstMedia}
              titles={entries.map(e => e.title)}
              onClick={() => inMonth && handleDayClick(dateStr)}
            />
          )
        })}
      </div>

      {/* Legend */}
      <MilestoneLegend />

      {/* Day modal */}
      {selectedDate && (
        <DayModal
          date={selectedDate}
          profile={profile}
          onClose={() => setSelectedDate(null)}
          onAdd={() => { setSelectedDate(null); onAddMilestone(selectedDate) }}
          onEdit={m => { setSelectedDate(null); onEditMilestone(m) }}
          onDelete={id => { onDeleteMilestone(id) }}
        />
      )}
    </div>
  )
}

// ── Day Cell ─────────────────────────────────────────────────────────────────

interface DayCellProps {
  dateStr: string
  day: Date
  inMonth: boolean
  today: boolean
  future: boolean
  hasEntry: boolean
  entryCount: number
  types: MilestoneType[]
  firstMedia?: MediaItem
  titles: string[]
  onClick: () => void
}

function DayCell({ dateStr, day, inMonth, today, future, hasEntry, entryCount, types, firstMedia, titles, onClick }: DayCellProps) {
  const [thumbUrl, setThumbUrl] = useState<string>('')

  useMemo(() => {
    if (firstMedia?.thumbnailBlob ?? firstMedia?.blob) {
      blobToDataUrl((firstMedia.thumbnailBlob ?? firstMedia.blob)!).then(setThumbUrl)
    } else {
      setThumbUrl('')
    }
  }, [firstMedia?.id])

  const dayNum = day.getDate()

  const base = 'relative rounded-xl aspect-square flex flex-col items-center justify-start pt-1 transition-all cursor-pointer text-center overflow-hidden'
  const stateClass = !inMonth
    ? 'opacity-30 cursor-default'
    : future
      ? 'opacity-40 cursor-default'
      : hasEntry
        ? 'bg-rose-50 hover:bg-rose-100 ring-1 ring-rose-200'
        : 'bg-white hover:bg-slate-50'

  return (
    <div
      className={`${base} ${stateClass} ${today ? 'ring-2 ring-rose-400 ring-offset-1' : ''}`}
      onClick={onClick}
      title={titles.join(' · ')}
    >
      {/* Thumbnail bg */}
      {thumbUrl && (
        <img src={thumbUrl} className="absolute inset-0 w-full h-full object-cover opacity-20 rounded-xl" alt="" />
      )}

      {/* Day number */}
      <span className={`relative z-10 text-xs font-bold leading-none ${today ? 'text-rose-600' : hasEntry ? 'text-rose-700' : 'text-slate-400'}`}>
        {dayNum}
      </span>

      {/* Count badge */}
      {hasEntry && entryCount > 0 && (
        <span className="relative z-10 mt-0.5 bg-rose-400 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center leading-none">
          {entryCount > 9 ? '9+' : entryCount}
        </span>
      )}

      {/* Type dots */}
      {types.length > 0 && (
        <div className="relative z-10 flex gap-0.5 mt-auto mb-1">
          {types.map(t => (
            <span key={t} className={`w-1.5 h-1.5 rounded-full ${TYPE_DOT_COLOR[t]}`} />
          ))}
        </div>
      )}
    </div>
  )
}

// ── Legend ───────────────────────────────────────────────────────────────────

function MilestoneLegend() {
  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {MILESTONE_TEMPLATES.filter(t => t.type !== 'custom').map(t => (
        <div key={t.type} className="flex items-center gap-1 text-xs text-slate-500">
          <span className={`w-2 h-2 rounded-full ${TYPE_DOT_COLOR[t.type]}`} />
          {t.label}
        </div>
      ))}
    </div>
  )
}

// ── Year grid ─────────────────────────────────────────────────────────────────

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function YearGrid({ current, byDate, onSelectMonth, onBack }: {
  current: Date
  byDate: Map<string, Milestone[]>
  onSelectMonth: (y: number, m: number) => void
  onBack: () => void
}) {
  const year = getYear(current)
  const nowMonth = getMonth(new Date())
  const nowYear  = getYear(new Date())

  return (
    <div className="animate-fade-in">
      <div className="flex items-center gap-3 mb-4">
        <button onClick={onBack} className="w-9 h-9 flex items-center justify-center rounded-full bg-white shadow-sm text-slate-600 hover:bg-rose-50">‹</button>
        <span className="font-extrabold text-slate-800 text-xl">{year}</span>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {MONTHS.map((name, m) => {
          // Count milestones in this month/year
          let count = 0
          for (const [k, v] of byDate) {
            const [ky, km] = k.split('-').map(Number)
            if (ky === year && km - 1 === m) count += v.length
          }
          const isCur = year === nowYear && m === nowMonth
          return (
            <button
              key={m}
              onClick={() => onSelectMonth(year, m)}
              className={`py-3 rounded-2xl font-semibold text-sm transition-all flex flex-col items-center gap-1 ${
                isCur ? 'bg-rose-400 text-white' : 'bg-white text-slate-600 hover:bg-rose-50'
              }`}
            >
              {name}
              {count > 0 && <span className={`text-xs font-bold ${isCur ? 'text-rose-100' : 'text-rose-400'}`}>{count}</span>}
            </button>
          )
        })}
      </div>
    </div>
  )
}
