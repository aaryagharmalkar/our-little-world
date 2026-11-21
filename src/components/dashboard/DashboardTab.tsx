import React, { useState } from 'react'
import {
  Heart,
  RotateCw,
  Navigation,
  Sparkles,
  ChevronRight,
  Lock,
  Eye,
  Calendar,
  MessageCircle,
  HelpCircle,
  Clock,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useCouple } from '../../context/CoupleContext'
import { formatDistance, formatTimeAgo, isLocationStale } from '../../lib/geo'

interface Props {
  onOpenPhotoLightbox: (photo: unknown) => void
  onOpenUpload: () => void
}

export const DashboardTab: React.FC<Props> = ({ onOpenPhotoLightbox, onOpenUpload }) => {
  const { profile, partnerProfile } = useAuth()
  const {
    currentHourlyPhoto,
    rotateHourlyPhoto,
    myMood,
    partnerMood,
    distanceKm,
    distanceTrend,
    isLocationPaused,
    myLocation,
    partnerLocation,
    updateLocation,
    dailyQuestion,
    myAnswer,
    areBothAnswersRevealed,
    daysTogether,
    daysToNextAnniversary,
    messages,
    sendVirtualInteraction,
    setActiveTab,
  } = useCouple()

  const [isRotating, setIsRotating] = useState(false)
  const [isLocating, setIsLocating] = useState(false)

  const handleManualRotate = async (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsRotating(true)
    await rotateHourlyPhoto()
    setTimeout(() => setIsRotating(false), 500)
  }

  const handleUpdateCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.')
      return
    }
    setIsLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        updateLocation(pos.coords.latitude, pos.coords.longitude, pos.coords.accuracy)
        setIsLocating(false)
      },
      (err) => {
        console.error('Geo error:', err)
        alert('Could not retrieve location. Please check browser permissions.')
        setIsLocating(false)
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  const latestMessage = messages.length > 0 ? messages[messages.length - 1] : null
  const latestLocationTime = partnerLocation?.updated_at || myLocation?.updated_at
  const stale = isLocationStale(latestLocationTime)

  return (
    <div className="space-y-5 pb-24 max-w-xl mx-auto px-4 pt-2">
      {/* ------------------------------------------------------------------ */}
      {/* 1. HERO PHOTO OF THE HOUR                                          */}
      {/* ------------------------------------------------------------------ */}
      <div className="relative group">
        <div
          onClick={() => currentHourlyPhoto && onOpenPhotoLightbox(currentHourlyPhoto)}
          className="relative w-full aspect-[4/3] sm:aspect-[16/11] rounded-3xl overflow-hidden shadow-romantic bg-warm-200 border border-blush-200/50 cursor-pointer transition-all hover:shadow-float"
        >
          {currentHourlyPhoto ? (
            <>
              <img
                src={currentHourlyPhoto.public_url}
                alt="Shared memory"
                className="w-full h-full object-cover object-center transform group-hover:scale-[1.02] transition-transform duration-700 ease-out"
                fetchPriority="high"
              />
              {/* Subtle gradient vignette */}
              <div className="absolute inset-0 bg-gradient-to-t from-warm-900/60 via-transparent to-black/20 pointer-events-none" />

              {/* Top Controls Badge */}
              <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between text-white">
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-warm-900/40 backdrop-blur-md text-[11px] font-sans font-medium tracking-wide border border-white/20">
                  <Sparkles className="w-3 h-3 text-blush-300" />
                  <span>Photo of the Hour</span>
                </span>

                <button
                  onClick={handleManualRotate}
                  title="Rotate to another memory"
                  className="p-2 rounded-full bg-warm-900/40 backdrop-blur-md hover:bg-warm-900/70 border border-white/20 transition-all active:scale-95 text-white/90"
                >
                  <RotateCw className={`w-3.5 h-3.5 ${isRotating ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {/* Bottom Caption & Memory info */}
              <div className="absolute bottom-3.5 left-4 right-4 text-white">
                {currentHourlyPhoto.caption && (
                  <p className="font-handwriting text-xl sm:text-2xl text-cream-50 leading-snug drop-shadow-md line-clamp-2">
                    "{currentHourlyPhoto.caption}"
                  </p>
                )}
                <div className="flex items-center justify-between mt-1 text-[11px] text-cream-200/90 font-sans">
                  <span>Uploaded by {currentHourlyPhoto.uploader_nickname || 'Us ♡'}</span>
                  {currentHourlyPhoto.is_favorite && (
                    <span className="flex items-center gap-1 text-blush-300">
                      <Heart className="w-3.5 h-3.5 fill-blush-300" /> Favorite
                    </span>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-6 text-center bg-cream-50">
              <div className="w-12 h-12 rounded-full bg-blush-100 flex items-center justify-center text-blush-500 mb-3">
                <Heart className="w-6 h-6 stroke-1" />
              </div>
              <h3 className="font-serif text-lg text-warm-800 mb-1">Our Shared Photo Album</h3>
              <p className="text-xs text-warm-500 max-w-xs mb-4">
                Upload your special memories here. They will rotate hourly on your iPhone home screen widget!
              </p>
              <button
                onClick={onOpenUpload}
                className="px-4 py-2 rounded-xl bg-blush-500 text-white text-xs font-medium hover:bg-blush-600 transition-colors shadow-soft"
              >
                Upload First Photo
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 2. DISTANCE BETWEEN US                                             */}
      {/* ------------------------------------------------------------------ */}
      <div
        onClick={() => setActiveTab('location')}
        className="bg-white/95 rounded-3xl p-4 sm:p-5 shadow-soft border border-warm-200/70 hover:border-blush-200 transition-all cursor-pointer group"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-sans uppercase tracking-widest text-warm-500 font-semibold">
              Distance Between Us
            </span>
            <span className="text-blush-400">♡</span>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation()
              handleUpdateCurrentLocation()
            }}
            disabled={isLocating}
            title="Update my current GPS location"
            className="flex items-center gap-1 text-[11px] font-sans text-blush-600 hover:text-blush-700 bg-blush-50 px-2.5 py-1 rounded-full border border-blush-100 transition-colors"
          >
            <Navigation className={`w-3 h-3 ${isLocating ? 'animate-spin' : ''}`} />
            <span>{isLocating ? 'Locating...' : 'Update GPS'}</span>
          </button>
        </div>

        <div className="flex items-baseline justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-serif text-3xl font-medium tracking-tight text-warm-900">
                {isLocationPaused
                  ? 'Sharing Paused'
                  : distanceKm !== null
                  ? `${formatDistance(distanceKm)}`
                  : 'Awaiting Location'}
              </span>

              {distanceTrend === 'getting_closer' && !isLocationPaused && (
                <span className="text-xs bg-emerald-50 text-emerald-700 font-medium px-2 py-0.5 rounded-full border border-emerald-200 animate-pulse">
                  Getting closer...
                </span>
              )}
              {distanceTrend === 'moving_farther' && !isLocationPaused && (
                <span className="text-xs bg-warm-100 text-warm-600 font-medium px-2 py-0.5 rounded-full">
                  Moving apart
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 mt-1.5 text-xs text-warm-500">
              <span className="font-medium text-warm-700">
                {profile?.nickname || 'You'} ♡ {partnerProfile?.nickname || 'Him'}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-warm-400" />
                {latestLocationTime ? `Updated ${formatTimeAgo(latestLocationTime)}` : 'Not recorded yet'}
              </span>
              {stale && !isLocationPaused && (
                <span className="text-amber-600 bg-amber-50 px-1.5 py-0.2 rounded text-[10px]">
                  (Stale)
                </span>
              )}
            </div>
          </div>

          <ChevronRight className="w-5 h-5 text-warm-400 group-hover:translate-x-1 group-hover:text-blush-500 transition-all" />
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 3. DAILY MOOD CHECK-IN SUMMARY                                     */}
      {/* ------------------------------------------------------------------ */}
      <div className="grid grid-cols-2 gap-3">
        {/* Your Mood */}
        <div
          onClick={() => setActiveTab('mood')}
          className="bg-white/95 rounded-3xl p-4 shadow-soft border border-warm-200/70 hover:border-blush-200 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-sans uppercase tracking-wider text-warm-400 font-semibold">
              Your Mood
            </span>
            <span className="text-[11px] text-blush-600 font-medium">Edit</span>
          </div>

          <div className="flex items-center gap-2.5">
            <span className="text-3xl filter drop-shadow-xs">
              {myMood?.emoji || '🤍'}
            </span>
            <div>
              <p className="font-serif text-base font-medium text-warm-900 leading-tight">
                {myMood?.mood_label || 'Check in'}
              </p>
              <p className="text-[11px] text-warm-500 truncate max-w-[120px]">
                {myMood?.note || 'Tap to set mood'}
              </p>
            </div>
          </div>
        </div>

        {/* Partner's Mood */}
        <div
          onClick={() => setActiveTab('mood')}
          className="bg-white/95 rounded-3xl p-4 shadow-soft border border-warm-200/70 hover:border-lavender-200 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-sans uppercase tracking-wider text-warm-400 font-semibold">
              {partnerProfile?.nickname || "His"} Mood
            </span>
            <span className="text-[10px] text-warm-400">
              {partnerMood ? formatTimeAgo(partnerMood.created_at) : 'Waiting'}
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <span className="text-3xl filter drop-shadow-xs">
              {partnerMood?.emoji || '🤍'}
            </span>
            <div>
              <p className="font-serif text-base font-medium text-warm-900 leading-tight">
                {partnerMood?.mood_label || 'Not checked in'}
              </p>
              <p className="text-[11px] text-warm-500 truncate max-w-[120px]">
                {partnerMood?.note || 'No note left yet'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 4. QUESTION OF THE DAY CARD                                        */}
      {/* ------------------------------------------------------------------ */}
      <div
        onClick={() => setActiveTab('questions')}
        className="bg-gradient-to-br from-white via-cream-50 to-blush-50/60 rounded-3xl p-5 shadow-soft border border-blush-100 hover:border-blush-200 transition-all cursor-pointer group"
      >
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-1.5 text-blush-600">
            <HelpCircle className="w-4 h-4" />
            <span className="text-xs font-sans uppercase tracking-widest font-semibold">
              Question of the Day
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {areBothAnswersRevealed ? (
              <span className="flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full font-medium border border-emerald-200">
                <Eye className="w-3 h-3" /> Revealed
              </span>
            ) : myAnswer ? (
              <span className="flex items-center gap-1 text-[11px] text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full font-medium border border-amber-200">
                <Lock className="w-3 h-3" /> Waiting for partner
              </span>
            ) : (
              <span className="text-[11px] text-blush-600 bg-blush-100/80 px-2.5 py-0.5 rounded-full font-medium">
                Tap to answer
              </span>
            )}
          </div>
        </div>

        <p className="font-serif text-lg text-warm-900 leading-snug mb-3">
          {dailyQuestion?.question_text || 'What is your favorite memory of us together?'}
        </p>

        {/* Answer Preview or Blurred Teaser */}
        {areBothAnswersRevealed ? (
          <div className="bg-white/80 rounded-2xl p-3 border border-blush-100/80 space-y-1.5 text-xs text-warm-700">
            <p>
              <strong className="text-blush-700">{profile?.nickname || 'You'}:</strong> "{myAnswer?.answer_text}"
            </p>
          </div>
        ) : (
          <div className="flex items-center justify-between text-xs text-warm-500 pt-1 border-t border-warm-200/50">
            <span>Answers remain secret until both of you reply!</span>
            <span className="text-blush-600 font-medium group-hover:translate-x-1 transition-transform flex items-center gap-0.5">
              Answer now <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 5. COUNTDOWN & OUR STORY                                           */}
      {/* ------------------------------------------------------------------ */}
      <div
        onClick={() => setActiveTab('countdown')}
        className="bg-white/95 rounded-3xl p-5 shadow-soft border border-warm-200/70 hover:border-warm-300 transition-all cursor-pointer"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5 text-warm-500">
            <Calendar className="w-4 h-4 text-blush-500" />
            <span className="text-xs font-sans uppercase tracking-widest font-semibold">
              Our Story
            </span>
          </div>
          <span className="text-xs text-blush-600 font-medium">View Dates</span>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="text-xs text-warm-500 font-sans">Together For</span>
            <p className="font-serif text-2xl sm:text-3xl font-medium text-warm-900">
              {daysTogether}{' '}
              <span className="text-sm font-sans font-normal text-warm-500">days</span>
            </p>
          </div>
          <div className="border-l border-warm-200/80 pl-4">
            <span className="text-xs text-warm-500 font-sans">Next Anniversary</span>
            <p className="font-serif text-2xl sm:text-3xl font-medium text-blush-600">
              {daysToNextAnniversary}{' '}
              <span className="text-sm font-sans font-normal text-warm-500">days</span>
            </p>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 6. LATEST NOTE & QUICK SEND                                        */}
      {/* ------------------------------------------------------------------ */}
      <div
        onClick={() => setActiveTab('messages')}
        className="bg-white/95 rounded-3xl p-4 shadow-soft border border-warm-200/70 hover:border-blush-200 transition-all cursor-pointer"
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 text-warm-500 text-xs font-semibold uppercase tracking-wider">
            <MessageCircle className="w-3.5 h-3.5 text-blush-500" />
            <span>Latest Note</span>
          </div>
          <span className="text-xs text-blush-600 font-medium">Open Chat</span>
        </div>

        {latestMessage ? (
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-warm-800 font-sans">
                "{latestMessage.content}"
              </p>
              <p className="text-[11px] text-warm-400 mt-1">
                From {latestMessage.sender_id === profile?.id ? 'You' : partnerProfile?.nickname || 'Him'} •{' '}
                {formatTimeAgo(latestMessage.created_at)}
              </p>
            </div>
            <ChevronRight className="w-4 h-4 text-warm-400 self-center" />
          </div>
        ) : (
          <p className="text-xs text-warm-400 italic">No messages yet. Send a little note to make their day!</p>
        )}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 7. QUICK VIRTUAL TOUCH ROW                                         */}
      {/* ------------------------------------------------------------------ */}
      <div className="bg-sand-50/80 rounded-3xl p-4 border border-sand-200/60 text-center">
        <p className="text-xs font-sans text-warm-500 mb-2 font-medium">
          Send a quick touch right now ♡
        </p>
        <div className="flex items-center justify-around">
          {[
            { type: 'hug' as const, label: 'Hug', icon: '🫂' },
            { type: 'kiss' as const, label: 'Kiss', icon: '💋' },
            { type: 'forehead_kiss' as const, label: 'Forehead', icon: '✨' },
            { type: 'heart' as const, label: 'Heart', icon: '💖' },
            { type: 'cuddle' as const, label: 'Cuddle', icon: '🧸' },
          ].map((item) => (
            <button
              key={item.type}
              onClick={() => sendVirtualInteraction(item.type)}
              className="flex flex-col items-center p-2 rounded-2xl hover:bg-white hover:shadow-soft transition-all active:scale-95"
            >
              <span className="text-2xl mb-1">{item.icon}</span>
              <span className="text-[10px] font-sans text-warm-600 font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
