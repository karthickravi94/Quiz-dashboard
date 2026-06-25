interface Props {
  title: string
  message: string
  confirmLabel?: string
  onConfirm: () => void
  onCancel: () => void
  danger?: boolean
}

export default function ConfirmModal({ title, message, confirmLabel = 'Confirm', onConfirm, onCancel, danger = false }: Props) {
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onCancel}>
      <div
        className="bg-white rounded-3xl shadow-xl p-6 w-full max-w-sm animate-bounce-in"
        onClick={e => e.stopPropagation()}
      >
        <h3 className="text-lg font-bold text-slate-800 mb-2">{title}</h3>
        <p className="text-slate-500 text-sm mb-6">{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-2xl bg-slate-100 text-slate-600 font-semibold hover:bg-slate-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 py-2.5 rounded-2xl font-semibold transition-colors ${
              danger ? 'bg-rose-500 hover:bg-rose-600 text-white' : 'bg-rose-400 hover:bg-rose-500 text-white'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
