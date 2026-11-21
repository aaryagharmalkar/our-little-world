import { CoupleSpace, Photo, Mood, Message, DailyQuestion, QuestionAnswer, SpecialDate } from '../types/database'

export const DEMO_USER_ME = {
  id: 'user-aarya-001',
  email: 'aarya@ourlittleworld.love',
  full_name: 'Aarya',
  nickname: 'Me ♡',
  avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
  birthday: '2002-05-14',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

export const DEMO_USER_PARTNER = {
  id: 'user-partner-002',
  email: 'boyfriend@ourlittleworld.love',
  full_name: 'My Love',
  nickname: 'Him ♡',
  avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
  birthday: '2001-11-25',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

export const DEMO_COUPLE_SPACE: CoupleSpace = {
  id: 'space-demo-777',
  name: 'Our Little World ♡',
  relationship_start_date: '2023-04-18', // ~842 days together
  widget_access_token: 'olw_demo_token_8899aabbcc',
  created_by: DEMO_USER_ME.id,
  created_at: '2023-04-18T00:00:00Z',
  updated_at: new Date().toISOString(),
}

export const DEMO_PHOTOS: Photo[] = [
  {
    id: 'photo-1',
    space_id: DEMO_COUPLE_SPACE.id,
    uploaded_by: DEMO_USER_ME.id,
    storage_path: 'demo/sunset-beach.jpg',
    public_url: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=1200&auto=format&fit=crop&q=85',
    caption: 'That unforgettable golden hour by the seaside ♡',
    is_favorite: true,
    taken_at: '2024-07-12T19:40:00Z',
    width: 1200,
    height: 800,
    created_at: '2024-07-12T20:00:00Z',
    uploader_nickname: 'Me ♡',
  },
  {
    id: 'photo-2',
    space_id: DEMO_COUPLE_SPACE.id,
    uploaded_by: DEMO_USER_PARTNER.id,
    storage_path: 'demo/cozy-cafe.jpg',
    public_url: 'https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?w=1200&auto=format&fit=crop&q=85',
    caption: 'Warm hot chocolate and endless conversations on a rainy afternoon ☕',
    is_favorite: true,
    taken_at: '2024-09-03T16:15:00Z',
    width: 1200,
    height: 800,
    created_at: '2024-09-03T17:00:00Z',
    uploader_nickname: 'Him ♡',
  },
  {
    id: 'photo-3',
    space_id: DEMO_COUPLE_SPACE.id,
    uploaded_by: DEMO_USER_ME.id,
    storage_path: 'demo/starry-night.jpg',
    public_url: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=1200&auto=format&fit=crop&q=85',
    caption: 'Looking up at the night sky wrapped in one warm jacket ✨',
    is_favorite: false,
    taken_at: '2024-10-18T22:30:00Z',
    width: 1200,
    height: 800,
    created_at: '2024-10-18T23:00:00Z',
    uploader_nickname: 'Me ♡',
  },
  {
    id: 'photo-4',
    space_id: DEMO_COUPLE_SPACE.id,
    uploaded_by: DEMO_USER_PARTNER.id,
    storage_path: 'demo/roadtrip.jpg',
    public_url: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=1200&auto=format&fit=crop&q=85',
    caption: 'Our spontaneous road trip with windows down singing at top of our lungs 🚗🎶',
    is_favorite: true,
    taken_at: '2024-11-10T14:20:00Z',
    width: 1200,
    height: 800,
    created_at: '2024-11-10T15:00:00Z',
    uploader_nickname: 'Him ♡',
  },
]

export const DEMO_MOODS: Mood[] = [
  {
    id: 'mood-me-1',
    space_id: DEMO_COUPLE_SPACE.id,
    user_id: DEMO_USER_ME.id,
    emoji: '🥰',
    mood_label: 'Happy',
    note: 'Counting down the minutes until I see you!',
    created_at: new Date(Date.now() - 15 * 60000).toISOString(),
  },
  {
    id: 'mood-partner-1',
    space_id: DEMO_COUPLE_SPACE.id,
    user_id: DEMO_USER_PARTNER.id,
    emoji: '😴',
    mood_label: 'Tired',
    note: 'Had a long tiring day at work, desperately need your hugs.',
    created_at: new Date(Date.now() - 42 * 60000).toISOString(),
  },
]

export const DEMO_MESSAGES: Message[] = [
  {
    id: 'msg-1',
    space_id: DEMO_COUPLE_SPACE.id,
    sender_id: DEMO_USER_PARTNER.id,
    content: 'Good morning sunshine ☀️ hope your day starts as sweet as you are.',
    is_quick_message: false,
    created_at: new Date(Date.now() - 6 * 3600000).toISOString(),
  },
  {
    id: 'msg-2',
    space_id: DEMO_COUPLE_SPACE.id,
    sender_id: DEMO_USER_ME.id,
    content: 'Good morning my love! Did you drink some water?',
    is_quick_message: false,
    created_at: new Date(Date.now() - 5 * 3600000).toISOString(),
  },
  {
    id: 'msg-3',
    space_id: DEMO_COUPLE_SPACE.id,
    sender_id: DEMO_USER_PARTNER.id,
    content: 'Eat something!',
    is_quick_message: true,
    created_at: new Date(Date.now() - 2 * 3600000).toISOString(),
  },
  {
    id: 'msg-4',
    space_id: DEMO_COUPLE_SPACE.id,
    sender_id: DEMO_USER_ME.id,
    content: 'Just had lunch! Missing you so much today ♡',
    is_quick_message: false,
    created_at: new Date(Date.now() - 25 * 60000).toISOString(),
  },
  {
    id: 'msg-5',
    space_id: DEMO_COUPLE_SPACE.id,
    sender_id: DEMO_USER_PARTNER.id,
    content: 'Wish you were here.',
    is_quick_message: true,
    created_at: new Date(Date.now() - 8 * 60000).toISOString(),
  },
]

export const DEMO_DAILY_QUESTION: DailyQuestion = {
  id: 'q-demo-today',
  question_text: 'What is one little thing I do without realizing that always makes you smile?',
  day_index: 3,
  category: 'feelings',
  created_at: new Date().toISOString(),
}

export const DEMO_QUESTION_ANSWERS: QuestionAnswer[] = [
  {
    id: 'ans-1',
    space_id: DEMO_COUPLE_SPACE.id,
    question_id: DEMO_DAILY_QUESTION.id,
    user_id: DEMO_USER_ME.id,
    answer_text: 'The way you unconsciously reach for my hand whenever we cross the road, and how your eyes light up when you see your favorite dessert!',
    answered_date: new Date().toISOString().split('T')[0],
    created_at: new Date(Date.now() - 3 * 3600000).toISOString(),
  },
  {
    id: 'ans-2',
    space_id: DEMO_COUPLE_SPACE.id,
    question_id: DEMO_DAILY_QUESTION.id,
    user_id: DEMO_USER_PARTNER.id,
    answer_text: 'Whenever you get really excited explaining a story and start talking with your hands, and your little nose scrunch when you laugh!',
    answered_date: new Date().toISOString().split('T')[0],
    created_at: new Date(Date.now() - 1 * 3600000).toISOString(),
  },
]

export const DEMO_SPECIAL_DATES: SpecialDate[] = [
  {
    id: 'date-1',
    space_id: DEMO_COUPLE_SPACE.id,
    title: 'Our Anniversary ♡',
    event_date: '2024-04-18',
    is_annual: true,
    icon: 'heart',
    created_by: DEMO_USER_ME.id,
    created_at: '2023-04-18T00:00:00Z',
  },
  {
    id: 'date-2',
    space_id: DEMO_COUPLE_SPACE.id,
    title: "His Birthday 🎂",
    event_date: '2024-11-25',
    is_annual: true,
    icon: 'cake',
    created_by: DEMO_USER_ME.id,
    created_at: '2023-04-18T00:00:00Z',
  },
  {
    id: 'date-3',
    space_id: DEMO_COUPLE_SPACE.id,
    title: "Our Dream Winter Getaway ❄️",
    event_date: '2024-12-28',
    is_annual: false,
    icon: 'plane',
    created_by: DEMO_USER_PARTNER.id,
    created_at: '2023-04-18T00:00:00Z',
  },
]
