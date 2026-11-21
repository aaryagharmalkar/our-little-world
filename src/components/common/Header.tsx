import React from 'react'
import { Heart, Sparkles, UserCheck, ShieldAlert, Smartphone } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useCouple } from '../../context/CoupleContext'

interface HeaderProps {
  onOpenPairing: () => void
  onOpenAuth: () => void
}

export const Header: React.FC<HeaderProps> = ({ onOpenPairing, onOpenAuth }) => {
  const { profile, partnerProfile, isDemoMode, switchDemoUser, isConfigured, coupleSpace } = useAuth()
  const { setActiveTab } = useCouple()

  return (
    <header className="sticky top-0 z-30 bg-cream-100/90 backdrop-blur-md border-b border-warm-200/60 px-4 py-3 transition-all">
      <div className="max-w-2xl mx-auto flex items-center justify-between">
        {/* App Title & Romantic Monogram */}
        <div 
          onClick={() => setActiveTab('dashboard')} 
          className="flex items-center gap-2.5 cursor-pointer group"
        >
          <div className="w-9 h-9 rounded-2xl bg-blush-100 border border-blush-200 flex items-center justify-center text-blush-600 shadow-sm group-hover:scale-105 transition-transform">
            <Heart className="w-5 h-5 fill-blush-500 text-blush-600" />
          </div>
          <div>
            <h1 className="font-serif text-lg font-medium tracking-tight text-warm-900 flex items-center gap-1.5">
              <span>{coupleSpace?.name || 'Our Little World'}</span>
              <span className="text-blush-500 text-sm">♡</span>
            </h1>
            <p className="text-[11px] font-sans text-warm-500 tracking-wide font-normal">
              {profile?.nickname || 'You'} & {partnerProfile?.nickname || 'Him'}
            </p>
          </div>
        </div>

        {/* Right Action Icons / Demo Mode Indicator */}
        <div className="flex items-center gap-2">
          {/* Widget Quick Link */}
          <button
            onClick={() => setActiveTab('widget')}
            title="Scriptable iOS Widget"
            className="p-2 rounded-xl bg-warm-100/80 text-warm-600 hover:text-blush-600 hover:bg-blush-50 transition-colors border border-warm-200/60 text-xs flex items-center gap-1.5"
          >
            <Smartphone className="w-4 h-4 text-warm-600" />
            <span className="hidden sm:inline font-sans text-xs font-medium">Widget</span>
          </button>

          {/* Pairing / Birthday Surprise QR */}
          <button
            onClick={onOpenPairing}
            title="Couple Pairing & Invitation"
            className="p-2 rounded-xl bg-blush-50 text-blush-600 hover:bg-blush-100 transition-colors border border-blush-200/70 text-xs flex items-center gap-1"
          >
            <Sparkles className="w-4 h-4 text-blush-500" />
            <span className="hidden sm:inline font-sans text-xs font-medium">Pair / Invite</span>
          </button>

          {/* Demo User Switcher if in Demo Mode */}
          {isDemoMode && (
            <div className="flex items-center bg-sand-100 rounded-xl p-0.5 border border-sand-300/70 text-xs">
              <button
                onClick={() => switchDemoUser('me')}
                className={`px-2.5 py-1 rounded-lg font-sans text-[11px] font-medium transition-all ${
                  profile?.nickname?.includes('Me')
                    ? 'bg-white text-blush-600 shadow-xs'
                    : 'text-warm-500 hover:text-warm-800'
                }`}
              >
                Me ♡
              </button>
              <button
                onClick={() => switchDemoUser('partner')}
                className={`px-2.5 py-1 rounded-lg font-sans text-[11px] font-medium transition-all ${
                  profile?.nickname?.includes('Him')
                    ? 'bg-white text-blush-600 shadow-xs'
                    : 'text-warm-500 hover:text-warm-800'
                }`}
              >
                Him ♡
              </button>
            </div>
          )}

          {!isConfigured && (
            <span 
              onClick={onOpenAuth}
              title="Demo Mode: Click to connect Supabase"
              className="hidden md:flex items-center gap-1 text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 cursor-pointer"
            >
              <ShieldAlert className="w-3 h-3 text-amber-600" />
              <span>Demo Mode</span>
            </span>
          )}

          {isConfigured && (
            <button
              onClick={onOpenAuth}
              className="p-1.5 rounded-xl hover:bg-warm-200/60 text-warm-600 transition-colors"
              title="Account settings"
            >
              <UserCheck className="w-4 h-4 text-emerald-600" />
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
