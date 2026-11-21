import { MoodEmoji, VirtualInteractionType } from './database'

export interface MoodConfig {
  emoji: MoodEmoji
  label: string
  bg: string
  border: string
  text: string
}

export const MOOD_OPTIONS: MoodConfig[] = [
  { emoji: '🥰', label: 'Happy', bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-700' },
  { emoji: '😊', label: 'Good', bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700' },
  { emoji: '😐', label: 'Okay', bg: 'bg-stone-50', border: 'border-stone-200', text: 'text-stone-700' },
  { emoji: '🥺', label: 'Sad', bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-700' },
  { emoji: '😭', label: 'Very sad', bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700' },
  { emoji: '😴', label: 'Tired', bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700' },
  { emoji: '😤', label: 'Frustrated', bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700' },
  { emoji: '🤒', label: 'Unwell', bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700' },
  { emoji: '🤩', label: 'Excited', bg: 'bg-pink-50', border: 'border-pink-200', text: 'text-pink-700' },
  { emoji: '🫠', label: 'Overwhelmed', bg: 'bg-teal-50', border: 'border-teal-200', text: 'text-teal-700' },
]

export const QUICK_MESSAGES = [
  'Missing you.',
  'Eat something!',
  'Call me.',
  'I love you.',
  'Good morning.',
  'Good night.',
  'Take care.',
  'Wish you were here.',
]

export interface VirtualInteractionOption {
  type: VirtualInteractionType
  title: string
  icon: string
  color: string
  description: string
  particleCount: number
}

export const VIRTUAL_INTERACTIONS: VirtualInteractionOption[] = [
  { type: 'hug', title: 'Warm Hug', icon: '🫂', color: 'from-amber-400 to-rose-400', description: 'A cozy, loving embrace', particleCount: 40 },
  { type: 'kiss', title: 'Sweet Kiss', icon: '💋', color: 'from-rose-400 to-pink-500', description: 'A gentle kiss on the lips', particleCount: 50 },
  { type: 'forehead_kiss', title: 'Forehead Kiss', icon: '✨', color: 'from-purple-400 to-rose-400', description: 'Reassuring and deeply tender', particleCount: 45 },
  { type: 'heart', title: 'Heart Flutter', icon: '💖', color: 'from-pink-400 to-red-400', description: 'A burst of fluttering love', particleCount: 60 },
  { type: 'cuddle', title: 'Cozy Cuddle', icon: '🧸', color: 'from-amber-300 to-orange-400', description: 'Curling up together', particleCount: 35 },
  { type: 'bear_hug', title: 'Bear Hug', icon: '🐻', color: 'from-orange-400 to-amber-600', description: 'Tightest squeeze with all my strength', particleCount: 55 },
]
