import Dexie, { type Table } from 'dexie'
import type { BabyProfile, Milestone, MediaItem } from './types'

class BabyMilestonesDB extends Dexie {
  profile!: Table<BabyProfile, number>
  milestones!: Table<Milestone, number>
  media!: Table<MediaItem, number>

  constructor() {
    super('BabyMilestonesDB')
    this.version(1).stores({
      profile:    '++id',
      milestones: '++id, date, type',
      media:      '++id, milestoneId',
    })
  }
}

export const db = new BabyMilestonesDB()

// ── Profile helpers ─────────────────────────────────────────────────────────

export async function getProfile(): Promise<BabyProfile | undefined> {
  return db.profile.get(1)
}

export async function saveProfile(p: Omit<BabyProfile, 'id'>): Promise<void> {
  const existing = await getProfile()
  if (existing) {
    await db.profile.update(1, p)
  } else {
    await db.profile.add({ ...p, id: 1 })
  }
}

// ── Milestone helpers ────────────────────────────────────────────────────────

export async function addMilestone(m: Omit<Milestone, 'id'>): Promise<number> {
  return db.milestones.add(m)
}

export async function updateMilestone(id: number, m: Partial<Milestone>): Promise<void> {
  await db.milestones.update(id, m)
}

export async function deleteMilestone(id: number): Promise<void> {
  // cascade-delete media
  await db.media.where('milestoneId').equals(id).delete()
  await db.milestones.delete(id)
}

export async function getMilestonesByDate(date: string): Promise<Milestone[]> {
  return db.milestones.where('date').equals(date).toArray()
}

// ── Media helpers ────────────────────────────────────────────────────────────

export async function addMedia(item: Omit<MediaItem, 'id'>): Promise<number> {
  return db.media.add(item)
}

export async function getMediaForMilestone(milestoneId: number): Promise<MediaItem[]> {
  return db.media.where('milestoneId').equals(milestoneId).toArray()
}

export async function deleteMedia(id: number): Promise<void> {
  await db.media.delete(id)
}

export async function getAllMedia(): Promise<MediaItem[]> {
  return db.media.toArray()
}

// ── Export helpers ───────────────────────────────────────────────────────────

export async function exportAll() {
  const [profile, milestones, media] = await Promise.all([
    db.profile.toArray(),
    db.milestones.toArray(),
    db.media.toArray(),
  ])
  return { profile, milestones, media }
}

export async function importAll(data: {
  profile: BabyProfile[]
  milestones: Milestone[]
  media: MediaItem[]
}): Promise<void> {
  await db.transaction('rw', db.profile, db.milestones, db.media, async () => {
    await db.profile.clear()
    await db.milestones.clear()
    await db.media.clear()
    if (data.profile?.length) await db.profile.bulkAdd(data.profile)
    if (data.milestones?.length) await db.milestones.bulkAdd(data.milestones)
    if (data.media?.length) await db.media.bulkAdd(data.media)
  })
}
