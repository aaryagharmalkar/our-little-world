import React, { useState } from 'react'
import { Navigation, PauseCircle, PlayCircle, Clock, ShieldCheck } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useCouple } from '../../context/CoupleContext'
import { formatDistance, formatTimeAgo, isLocationStale } from '../../lib/geo'

export const LocationDistanceTab: React.FC = () => {
  const { profile, partnerProfile } = useAuth()
  const {
    myLocation,
    partnerLocation,
    distanceKm,
    distanceTrend,
    isLocationPaused,
    updateLocation,
    toggleLocationPause,
  } = useCouple()

  const [isLocating, setIsLocating] = useState(false)

  const handleFetchCurrentLocation = () => {
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
        alert('Could not fetch location. Please check browser permissions.')
        setIsLocating(false)
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  const latestUpdate = partnerLocation?.updated_at || myLocation?.updated_at
  const isStale = isLocationStale(latestUpdate)

  return (
    <div className="space-y-6 pb-24 max-w-xl mx-auto px-4 pt-2">
      {/* Title */}
      <div>
        <h2 className="font-serif text-2xl font-medium text-warm-900 flex items-center gap-1.5">
          <span>Distance Between Us</span>
          <span className="text-blush-500 font-sans text-lg">♡</span>
        </h2>
        <p className="text-xs text-warm-500 mt-0.5">
          Private, consent-driven proximity indicator using the Haversine formula
        </p>
      </div>

      {/* Main Distance Hero Card */}
      <div className="bg-gradient-to-br from-white via-cream-50 to-blush-50/60 rounded-3xl p-6 shadow-soft border border-blush-200/70 text-center space-y-4">
        {/* Top Names Monogram */}
        <div className="flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-widest text-warm-500 font-sans">
          <span>{profile?.nickname || 'YOU'}</span>
          <span className="text-blush-500 text-sm">♡</span>
          <span>{partnerProfile?.nickname || 'HIM'}</span>
        </div>

        {/* Big Distance Display */}
        <div>
          <h3 className="font-serif text-4xl sm:text-5xl font-medium text-warm-900 tracking-tight">
            {isLocationPaused
              ? 'Sharing Paused'
              : distanceKm !== null
              ? `${formatDistance(distanceKm)} APART`
              : 'Awaiting Location'}
          </h3>

          {/* Proximity Trend Badge */}
          {!isLocationPaused && distanceTrend === 'getting_closer' && (
            <div className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium border border-emerald-200 animate-pulse">
              <span>Getting closer...</span>
            </div>
          )}
          {!isLocationPaused && distanceTrend === 'moving_farther' && (
            <div className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full bg-warm-100 text-warm-600 text-xs font-medium">
              <span>Moving farther apart</span>
            </div>
          )}
          {!isLocationPaused && distanceTrend === 'steady' && distanceKm !== null && (
            <div className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full bg-cream-100 text-warm-600 text-xs font-medium">
              <span>Steady distance</span>
            </div>
          )}
        </div>

        {/* Timestamp & Status info */}
        <div className="pt-3 border-t border-blush-100/80 flex items-center justify-center gap-2 text-xs text-warm-500 font-sans">
          <Clock className="w-3.5 h-3.5 text-warm-400" />
          <span>Last updated: {latestUpdate ? formatTimeAgo(latestUpdate) : 'Never'}</span>
          {isStale && !isLocationPaused && (
            <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full text-[10px] border border-amber-200">
              Stale (&gt; 2 hrs)
            </span>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex gap-2 pt-1">
          <button
            onClick={handleFetchCurrentLocation}
            disabled={isLocating || isLocationPaused}
            className={`flex-1 py-3 px-4 rounded-2xl text-xs font-sans font-medium transition-all shadow-soft flex items-center justify-center gap-2 ${
              isLocationPaused
                ? 'bg-warm-100 text-warm-400 cursor-not-allowed'
                : 'bg-blush-500 hover:bg-blush-600 text-white shadow-romantic active:scale-98'
            }`}
          >
            <Navigation className={`w-4 h-4 ${isLocating ? 'animate-spin' : ''}`} />
            <span>{isLocating ? 'Locating...' : 'Update My Location Now'}</span>
          </button>

          <button
            onClick={toggleLocationPause}
            className={`px-4 py-3 rounded-2xl text-xs font-sans font-medium border transition-all flex items-center gap-1.5 ${
              isLocationPaused
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                : 'bg-warm-100 text-warm-700 border-warm-200 hover:bg-warm-200'
            }`}
          >
            {isLocationPaused ? (
              <>
                <PlayCircle className="w-4 h-4 text-emerald-600" />
                <span>Resume</span>
              </>
            ) : (
              <>
                <PauseCircle className="w-4 h-4 text-warm-500" />
                <span>Pause</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Individual Status Cards */}
      <div className="grid grid-cols-2 gap-3">
        {/* Your Location Status */}
        <div className="bg-white rounded-3xl p-4 shadow-soft border border-warm-200/70 space-y-1">
          <span className="text-[10px] font-sans uppercase tracking-wider text-warm-400 font-semibold">
            Your Location
          </span>
          <p className="font-serif text-sm font-medium text-warm-900">
            {myLocation?.is_sharing_paused
              ? 'Paused by you'
              : myLocation
              ? `Accurate to ~${Math.round(myLocation.accuracy || 10)}m`
              : 'Not shared yet'}
          </p>
          <p className="text-[11px] text-warm-400 font-sans">
            {myLocation ? formatTimeAgo(myLocation.updated_at) : 'Waiting'}
          </p>
        </div>

        {/* Partner Location Status */}
        <div className="bg-white rounded-3xl p-4 shadow-soft border border-warm-200/70 space-y-1">
          <span className="text-[10px] font-sans uppercase tracking-wider text-warm-400 font-semibold">
            {partnerProfile?.nickname || "His"} Location
          </span>
          <p className="font-serif text-sm font-medium text-warm-900">
            {partnerLocation?.is_sharing_paused
              ? 'Paused by partner'
              : partnerLocation
              ? 'Shared'
              : 'Not shared yet'}
          </p>
          <p className="text-[11px] text-warm-400 font-sans">
            {partnerLocation ? formatTimeAgo(partnerLocation.updated_at) : 'Waiting'}
          </p>
        </div>
      </div>

      {/* Privacy Guarantee & iOS Technical Note */}
      <div className="bg-sand-50 rounded-3xl p-5 border border-sand-200/70 space-y-3">
        <div className="flex items-center gap-2 text-warm-800 text-xs font-semibold">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Strict Privacy & iOS Technical Transparency</span>
        </div>

        <ul className="text-xs text-warm-600 space-y-2 font-sans leading-relaxed">
          <li className="flex items-start gap-1.5">
            <span className="text-blush-500 font-bold">•</span>
            <span>
              <strong>Private to only the two of you:</strong> Your GPS coordinates are encrypted and accessible strictly by your paired couple space.
            </span>
          </li>
          <li className="flex items-start gap-1.5">
            <span className="text-blush-500 font-bold">•</span>
            <span>
              <strong>No continuous background battery drain:</strong> iOS restricts background GPS for web apps & widgets. Location is captured when you open the app or request a foreground update.
            </span>
          </li>
          <li className="flex items-start gap-1.5">
            <span className="text-blush-500 font-bold">•</span>
            <span>
              <strong>Honest Stale Indicator:</strong> We never pretend old location data is live. If an update is older than 2 hours, it clearly flags as stale.
            </span>
          </li>
        </ul>
      </div>
    </div>
  )
}
