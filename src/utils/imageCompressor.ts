import imageCompression from 'browser-image-compression'

export async function compressImage(file: File): Promise<{ blob: Blob; thumbnail: Blob }> {
  const opts = { maxSizeMB: 1, maxWidthOrHeight: 1920, useWebWorker: true }
  const thumbOpts = { maxSizeMB: 0.05, maxWidthOrHeight: 200, useWebWorker: true }

  const [compressed, thumbnail] = await Promise.all([
    imageCompression(file, opts),
    imageCompression(file, thumbOpts),
  ])

  return { blob: compressed, thumbnail }
}

export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
