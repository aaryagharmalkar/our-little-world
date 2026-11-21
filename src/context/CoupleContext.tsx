import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'
import {
  Photo,
  Mood,
  Message,
  DailyQuestion,
  QuestionAnswer,
  VirtualInteraction,
  SpecialDate,
  LocationUpdate,
  MoodEmoji,
  VirtualInteractionType,
  CoupleSpace,
} from '../types/database'
import {
  DEMO_PHOTOS,
  DEMO_MOODS,
  DEMO_MESSAGES,
  DEMO_DAILY_QUESTION,
  DEMO_QUESTION_ANSWERS,
  DEMO_SPECIAL_DATES,
  DEMO_USER_ME,
  DEMO_USER_PARTNER,
  DEMO_COUPLE_SPACE,
} from '../lib/demoData'
import { calculateHaversineDistance, calculateDistanceTrend } from '../lib/geo'
import { uploadPhotoToStorage, getPrivatePhotoSignedUrl } from '../lib/storage'

interface CoupleContextType {
  photos: Photo[]
  currentHourlyPhoto: Photo | null
  myMood: Mood | null
  partnerMood: Mood | null
  moodHistory: Mood[]
  messages: Message[]
  dailyQuestion: DailyQuestion | null
  myAnswer: QuestionAnswer | null
  partnerAnswer: QuestionAnswer | null
  areBothAnswersRevealed: boolean
  allAnswersHistory: QuestionAnswer[]
  virtualInteractions: VirtualInteraction[]
  latestInteraction: VirtualInteraction | null
  specialDates: SpecialDate[]
  myLocation: LocationUpdate | null
  partnerLocation: LocationUpdate | null
  distanceKm: number | null
  distanceTrend: 'getting_closer' | 'moving_farther' | 'steady' | 'unknown'
  isLocationPaused: boolean
  daysTogether: number
  daysToNextAnniversary: number
  isLoadingData: boolean
  activeTab: string
  setActiveTab: (tab: string) => void

  // Actions
  uploadPhotos: (files: File[], caption?: string) => Promise<{ success: boolean; count: number; error?: string }>
  toggleFavoritePhoto: (photoId: string) => Promise<void>
  updateMood: (emoji: MoodEmoji, label: string, note?: string) => Promise<void>
  sendMessage: (content: string, isQuick?: boolean) => Promise<void>
  submitDailyAnswer: (answerText: string) => Promise<void>
  sendVirtualInteraction: (type: VirtualInteractionType, message?: string) => Promise<void>
  markInteractionOpened: (id: string) => Promise<void>
  updateLocation: (lat: number, lon: number, accuracy?: number) => Promise<void>
  toggleLocationPause: () => Promise<void>
  createSpecialDate: (title: string, eventDate: string, isAnnual: boolean, icon: string) => Promise<void>
  createCoupleSpace: (name: string, startDate: string) => Promise<{ success: boolean; error?: string; widgetToken?: string }>
  joinCoupleSpace: (code: string) => Promise<{ success: boolean; error?: string }>
  generateInviteCode: () => Promise<string | null>
  rotateHourlyPhoto: () => Promise<void>
  rotateWidgetToken: () => Promise<string | null>
}

const CoupleContext = createContext<CoupleContextType | undefined>(undefined)

