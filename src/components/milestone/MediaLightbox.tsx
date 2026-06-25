import { useEffect, useState } from 'react'
import { blobToDataUrl } from '../../utils/imageCompressor'
import type { MediaItem } from '../../db/types'

interface Props {
  items: MediaItem[]
  startIndex: number
  onClose: () => void
}

export default function MediaLightbox({ items, startIndex, onClose }: Props) {
  const [idx, setIdx] = useState(startIndex)
  const [urls, setUrls] = useState<Map<number, string>>(new Map())

  useEffect(() => {
    async function load() {
      const map = new Map<number, string>()
      for (const item of items) {
        map.set(item.id!, await blobToDataUrl(item.blob))
      }
      setUrls(map)
    }
    load()
  }, [items])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowRight') setIdx(i => Math.min(i + 1, items.length - 1))
      if (e.key === 'ArrowLeft')  setIdx(i => Math.max(i - 1, 0))
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [items.length, onClose])

  const current = items[idx]
  if (!current) return null
  const url = urls.get(current.id!) ?? ''

  return (
    <div className="fixed inset-0 bg-black/90 z-[60] flex items-center justify-center" onClick={onClose}>
      <div className="relative max-w-3xl w-full max-h-screen flex flex-col items-center" onClick={e => e.stopPropagation()}>
        {/* Close */}
        <button onClick={onClose} className="absolute top-2 right-2 z-10 text-white bg-black/50 rounded-full w-9 h-9 flex items-center justify-center text-xl hover:bg-black/80">×</button>

        {/* Media */}
        <div className="flex items-center justify-center w-full h-full min-h-[300px] p-4">
          {!url
            ? <div className="text-white/50 text-sm">Loading…</div>
            : current.kind === 'image'
              ? <img src={url} className="max-w-full max-h-[80vh] rounded-2xl object-contain shadow-2xl" alt={current.filename} />
              : <video src={url} controls autoPlay className="max-w-full max-h-[80vh] rounded-2xl shadow-2xl" />
          }
        </div>

        {/* Nav arrows */}
        {items.length > 1 && (
          <>
            <button
              onClick={() => setIdx(i => Math.max(i - 1, 0))}
              disabled={idx === 0}
              className="absolute left-2 top-1/2 -translate-y-1/2 text-white bg-black/50 rounded-full w-10 h-10 flex items-center justify-center text-xl disabled:opacity-20 hover:bg-black/80"
            >‹</button>
            <button
              onClick={() => setIdx(i => Math.min(i + 1, items.length - 1))}
              disabled={idx === items.length - 1}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-white bg-black/50 rounded-full w-10 h-10 flex items-center justify-center text-xl disabled:opacity-20 hover:bg-black/80"
            >›</button>
            <div className="text-white/60 text-sm mt-2">{idx + 1} / {items.length}</div>
          </>
        )}
      </div>
    </div>
  )
}
