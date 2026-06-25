import { useEffect, useState, createContext, useContext, useCallback } from 'react'

type ToastKind = 'success' | 'error' | 'info'

interface ToastItem {
  id: number
  message: string
  kind: ToastKind
}

interface ToastCtx {
  toast: (msg: string, kind?: ToastKind) => void
}

const Ctx = createContext<ToastCtx>({ toast: () => {} })

let _id = 0

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])

  const toast = useCallback((message: string, kind: ToastKind = 'success') => {
    const id = ++_id
    setItems(prev => [...prev, { id, message, kind }])
    setTimeout(() => setItems(prev => prev.filter(t => t.id !== id)), 3200)
  }, [])

  return (
    <Ctx.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 items-center pointer-events-none no-print">
        {items.map(t => (
          <div
            key={t.id}
            className={`animate-toast-in px-5 py-3 rounded-2xl shadow-lg text-sm font-semibold pointer-events-auto flex items-center gap-2 ${
              t.kind === 'success' ? 'bg-green-500 text-white' :
              t.kind === 'error'   ? 'bg-rose-500 text-white' :
                                     'bg-slate-700 text-white'
            }`}
          >
            <span>{t.kind === 'success' ? '✓' : t.kind === 'error' ? '✕' : 'ℹ'}</span>
            {t.message}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  )
}

export function useToast() {
  return useContext(Ctx)
}