export const CoupleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, profile, partnerProfile, coupleSpace, isDemoMode, isConfigured, setCoupleSpace } = useAuth()

  const [photos, setPhotos] = useState<Photo[]>([])
  const [currentHourlyPhoto, setCurrentHourlyPhoto] = useState<Photo | null>(null)
  const [moods, setMoods] = useState<Mood[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [dailyQuestion, setDailyQuestion] = useState<DailyQuestion | null>(null)
  const [questionAnswers, setQuestionAnswers] = useState<QuestionAnswer[]>([])
  const [virtualInteractions, setVirtualInteractions] = useState<VirtualInteraction[]>([])
  const [specialDates, setSpecialDates] = useState<SpecialDate[]>([])
  const [locationUpdates, setLocationUpdates] = useState<LocationUpdate[]>([])
  const [isLoadingData, setIsLoadingData] = useState<boolean>(true)
  const [activeTab, setActiveTab] = useState<string>('dashboard')
  const [previousDistance, setPreviousDistance] = useState<number | null>(null)

  // --------------------------------------------------------------------------
  // INITIAL DATA LOADING
  // --------------------------------------------------------------------------
  const loadData = useCallback(async () => {
    if (!coupleSpace) {
      setIsLoadingData(false)
      return
    }

    if (isDemoMode) {
      setPhotos(DEMO_PHOTOS)
      setCurrentHourlyPhoto(DEMO_PHOTOS[0])
      setMoods(DEMO_MOODS)
      setMessages(DEMO_MESSAGES)
      setDailyQuestion(DEMO_DAILY_QUESTION)
      setQuestionAnswers(DEMO_QUESTION_ANSWERS)
      setSpecialDates(DEMO_SPECIAL_DATES)
      setVirtualInteractions([
        {
          id: 'int-1',
          space_id: coupleSpace.id,
          sender_id: DEMO_USER_PARTNER.id,
          interaction_type: 'forehead_kiss',
          message: 'Just thinking about how much I cherish you...',
          opened_at: null,
          created_at: new Date(Date.now() - 10 * 60000).toISOString(),
          sender_name: 'Him ♡',
        },
      ])
      // Initial demo locations: ~12.4 km apart
      setLocationUpdates([
        {
          id: 'loc-me',
          space_id: coupleSpace.id,
          user_id: user?.id || DEMO_USER_ME.id,
          latitude: 40.7128,
          longitude: -74.006,
          accuracy: 10,
          is_sharing_paused: false,
          updated_at: new Date(Date.now() - 8 * 60000).toISOString(),
        },
        {
          id: 'loc-partner',
          space_id: coupleSpace.id,
          user_id: partnerProfile?.id || DEMO_USER_PARTNER.id,
          latitude: 40.8128,
          longitude: -73.956,
          accuracy: 15,
          is_sharing_paused: false,
          updated_at: new Date(Date.now() - 12 * 60000).toISOString(),
        },
      ])
      setIsLoadingData(false)
      return
    }

    try {
      setIsLoadingData(true)
      const spaceId = coupleSpace.id

      // 1. Photos (resolve secure signed URLs for private storage)
      const { data: photosData } = await supabase
        .from('photos')
        .select('*')
        .eq('space_id', spaceId)
        .order('created_at', { ascending: false })

      if (photosData) {
        const resolved: Photo[] = await Promise.all(
          photosData.map(async (p) => {
            const signed = await getPrivatePhotoSignedUrl(p.storage_path || p.public_url || '')
            return { ...p, signed_url: signed, public_url: signed }
          })
        )
        setPhotos(resolved)
      }

      // 2. Hourly Photo Rotation
      const { data: rotationPhoto } = await supabase.rpc('get_or_rotate_current_photo', {
        p_space_id: spaceId,
      })
      if (rotationPhoto) {
        const rot = rotationPhoto as Photo
        const signed = await getPrivatePhotoSignedUrl(rot.storage_path || rot.public_url || '')
        setCurrentHourlyPhoto({ ...rot, signed_url: signed, public_url: signed })
      } else if (photosData && photosData.length > 0) {
        const first = photosData[0] as Photo
        const signed = await getPrivatePhotoSignedUrl(first.storage_path || first.public_url || '')
        setCurrentHourlyPhoto({ ...first, signed_url: signed, public_url: signed })
      }

      // 3. Moods
      const { data: moodsData } = await supabase
        .from('moods')
        .select('*')
        .eq('space_id', spaceId)
        .order('created_at', { ascending: false })
        .limit(30)
      if (moodsData) setMoods(moodsData)

      // 4. Messages
      const { data: messagesData } = await supabase
        .from('messages')
        .select('*')
        .eq('space_id', spaceId)
        .order('created_at', { ascending: true })
        .limit(100)
      if (messagesData) setMessages(messagesData)

      // 5. Daily Question (based on day of year 1-365)
      const startOfYear = new Date(new Date().getFullYear(), 0, 1)
      const dayOfYear = Math.min(
        365,
        Math.max(1, Math.floor((Date.now() - startOfYear.getTime()) / (1000 * 60 * 60 * 24)) + 1)
      )

      const { data: questionData } = await supabase
        .from('daily_questions')
        .select('*')
        .eq('day_index', dayOfYear)
        .maybeSingle()

      if (questionData) {
        setDailyQuestion(questionData)
      } else {
        // Fallback to first question
        const { data: firstQ } = await supabase.from('daily_questions').select('*').limit(1).maybeSingle()
        if (firstQ) setDailyQuestion(firstQ)
      }

      // 6. Question Answers
      const { data: answersData } = await supabase
        .from('question_answers')
        .select('*')
        .eq('space_id', spaceId)
        .order('answered_date', { ascending: false })
      if (answersData) setQuestionAnswers(answersData)

      // 7. Virtual Interactions
      const { data: interactionsData } = await supabase
        .from('virtual_interactions')
        .select('*')
        .eq('space_id', spaceId)
        .order('created_at', { ascending: false })
        .limit(20)
      if (interactionsData) setVirtualInteractions(interactionsData)

      // 8. Special Dates
      const { data: specialDatesData } = await supabase
        .from('special_dates')
        .select('*')
        .eq('space_id', spaceId)
        .order('event_date', { ascending: true })
      if (specialDatesData) setSpecialDates(specialDatesData)

      // 9. Location Updates
      const { data: locationsData } = await supabase
        .from('location_updates')
        .select('*')
        .eq('space_id', spaceId)
      if (locationsData) setLocationUpdates(locationsData)
    } catch (err) {
      console.error('Failed to load couple data:', err)
    } finally {
      setIsLoadingData(false)
    }
  }, [coupleSpace, isDemoMode, user?.id, partnerProfile?.id])

  useEffect(() => {
    loadData()
  }, [loadData])

  // --------------------------------------------------------------------------
  // SUPABASE REALTIME SUBSCRIPTIONS
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (!coupleSpace || isDemoMode || !isConfigured) return

    const spaceId = coupleSpace.id

    const channel = supabase
      .channel(`couple-space-${spaceId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `space_id=eq.${spaceId}` },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message])
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'moods', filter: `space_id=eq.${spaceId}` },
        (payload) => {
          setMoods((prev) => [payload.new as Mood, ...prev])
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'photos', filter: `space_id=eq.${spaceId}` },
        (payload) => {
          setPhotos((prev) => [payload.new as Photo, ...prev])
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'photos', filter: `space_id=eq.${spaceId}` },
        (payload) => {
          const updated = payload.new as Photo
          setPhotos((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'virtual_interactions', filter: `space_id=eq.${spaceId}` },
        (payload) => {
          setVirtualInteractions((prev) => [payload.new as VirtualInteraction, ...prev])
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'location_updates', filter: `space_id=eq.${spaceId}` },
        (payload) => {
          const updated = payload.new as LocationUpdate
          setLocationUpdates((prev) => {
            const index = prev.findIndex((l) => l.user_id === updated.user_id)
            if (index >= 0) {
              const copy = [...prev]
              copy[index] = updated
              return copy
            }
            return [...prev, updated]
          })
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'question_answers', filter: `space_id=eq.${spaceId}` },
        (payload) => {
          setQuestionAnswers((prev) => [payload.new as QuestionAnswer, ...prev])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [coupleSpace, isDemoMode, isConfigured])

  // --------------------------------------------------------------------------
  // DERIVED VALUES: MOODS, ANSWERS, DISTANCES, COUNTDOWNS
  // --------------------------------------------------------------------------
  const myMood = useMemo(() => {
    return moods.find((m) => m.user_id === user?.id) || null
  }, [moods, user?.id])

  const partnerMood = useMemo(() => {
    return moods.find((m) => m.user_id !== user?.id) || null
  }, [moods, user?.id])

  const myAnswer = useMemo(() => {
    if (!dailyQuestion) return null
    return questionAnswers.find((a) => a.question_id === dailyQuestion.id && a.user_id === user?.id) || null
  }, [questionAnswers, dailyQuestion, user?.id])

  const partnerAnswer = useMemo(() => {
    if (!dailyQuestion) return null
    return questionAnswers.find((a) => a.question_id === dailyQuestion.id && a.user_id !== user?.id) || null
  }, [questionAnswers, dailyQuestion, user?.id])

  // Partner's answer is only revealed once BOTH have submitted!
  const areBothAnswersRevealed = useMemo(() => {
    return Boolean(myAnswer && partnerAnswer)
  }, [myAnswer, partnerAnswer])

  const latestInteraction = useMemo(() => {
    if (virtualInteractions.length === 0) return null
    return virtualInteractions[0]
  }, [virtualInteractions])

  // Location & Distance calculation
  const myLocation = useMemo(() => {
    return locationUpdates.find((l) => l.user_id === user?.id) || null
  }, [locationUpdates, user?.id])

  const partnerLocation = useMemo(() => {
    return locationUpdates.find((l) => l.user_id !== user?.id) || null
  }, [locationUpdates, user?.id])

  const isLocationPaused = Boolean(myLocation?.is_sharing_paused)

  const distanceKm = useMemo(() => {
    if (!myLocation || !partnerLocation) return null
    if (myLocation.is_sharing_paused || partnerLocation.is_sharing_paused) return null

    const dist = calculateHaversineDistance(
      myLocation.latitude,
      myLocation.longitude,
      partnerLocation.latitude,
      partnerLocation.longitude
    )
    return dist
  }, [myLocation, partnerLocation])

  const distanceTrend = useMemo(() => {
    return calculateDistanceTrend(distanceKm, previousDistance)
  }, [distanceKm, previousDistance])

  // Keep track of previous distance for trend analysis
  useEffect(() => {
    if (distanceKm !== null && distanceKm !== previousDistance) {
      setPreviousDistance(distanceKm)
    }
  }, [distanceKm])

  // Countdown computations
  const daysTogether = useMemo(() => {
    if (!coupleSpace?.relationship_start_date) return 0
    const start = new Date(coupleSpace.relationship_start_date).getTime()
    const now = new Date().getTime()
    const diff = Math.floor((now - start) / (1000 * 60 * 60 * 24))
    return Math.max(0, diff)
  }, [coupleSpace?.relationship_start_date])

  const daysToNextAnniversary = useMemo(() => {
    if (!coupleSpace?.relationship_start_date) return 0
    const start = new Date(coupleSpace.relationship_start_date)
    const today = new Date()
    let nextAnniv = new Date(today.getFullYear(), start.getMonth(), start.getDate())
    if (nextAnniv.getTime() < today.getTime()) {
      nextAnniv = new Date(today.getFullYear() + 1, start.getMonth(), start.getDate())
    }
    const diff = Math.ceil((nextAnniv.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    return Math.max(0, diff)
  }, [coupleSpace?.relationship_start_date])

  // --------------------------------------------------------------------------
  // ACTIONS IMPLEMENTATION
  // --------------------------------------------------------------------------

  // 1. Upload Photos (multi-photo upload with compression)
  const uploadPhotos = async (files: File[], caption?: string) => {
    if (!coupleSpace || !user) return { success: false, count: 0, error: 'Not connected' }

    if (isDemoMode) {
      // In demo mode, create local object URLs
      const newPhotos: Photo[] = files.map((file, i) => ({
        id: `photo-local-${Date.now()}-${i}`,
        space_id: coupleSpace.id,
        uploaded_by: user.id,
        storage_path: `local/${file.name}`,
        public_url: URL.createObjectURL(file),
        caption: caption || file.name.replace(/\.[^/.]+$/, ''),
        is_favorite: false,
        taken_at: new Date().toISOString(),
        width: 1200,
        height: 800,
        created_at: new Date().toISOString(),
        uploader_nickname: profile?.nickname || 'Me ♡',
      }))
      setPhotos((prev) => [...newPhotos, ...prev])
      if (!currentHourlyPhoto && newPhotos.length > 0) {
        setCurrentHourlyPhoto(newPhotos[0])
      }
      return { success: true, count: newPhotos.length }
    }

    try {
      let uploadedCount = 0
      for (const file of files) {
        const { path, width, height } = await uploadPhotoToStorage(coupleSpace.id, file)

        const { error: dbError } = await supabase.from('photos').insert({
          space_id: coupleSpace.id,
          uploaded_by: user.id,
          storage_path: path,
          caption: caption || '',
          width,
          height,
          taken_at: new Date().toISOString(),
        })

        if (!dbError) uploadedCount++
      }

      // Refresh list with signed URLs
      const { data } = await supabase
        .from('photos')
        .select('*')
        .eq('space_id', coupleSpace.id)
        .order('created_at', { ascending: false })

      if (data) {
        const resolved: Photo[] = await Promise.all(
          data.map(async (p) => {
            const signed = await getPrivatePhotoSignedUrl(p.storage_path || p.public_url || '')
            return { ...p, signed_url: signed, public_url: signed }
          })
        )
        setPhotos(resolved)
      }

      return { success: true, count: uploadedCount }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Upload failed'
      return { success: false, count: 0, error: message }
    }
  }

  // 2. Favorite Toggle
  const toggleFavoritePhoto = async (photoId: string) => {
    const photo = photos.find((p) => p.id === photoId)
    if (!photo) return
    const newFavorite = !photo.is_favorite

    setPhotos((prev) => prev.map((p) => (p.id === photoId ? { ...p, is_favorite: newFavorite } : p)))
    if (currentHourlyPhoto?.id === photoId) {
      setCurrentHourlyPhoto((prev) => (prev ? { ...prev, is_favorite: newFavorite } : null))
    }

    if (!isDemoMode && coupleSpace) {
      await supabase.from('photos').update({ is_favorite: newFavorite }).eq('id', photoId)
    }
  }

  // 3. Update Mood
  const updateMood = async (emoji: MoodEmoji, label: string, note?: string) => {
    if (!coupleSpace || !user) return

    const newMood: Mood = {
      id: `mood-${Date.now()}`,
      space_id: coupleSpace.id,
      user_id: user.id,
      emoji,
      mood_label: label,
      note: note || '',
      created_at: new Date().toISOString(),
    }

    setMoods((prev) => [newMood, ...prev.filter((m) => m.user_id !== user.id)])

    if (!isDemoMode) {
      await supabase.from('moods').insert({
        space_id: coupleSpace.id,
        user_id: user.id,
        emoji,
        mood_label: label,
        note: note || '',
      })
    }
  }

  // 4. Send Message
  const sendMessage = async (content: string, isQuick = false) => {
    if (!coupleSpace || !user || !content.trim()) return

    const newMsg: Message = {
      id: `msg-${Date.now()}`,
      space_id: coupleSpace.id,
      sender_id: user.id,
      content: content.trim(),
      is_quick_message: isQuick,
      created_at: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, newMsg])

    if (!isDemoMode) {
      await supabase.from('messages').insert({
        space_id: coupleSpace.id,
        sender_id: user.id,
        content: content.trim(),
        is_quick_message: isQuick,
      })
    }
  }

  // 5. Submit Daily Answer
  const submitDailyAnswer = async (answerText: string) => {
    if (!coupleSpace || !user || !dailyQuestion || !answerText.trim()) return

    const todayStr = new Date().toISOString().split('T')[0]
    const newAnswer: QuestionAnswer = {
      id: `ans-${Date.now()}`,
      space_id: coupleSpace.id,
      question_id: dailyQuestion.id,
      user_id: user.id,
      answer_text: answerText.trim(),
      answered_date: todayStr,
      created_at: new Date().toISOString(),
    }

    setQuestionAnswers((prev) => [newAnswer, ...prev.filter((a) => a.user_id !== user.id || a.question_id !== dailyQuestion.id)])

    if (!isDemoMode) {
      await supabase.from('question_answers').upsert(
        {
          space_id: coupleSpace.id,
          question_id: dailyQuestion.id,
          user_id: user.id,
          answer_text: answerText.trim(),
          answered_date: todayStr,
        },
        { onConflict: 'space_id,question_id,user_id,answered_date' }
      )
    }
  }

  // 6. Send Virtual Interaction
  const sendVirtualInteraction = async (type: VirtualInteractionType, message = '') => {
    if (!coupleSpace || !user) return

    const newInt: VirtualInteraction = {
      id: `int-${Date.now()}`,
      space_id: coupleSpace.id,
      sender_id: user.id,
      interaction_type: type,
      message,
      opened_at: null,
      created_at: new Date().toISOString(),
      sender_name: profile?.nickname || 'Me ♡',
    }

    setVirtualInteractions((prev) => [newInt, ...prev])

    if (!isDemoMode) {
      await supabase.from('virtual_interactions').insert({
        space_id: coupleSpace.id,
        sender_id: user.id,
        interaction_type: type,
        message,
      })
    }
  }

  const markInteractionOpened = async (id: string) => {
    setVirtualInteractions((prev) =>
      prev.map((i) => (i.id === id ? { ...i, opened_at: new Date().toISOString() } : i))
    )
    if (!isDemoMode) {
      await supabase
        .from('virtual_interactions')
        .update({ opened_at: new Date().toISOString() })
        .eq('id', id)
    }
  }

  // 7. Update Location
  const updateLocation = async (latitude: number, longitude: number, accuracy = 0) => {
    if (!coupleSpace || !user) return

    const newLoc: LocationUpdate = {
      id: `loc-${user.id}`,
      space_id: coupleSpace.id,
      user_id: user.id,
      latitude,
      longitude,
      accuracy,
      is_sharing_paused: false,
      updated_at: new Date().toISOString(),
    }

    setLocationUpdates((prev) => {
      const idx = prev.findIndex((l) => l.user_id === user.id)
      if (idx >= 0) {
        const copy = [...prev]
        copy[idx] = newLoc
        return copy
      }
      return [...prev, newLoc]
    })

    if (!isDemoMode) {
      await supabase.from('location_updates').upsert(
        {
          space_id: coupleSpace.id,
          user_id: user.id,
          latitude,
          longitude,
          accuracy,
          is_sharing_paused: false,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'space_id,user_id' }
      )
    }
  }

  // 8. Toggle Location Pause
  const toggleLocationPause = async () => {
    if (!coupleSpace || !user) return
    const currentPaused = Boolean(myLocation?.is_sharing_paused)
    const newPaused = !currentPaused

    setLocationUpdates((prev) =>
      prev.map((l) => (l.user_id === user.id ? { ...l, is_sharing_paused: newPaused } : l))
    )

    if (!isDemoMode && myLocation) {
      await supabase
        .from('location_updates')
        .update({ is_sharing_paused: newPaused, updated_at: new Date().toISOString() })
        .eq('space_id', coupleSpace.id)
        .eq('user_id', user.id)
    }
  }

  // 9. Create Special Date
  const createSpecialDate = async (title: string, eventDate: string, isAnnual: boolean, icon: string) => {
    if (!coupleSpace || !user) return

    const newDate: SpecialDate = {
      id: `date-${Date.now()}`,
      space_id: coupleSpace.id,
      title,
      event_date: eventDate,
      is_annual: isAnnual,
      icon,
      created_by: user.id,
      created_at: new Date().toISOString(),
    }

    setSpecialDates((prev) => [...prev, newDate].sort((a, b) => a.event_date.localeCompare(b.event_date)))

    if (!isDemoMode) {
      await supabase.from('special_dates').insert({
        space_id: coupleSpace.id,
        title,
        event_date: eventDate,
        is_annual: isAnnual,
        icon,
        created_by: user.id,
      })
    }
  }

  // 10. Rotate Hourly Photo Now (Deterministic or manual rotation)
  const rotateHourlyPhoto = async () => {
    if (!coupleSpace) return
    if (photos.length === 0) return

    if (isDemoMode) {
      // Pick next or random
      const otherPhotos = photos.filter((p) => p.id !== currentHourlyPhoto?.id)
      const next = otherPhotos.length > 0 ? otherPhotos[Math.floor(Math.random() * otherPhotos.length)] : photos[0]
      setCurrentHourlyPhoto(next)
      return
    }

    const { data } = await supabase.rpc('get_or_rotate_current_photo', {
      p_space_id: coupleSpace.id,
    })
    if (data) {
      setCurrentHourlyPhoto(data as Photo)
    }
  }

  // 11. Create Couple Space (Atomic PostgreSQL function with token generation)
  const createCoupleSpace = async (name: string, startDate: string) => {
    if (!user) return { success: false, error: 'User must be authenticated' }

    if (isDemoMode) {
      const demoToken = `olw_${Math.random().toString(36).substring(2, 12)}`
      const newSpace: CoupleSpace = {
        id: `space-${Date.now()}`,
        name: name || 'Our Little World ♡',
        relationship_start_date: startDate,
        widget_access_token: demoToken,
        created_by: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      setCoupleSpace(newSpace)
      return { success: true, widgetToken: demoToken }
    }

    try {
      const { data, error } = await supabase.rpc('create_couple_space', {
        p_name: name || 'Our Little World',
        p_relationship_start_date: startDate,
      })

      if (error) throw error

      const rawToken = data?.widget_token
      if (rawToken && data?.space_id) {
        localStorage.setItem(`widget_token_${data.space_id}`, rawToken)
      }

      // Fetch space
      const { data: space } = await supabase
        .from('couple_spaces')
        .select('*')
        .eq('id', data.space_id)
        .single()

      if (space) {
        setCoupleSpace({
          ...space,
          widget_access_token: rawToken,
        })
      }

      return { success: true, widgetToken: rawToken }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create space'
      return { success: false, error: msg }
    }
  }

  // 12. Join Couple Space (Atomic redemption with row lock)
  const joinCoupleSpace = async (code: string) => {
    if (!user) return { success: false, error: 'User must be authenticated' }
    const cleanCode = code.trim().toUpperCase()

    if (isDemoMode) {
      setCoupleSpace(DEMO_COUPLE_SPACE)
      return { success: true }
    }

    try {
      const { data, error } = await supabase.rpc('redeem_invitation', {
        p_invitation_code: cleanCode,
      })

      if (error) {
        return { success: false, error: error.message || 'Invalid or expired invitation code' }
      }

      if (data?.space_id) {
        const { data: space } = await supabase
          .from('couple_spaces')
          .select('*')
          .eq('id', data.space_id)
          .single()

        if (space) {
          const cachedToken = localStorage.getItem(`widget_token_${space.id}`)
          setCoupleSpace({
            ...space,
            widget_access_token: cachedToken || undefined,
          })
        }
      }

      return { success: true }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to join space'
      return { success: false, error: msg }
    }
  }

  // 13. Rotate Widget Access Token
  const rotateWidgetToken = async (): Promise<string | null> => {
    if (!coupleSpace) return null

    if (isDemoMode) {
      const newToken = `olw_${Math.random().toString(36).substring(2, 12)}`
      setCoupleSpace({ ...coupleSpace, widget_access_token: newToken })
      return newToken
    }

    try {
      const { data, error } = await supabase.rpc('rotate_widget_token', {
        p_space_id: coupleSpace.id,
      })

      if (error) {
        console.error('Failed to rotate token:', error)
        return null
      }

      localStorage.setItem(`widget_token_${coupleSpace.id}`, data)
      setCoupleSpace({ ...coupleSpace, widget_access_token: data })
      return data
    } catch (err) {
      console.error('Error rotating widget token:', err)
      return null
    }
  }

  // 13. Generate Unique Invitation Code
  const generateInviteCode = async (): Promise<string | null> => {
    if (!coupleSpace || !user) return null

    // Clean 8-character uppercase pairing code
    const code = Math.random().toString(36).substring(2, 10).toUpperCase()

    if (isDemoMode) {
      return code
    }

    const { data, error } = await supabase
      .from('invitations')
      .insert({
        space_id: coupleSpace.id,
        invitation_code: code,
        created_by: user.id,
      })
      .select('invitation_code')
      .single()

    if (error) {
      console.error('Error generating invite:', error)
      return null
    }

    return data.invitation_code
  }

  return (
    <CoupleContext.Provider
      value={{
        photos,
        currentHourlyPhoto,
        myMood,
        partnerMood,
        moodHistory: moods,
        messages,
        dailyQuestion,
        myAnswer,
        partnerAnswer,
        areBothAnswersRevealed,
        allAnswersHistory: questionAnswers,
        virtualInteractions,
        latestInteraction,
        specialDates,
        myLocation,
        partnerLocation,
        distanceKm,
        distanceTrend,
        isLocationPaused,
        daysTogether,
        daysToNextAnniversary,
        isLoadingData,
        activeTab,
        setActiveTab,
        uploadPhotos,
        toggleFavoritePhoto,
        updateMood,
        sendMessage,
        submitDailyAnswer,
        sendVirtualInteraction,
        markInteractionOpened,
        updateLocation,
        toggleLocationPause,
        createSpecialDate,
        createCoupleSpace,
        joinCoupleSpace,
        generateInviteCode,
        rotateHourlyPhoto,
        rotateWidgetToken,
      }}
    >
      {children}
    </CoupleContext.Provider>
  )
}

export const useCouple = () => {
  const context = useContext(CoupleContext)
  if (!context) throw new Error('useCouple must be used within a CoupleProvider')
  return context
}
