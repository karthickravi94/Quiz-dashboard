export type MilestoneType =
  | 'first_smile'
  | 'first_word'
  | 'first_food'
  | 'first_steps'
  | 'first_birthday'
  | 'first_tooth'
  | 'first_crawl'
  | 'favorite_toy'
  | 'custom'

export interface BabyProfile {
  id?: number
  name: string
  dob: string        // YYYY-MM-DD
  gender?: 'boy' | 'girl' | 'other' | ''
  photoBlob?: Blob
}

export interface Milestone {
  id?: number
  type: MilestoneType
  title: string
  date: string       // YYYY-MM-DD
  description: string
  createdAt: number  // Date.now()
}

export interface MediaItem {
  id?: number
  milestoneId: number
  kind: 'image' | 'video'
  blob: Blob
  thumbnailBlob?: Blob  // compressed preview for images
  filename: string
  size: number
}

export const MILESTONE_TEMPLATES: { type: MilestoneType; label: string; emoji: string; color: string }[] = [
  { type: 'first_smile',    label: 'First Smile',    emoji: '😊', color: 'rose' },
  { type: 'first_word',     label: 'First Word',     emoji: '🗣️', color: 'lavender' },
  { type: 'first_food',     label: 'First Food',     emoji: '🥄', color: 'orange' },
  { type: 'first_steps',    label: 'First Steps',    emoji: '👣', color: 'green' },
  { type: 'first_birthday', label: 'First Birthday', emoji: '🎂', color: 'yellow' },
  { type: 'first_tooth',    label: 'First Tooth',    emoji: '🦷', color: 'sky' },
  { type: 'first_crawl',    label: 'First Crawl',    emoji: '🐣', color: 'teal' },
  { type: 'favorite_toy',   label: 'Favorite Toy',   emoji: '🧸', color: 'blue' },
  { type: 'custom',         label: 'Custom',         emoji: '✨', color: 'pink' },
]

export const TYPE_DOT_COLOR: Record<MilestoneType, string> = {
  first_smile:    'bg-rose-400',
  first_word:     'bg-purple-400',
  first_food:     'bg-orange-400',
  first_steps:    'bg-green-400',
  first_birthday: 'bg-yellow-400',
  first_tooth:    'bg-sky-400',
  first_crawl:    'bg-teal-400',
  favorite_toy:   'bg-blue-400',
  custom:         'bg-pink-400',
}

export const TYPE_BG_LIGHT: Record<MilestoneType, string> = {
  first_smile:    'bg-rose-100 text-rose-700',
  first_word:     'bg-purple-100 text-purple-700',
  first_food:     'bg-orange-100 text-orange-700',
  first_steps:    'bg-green-100 text-green-700',
  first_birthday: 'bg-yellow-100 text-yellow-700',
  first_tooth:    'bg-sky-100 text-sky-700',
  first_crawl:    'bg-teal-100 text-teal-700',
  favorite_toy:   'bg-blue-100 text-blue-700',
  custom:         'bg-pink-100 text-pink-700',
}
