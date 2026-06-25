import { useState, useRef } from 'react'
import { exportZip, importZip, exportHtml, downloadBlob, downloadText } from '../../utils/exporters'
import { formatBytes } from '../../utils/imageCompressor'
import { useToast } from '../common/Toast'
import type { BabyProfile } from '../../db/types'

interface Props {
  profile: BabyProfile | undefined
  onClose: () => void
  onImportDone: () => void
}

export default function ExportModal({ profile, onClose, onImportDone }: Props) {
  const { toast } = useToast()
  const [loading, setLoading] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const slug = (profile?.name ?? 'baby').toLowerCase().replace(/\s+/g, '-')
  const babyName = profile?.name ?? 'Baby'

  async function doHtmlExport() {
    setLoading('html')
    try {
      const { html, sizeBytes } = await exportHtml(profile)
      if (sizeBytes > 50 * 1024 * 1024) toast(`Large file (${formatBytes(sizeBytes)}) — may be slow`, 'info')
      downloadText(html, `${slug}-milestones.html`)
      toast(`Saved ${formatBytes(sizeBytes)} HTML file ✓`)
    } catch { toast('Export failed', 'error') }
    finally { setLoading(null) }
  }

  async function doZipExport() {
    setLoading('zip')
    try {
      const { blob, sizeBytes } = await exportZip()
      downloadBlob(blob, `${slug}-backup.zip`)
      toast(`Saved ${formatBytes(sizeBytes)} backup ✓`)
    } catch { toast('Export failed', 'error') }
    finally { setLoading(null) }
  }

  function doPdfExport() {
    toast('Opening print dialog…', 'info')
    setTimeout(() => window.print(), 300)
  }

  async function processImportFile(file: File) {
    if (!file.name.endsWith('.zip')) { toast('Please choose a .zip backup file', 'error'); return }
    setLoading('import')
    try {
      await importZip(file)
      toast('Restored successfully! 🎉')
      onImportDone()
      onClose()
    } catch (err) {
      toast(`Import failed: ${err instanceof Error ? err.message : 'Unknown error'}`, 'error')
    } finally { setLoading(null) }
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) await processImportFile(file)
    e.target.value = ''
  }

  async function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) await processImportFile(file)
  }

  const busy = !!loading

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div
        className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[92vh] animate-slide-up overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Gradient header */}
        <div className="relative bg-gradient-to-br from-rose-400 to-pink-500 px-6 pt-8 pb-6 text-white">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 text-white text-xl transition-colors"
          >×</button>
          <div className="text-4xl mb-2">💌</div>
          <h2 className="text-xl font-extrabold">{babyName}'s Memories</h2>
          <p className="text-rose-100 text-sm mt-0.5">Share or back up — everything stays private on your device</p>
        </div>

        <div className="overflow-y-auto flex-1">
          {/* Export section */}
          <div className="px-5 pt-5 pb-1">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Save & Share</p>
            <div className="grid grid-cols-1 gap-3">

              {/* HTML */}
              <ActionCard
                gradient="from-sky-400 to-blue-500"
                icon="🌐"
                badge=".html"
                title="Shareable Web Page"
                desc="One offline file with all photos & stories embedded — send to grandparents, open on any device."
                actionLabel={loading === 'html' ? 'Generating…' : 'Download'}
                disabled={busy}
                onClick={doHtmlExport}
              />

              {/* Two-column row for PDF + ZIP */}
              <div className="grid grid-cols-2 gap-3">
                <ActionCard
                  gradient="from-violet-400 to-purple-500"
                  icon="🖨️"
                  badge=".pdf"
                  title="Print / PDF"
                  desc="Beautiful printed keepsake or PDF via your browser."
                  actionLabel="Print"
                  disabled={busy}
                  onClick={doPdfExport}
                  compact
                />
                <ActionCard
                  gradient="from-emerald-400 to-green-500"
                  icon="📦"
                  badge=".zip"
                  title="Full Backup"
                  desc="All original photos + data. Use to restore later."
                  actionLabel={loading === 'zip' ? 'Packing…' : 'Download'}
                  disabled={busy}
                  onClick={doZipExport}
                  compact
                />
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 px-5 py-4">
            <div className="flex-1 h-px bg-slate-100" />
            <span className="text-xs text-slate-300 font-semibold uppercase tracking-wider">Restore</span>
            <div className="flex-1 h-px bg-slate-100" />
          </div>

          {/* Import drop zone */}
          <div className="px-5 pb-6">
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => !busy && fileRef.current?.click()}
              className={`relative rounded-2xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center gap-2 py-7 px-4 text-center
                ${dragOver ? 'border-rose-400 bg-rose-50' : 'border-slate-200 bg-slate-50 hover:border-rose-300 hover:bg-rose-50/50'}
                ${busy ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {loading === 'import' ? (
                <>
                  <Spinner />
                  <p className="text-sm font-semibold text-slate-500">Restoring your memories…</p>
                </>
              ) : (
                <>
                  <span className="text-3xl">{dragOver ? '📂' : '📁'}</span>
                  <p className="font-bold text-slate-600 text-sm">Drop a .zip backup here</p>
                  <p className="text-xs text-slate-400">or tap to browse — <span className="text-rose-400 font-semibold">replaces current data</span></p>
                </>
              )}
            </div>
            <input ref={fileRef} type="file" accept=".zip" className="hidden" onChange={handleImport} />
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ActionCard({ gradient, icon, badge, title, desc, actionLabel, disabled, onClick, compact = false }: {
  gradient: string
  icon: string
  badge: string
  title: string
  desc: string
  actionLabel: string
  disabled: boolean
  onClick: () => void
  compact?: boolean
}) {
  return (
    <div className={`rounded-2xl overflow-hidden shadow-sm border border-white/60 ${compact ? '' : ''}`}>
      {/* Coloured top strip */}
      <div className={`bg-gradient-to-r ${gradient} px-4 py-3 flex items-center justify-between`}>
        <div className="flex items-center gap-2">
          <span className="text-2xl">{icon}</span>
          <span className="bg-white/25 text-white text-[11px] font-bold px-2 py-0.5 rounded-full">{badge}</span>
        </div>
        <button
          onClick={onClick}
          disabled={disabled}
          className="bg-white/20 hover:bg-white/35 text-white font-bold text-xs px-3 py-1.5 rounded-xl transition-colors disabled:opacity-50 whitespace-nowrap"
        >
          {actionLabel}
        </button>
      </div>
      {/* Body */}
      <div className={`bg-white px-4 ${compact ? 'py-2.5' : 'py-3'}`}>
        <p className="font-bold text-slate-700 text-sm">{title}</p>
        <p className={`text-slate-400 leading-snug ${compact ? 'text-[11px] mt-0.5' : 'text-xs mt-1'}`}>{desc}</p>
      </div>
    </div>
  )
}

function Spinner() {
  return (
    <svg className="w-8 h-8 animate-spin text-rose-400" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  )
}
