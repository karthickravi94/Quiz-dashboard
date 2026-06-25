import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, deleteMilestone } from './db/database'
import { ToastProvider } from './components/common/Toast'
import Navigation from './components/common/Navigation'
import BabyProfileSetup from './components/setup/BabyProfileSetup'
import CalendarView from './components/calendar/CalendarView'
import TimelineView from './components/timeline/TimelineView'
import GridView from './components/grid/GridView'
import MilestoneForm from './components/milestone/MilestoneForm'
import ExportModal from './components/export/ExportModal'
import type { Milestone } from './db/types'

type View = 'calendar' | 'timeline' | 'grid'

export default function App() {
  const profile = useLiveQuery(() => db.profile.get(1), [])

  const [view, setView]               = useState<View>('calendar')
  const [showProfileSetup, setShowProfileSetup] = useState(false)
  const [showExport, setShowExport]   = useState(false)
  const [addMilestoneDate, setAddMilestoneDate] = useState<string | null>(null)
  const [editMilestone, setEditMilestone]       = useState<Milestone | null>(null)

  const profileLoaded = profile !== undefined

  // First-run: no profile yet → show setup screen
  if (profileLoaded && !profile) {
    return (
      <ToastProvider>
        <BabyProfileSetup onDone={() => {}} />
      </ToastProvider>
    )
  }

  async function handleDeleteMilestone(id: number) {
    await deleteMilestone(id)
  }

  return (
    <ToastProvider>
      <div className="min-h-screen bg-rose-50">
        <Navigation
          view={view}
          setView={setView}
          profile={profile}
          onEditProfile={() => setShowProfileSetup(true)}
          onExport={() => setShowExport(true)}
        />

        {/* FAB — add milestone */}
        <button
          onClick={() => setAddMilestoneDate(new Date().toISOString().slice(0, 10))}
          className="fixed bottom-6 right-6 z-30 w-14 h-14 bg-rose-500 hover:bg-rose-600 text-white rounded-full shadow-lg flex items-center justify-center text-2xl transition-all hover:scale-110 no-print"
          title="Add milestone"
        >
          +
        </button>

        {/* Main content */}
        <main className="max-w-4xl mx-auto px-4 py-6">
          {view === 'calendar' && (
            <CalendarView
              profile={profile ?? undefined}
              onAddMilestone={date => setAddMilestoneDate(date)}
              onEditMilestone={m => setEditMilestone(m)}
              onDeleteMilestone={handleDeleteMilestone}
            />
          )}
          {view === 'timeline' && (
            <TimelineView
              profile={profile ?? undefined}
              onEdit={m => setEditMilestone(m)}
              onAdd={() => setAddMilestoneDate(new Date().toISOString().slice(0, 10))}
            />
          )}
          {view === 'grid' && (
            <GridView
              profile={profile ?? undefined}
              onEdit={m => setEditMilestone(m)}
              onAdd={() => setAddMilestoneDate(new Date().toISOString().slice(0, 10))}
            />
          )}
        </main>

        {/* Print view — timeline printed cleanly */}
        <div className="hidden print:block">
          <TimelineView
            profile={profile ?? undefined}
            onEdit={() => {}}
            onAdd={() => {}}
          />
        </div>

        {/* Modals */}
        {(addMilestoneDate || editMilestone) && (
          <MilestoneForm
            profile={profile ?? undefined}
            initialDate={addMilestoneDate ?? undefined}
            existing={editMilestone ?? undefined}
            onDone={() => { setAddMilestoneDate(null); setEditMilestone(null) }}
            onCancel={() => { setAddMilestoneDate(null); setEditMilestone(null) }}
          />
        )}

        {showProfileSetup && (
          <BabyProfileSetup
            existing={profile ?? undefined}
            onDone={() => setShowProfileSetup(false)}
            isModal
          />
        )}

        {showExport && (
          <ExportModal
            profile={profile ?? undefined}
            onClose={() => setShowExport(false)}
            onImportDone={() => setShowExport(false)}
          />
        )}
      </div>
    </ToastProvider>
  )
}
