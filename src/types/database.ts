export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Profile {
  id: string
  email: string | null
  full_name: string
  nickname: string
  avatar_url: string
  birthday: string | null
  created_at: string
  updated_at: string
}

export interface CoupleSpace {
  id: string
  name: string
  relationship_start_date: string
  widget_access_token: string
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface CoupleMember {
  id: string
  space_id: string
  user_id: string
  role: 'creator' | 'partner'
  joined_at: string
  profile?: Profile
}

export interface Invitation {
  id: string
  space_id: string
  invitation_code: string
  created_by: string
  expires_at: string
  is_used: boolean
  used_by: string | null
  used_at: string | null
  created_at: string
}

export interface Photo {
  id: string
  space_id: string
  uploaded_by: string
  storage_path: string
  public_url: string
  caption: string
  is_favorite: boolean
  taken_at: string | null
  width: number | null
  height: number | null
  created_at: string
  uploader_nickname?: string
  uploader_name?: string
}

export interface PhotoRotation {
  id: string
  space_id: string
  current_photo_id: string | null
  previous_photo_id: string | null
  rotation_slot: string
  updated_at: string
  photo?: Photo
}

export type MoodEmoji = '🥰' | '😊' | '😐' | '🥺' | '😭' | '😴' | '😤' | '🤒' | '🤩' | '🫠'

export interface Mood {
  id: string
  space_id: string
  user_id: string
  emoji: MoodEmoji
  mood_label: string
  note: string
  created_at: string
  user_profile?: Profile
}

export interface Message {
  id: string
  space_id: string
  sender_id: string
  content: string
  is_quick_message: boolean
  created_at: string
  sender_profile?: Profile
}

export interface DailyQuestion {
  id: string
  question_text: string
  day_index: number
  category: string
  created_at: string
}

export interface QuestionAnswer {
  id: string
  space_id: string
  question_id: string
  user_id: string
  answer_text: string
  answered_date: string
  created_at: string
  user_profile?: Profile
}

export interface LocationUpdate {
  id: string
  space_id: string
  user_id: string
  latitude: number
  longitude: number
  accuracy: number
  is_sharing_paused: boolean
  updated_at: string
}

export type VirtualInteractionType = 'hug' | 'kiss' | 'forehead_kiss' | 'heart' | 'cuddle' | 'bear_hug'

export interface VirtualInteraction {
  id: string
  space_id: string
  sender_id: string
  interaction_type: VirtualInteractionType
  message: string
  opened_at: string | null
  created_at: string
  sender_name?: string
}

export interface SpecialDate {
  id: string
  space_id: string
  title: string
  event_date: string
  is_annual: boolean
  icon: string
  created_by: string | null
  created_at: string
}

export interface NotificationPreferences {
  id: string
  user_id: string
  enable_mood_alerts: boolean
  enable_message_alerts: boolean
  enable_interaction_alerts: boolean
  enable_question_alerts: boolean
  web_push_subscription: Json | null
  updated_at: string
}

export interface WidgetSnapshot {
  space: {
    id: string
    name: string
    relationship_start_date: string
    days_together: number
    next_anniversary_days: number
  }
  members: {
    user1: {
      id: string
      name: string
      mood: {
        emoji: string
        label: string
        note: string
        updated_at: string
      } | null
      location_updated_at: string | null
      is_paused: boolean
    }
    user2: {
      id: string
      name: string
      mood: {
        emoji: string
        label: string
        note: string
        updated_at: string
      } | null
      location_updated_at: string | null
      is_paused: boolean
    }
  }
  photo: Photo | null
  distance: {
    km: number | null
    trend: 'getting_closer' | 'moving_farther' | 'steady' | 'unknown'
    is_available: boolean
    last_updated: string | null
  }
  latest_message: {
    content: string
    sender: string
    created_at: string
  } | null
  latest_interaction: {
    type: VirtualInteractionType
    message: string
    sender: string
    created_at: string
  } | null
  daily_question: {
    text: string
    both_answered: boolean
    user1_answered: boolean
    user2_answered: boolean
  } | null
  generated_at: string
}
