import JSZip from 'jszip'
import { exportAll, importAll } from '../db/database'
import { blobToDataUrl } from './imageCompressor'
import { calcAge, formatDateDisplay } from './ageCalculator'
import type { BabyProfile, Milestone, MediaItem } from '../db/types'
import { MILESTONE_TEMPLATES } from '../db/types'

// ── ZIP export ───────────────────────────────────────────────────────────────

export async function exportZip(): Promise<{ blob: Blob; sizeBytes: number }> {
  const { profile, milestones, media } = await exportAll()
  const zip = new JSZip()

  // JSON manifest (no blobs)
  const manifest = {
    exportedAt: new Date().toISOString(),
    profile: profile.map(p => ({ ...p, photoBlob: undefined })),
    milestones,
    mediaIndex: media.map(m => ({ id: m.id, milestoneId: m.milestoneId, kind: m.kind, filename: m.filename, size: m.size })),
  }
  zip.file('manifest.json', JSON.stringify(manifest, null, 2))

  // Profile photo
  const prof = profile[0]
  if (prof?.photoBlob) zip.file('profile/photo.jpg', prof.photoBlob)

  // Media files
  for (const item of media) {
    const ext = item.filename.split('.').pop() ?? (item.kind === 'image' ? 'jpg' : 'mp4')
    zip.file(`media/${item.milestoneId}_${item.id}.${ext}`, item.blob)
  }

  const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } })
  return { blob, sizeBytes: blob.size }
}

// ── ZIP import ───────────────────────────────────────────────────────────────

export async function importZip(file: File): Promise<void> {
  const zip = await JSZip.loadAsync(file)
  const manifestFile = zip.file('manifest.json')
  if (!manifestFile) throw new Error('Invalid backup: manifest.json not found')

  const manifest = JSON.parse(await manifestFile.async('string')) as {
    profile: BabyProfile[]
    milestones: Milestone[]
    mediaIndex: Omit<MediaItem, 'blob' | 'thumbnailBlob'>[]
  }

  // Restore profile photo
  const profileData: BabyProfile[] = []
  for (const p of manifest.profile) {
    const photoFile = zip.file('profile/photo.jpg')
    const photoBlob = photoFile ? await photoFile.async('blob') : undefined
    profileData.push({ ...p, photoBlob })
  }

  // Restore media blobs
  const mediaData: MediaItem[] = []
  for (const idx of manifest.mediaIndex) {
    const ext = idx.filename.split('.').pop() ?? (idx.kind === 'image' ? 'jpg' : 'mp4')
    const zipPath = `media/${idx.milestoneId}_${idx.id}.${ext}`
    const mediaFile = zip.file(zipPath)
    if (!mediaFile) continue
    const blob = await mediaFile.async('blob')
    mediaData.push({ ...idx, blob, thumbnailBlob: undefined })
  }

  await importAll({ profile: profileData, milestones: manifest.milestones, media: mediaData })
}

// ── HTML export ──────────────────────────────────────────────────────────────

export async function exportHtml(profile: BabyProfile | undefined): Promise<{ html: string; sizeBytes: number }> {
  const { milestones, media } = await exportAll()

  // Pre-convert all media to data URLs
  const mediaDataUrls = new Map<number, string>()
  for (const item of media) {
    const url = await blobToDataUrl(item.thumbnailBlob ?? item.blob)
    mediaDataUrls.set(item.id!, url)
  }

  const profilePhotoUrl = profile?.photoBlob ? await blobToDataUrl(profile.photoBlob) : null

  // Group media by milestoneId
  const mediaByMilestone = new Map<number, MediaItem[]>()
  for (const item of media) {
    const list = mediaByMilestone.get(item.milestoneId) ?? []
    list.push(item)
    mediaByMilestone.set(item.milestoneId, list)
  }

  // Sort milestones
  const sorted = [...milestones].sort((a, b) => a.date.localeCompare(b.date))

  const milestonesHtml = sorted.map(m => {
    const tmpl = MILESTONE_TEMPLATES.find(t => t.type === m.type)
    const items = mediaByMilestone.get(m.id!) ?? []
    const age = profile?.dob ? calcAge(profile.dob, m.date) : ''
    const mediaHtml = items.map(item => {
      const src = mediaDataUrls.get(item.id!) ?? ''
      return item.kind === 'image'
        ? `<img src="${src}" style="width:180px;height:180px;object-fit:cover;border-radius:12px;margin:4px;" />`
        : `<video controls style="width:180px;height:180px;border-radius:12px;margin:4px;background:#000;" />`
    }).join('')

    return `
      <div style="background:white;border-radius:16px;padding:20px;margin-bottom:16px;box-shadow:0 2px 12px rgba(0,0,0,.08);">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
          <span style="font-size:28px;">${tmpl?.emoji ?? '✨'}</span>
          <div>
            <h2 style="margin:0;font-size:18px;font-weight:700;color:#1e293b;">${escHtml(m.title)}</h2>
            <p style="margin:0;font-size:13px;color:#64748b;">${formatDateDisplay(m.date)}${age ? ` · ${age}` : ''}</p>
          </div>
        </div>
        ${m.description ? `<p style="margin:8px 0;color:#475569;font-size:15px;">${escHtml(m.description)}</p>` : ''}
        ${mediaHtml ? `<div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:8px;">${mediaHtml}</div>` : ''}
      </div>`
  }).join('')

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${profile?.name ? escHtml(profile.name) + "'s Milestones" : 'Baby Milestones'}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Segoe UI',system-ui,sans-serif;background:#fff1f2;color:#1e293b;padding:20px}
  .header{background:white;border-radius:20px;padding:28px;margin-bottom:24px;box-shadow:0 2px 12px rgba(0,0,0,.08);display:flex;align-items:center;gap:20px}
  .avatar{width:80px;height:80px;border-radius:50%;object-fit:cover;border:3px solid #fda4af}
  .avatar-placeholder{width:80px;height:80px;border-radius:50%;background:#fecdd3;display:flex;align-items:center;justify-content:center;font-size:36px}
  h1{font-size:28px;font-weight:800;color:#be123c}
  @media(max-width:600px){.header{flex-direction:column;text-align:center}}
</style>
</head>
<body>
<div style="max-width:720px;margin:0 auto;">
  <div class="header">
    ${profilePhotoUrl
      ? `<img class="avatar" src="${profilePhotoUrl}" alt="Baby photo" />`
      : `<div class="avatar-placeholder">👶</div>`}
    <div>
      <h1>${profile?.name ? escHtml(profile.name) + "'s Milestones" : 'Baby Milestones'}</h1>
      ${profile?.dob ? `<p style="color:#64748b;margin-top:4px;">Born ${formatDateDisplay(profile.dob)}</p>` : ''}
      <p style="color:#64748b;margin-top:2px;">${sorted.length} milestone${sorted.length !== 1 ? 's' : ''} captured</p>
    </div>
  </div>
  ${milestonesHtml || '<p style="text-align:center;color:#94a3b8;padding:40px;">No milestones yet.</p>'}
  <p style="text-align:center;color:#cbd5e1;font-size:12px;margin-top:24px;">Exported ${new Date().toLocaleString()}</p>
</div>
</body>
</html>`

  return { html, sizeBytes: new Blob([html]).size }
}

function escHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 5000)
}

export function downloadText(text: string, filename: string): void {
  downloadBlob(new Blob([text], { type: 'text/html;charset=utf-8' }), filename)
}
