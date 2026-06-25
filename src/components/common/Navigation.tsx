import type { BabyProfile } from '../../db/types'

type View = 'calendar' | 'timeline' | 'grid'

interface Props {
  view: View
  setView: (v: View) => void
  profile: BabyProfile | undefined
  onEditProfile: () => void
  onExport: () => void
}

const VIEWS: { id: View; label: string; icon: string }[] = [
  { id: 'calendar', label: 'Calendar', icon: '📅' },
  { id: 'timeline', label: 'Timeline', icon: '📖' },
  { id: 'grid',     label: 'Grid',     icon: '⊞' },
]

export default function Navigation({ view, setView, profile, onEditProfile, onExport }: Props) {
  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-rose-100 shadow-sm no-print">
      <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
        {/* Logo / Profile */}
        <button
          onClick={onEditProfile}
          className="flex items-center gap-2 min-w-0 hover:opacity-80 transition-opacity"
        >
          <span className="text-2xl">👶</span>
          <span className="font-extrabold text-rose-600 text-lg truncate hidden sm:block">
            {profile?.name ?? 'Baby Milestones'}
          </span>
        </button>

        {/* View tabs */}
        <div className="flex bg-rose-50 rounded-2xl p-1 gap-0.5">
          {VIEWS.map(v => (
            <button
              key={v.id}
              onClick={() => setView(v.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold transition-all ${
                view === v.id
                  ? 'bg-rose-400 text-white shadow-sm'
                  : 'text-rose-400 hover:text-rose-600'
              }`}
            >
              <span className="text-base">{v.icon}</span>
              <span className="hidden sm:inline">{v.label}</span>
            </button>
          ))}
        </div>

        {/* Export */}
        <button
          onClick={onExport}
          className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-rose-100 text-rose-600 font-semibold text-sm hover:bg-rose-200 transition-colors"
        >
          <span>↗</span>
          <span className="hidden sm:inline">Export</span>
        </button>
      </div>
    </header>
  )
}
