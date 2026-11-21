import React from 'react'
import {
  Smile,
  HelpCircle,
  Calendar,
  Navigation,
  Smartphone,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Heart,
} from 'lucide-react'
import { useCouple } from '../../context/CoupleContext'
import { useAuth } from '../../context/AuthContext'

interface Props {
  onOpenPairing: () => void
}

export const MoreMenuTab: React.FC<Props> = ({ onOpenPairing }) => {
  const { setActiveTab } = useCouple()
  const { coupleSpace } = useAuth()

  const menuSections = [
    {
      id: 'mood',
      title: 'Daily Mood Check-in',
      subtitle: 'Express your feelings with emojis & sweet notes',
      icon: Smile,
      badge: 'Daily',
      color: 'text-amber-600 bg-amber-50 border-amber-200',
    },
    {
      id: 'questions',
      title: 'Question of the Day',
      subtitle: 'Shared questions unlocked together each day',
      icon: HelpCircle,
      badge: 'Shared',
      color: 'text-rose-600 bg-rose-50 border-rose-200',
    },
    {
      id: 'countdown',
      title: 'Our Story & Countdowns',
      subtitle: 'Anniversaries, days together & future milestones',
      icon: Calendar,
      badge: null,
      color: 'text-purple-600 bg-purple-50 border-purple-200',
    },
    {
      id: 'location',
      title: 'Distance Between Us',
      subtitle: 'GPS proximity, status trends & privacy controls',
      icon: Navigation,
      badge: 'GPS',
      color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
    },
    {
      id: 'widget',
      title: 'Custom Scriptable Widget',
      subtitle: 'Live simulator & setup guide for iPhone 14/15',
      icon: Smartphone,
      badge: 'iOS',
      color: 'text-blush-600 bg-blush-50 border-blush-200',
    },
  ]

  return (
    <div className="space-y-6 pb-24 max-w-xl mx-auto px-4 pt-2">
      {/* Header */}
      <div>
        <h2 className="font-serif text-2xl font-medium text-warm-900 flex items-center gap-1.5">
          <span>Explore Our World</span>
          <span className="text-blush-500 font-sans text-lg">♡</span>
        </h2>
        <p className="text-xs text-warm-500 mt-0.5">
          All intimate rooms and features designed exclusively for the two of you
        </p>
      </div>

      {/* Birthday Surprise / Pairing Banner */}
      <div
        onClick={onOpenPairing}
        className="bg-gradient-to-r from-blush-500 via-rose-500 to-blush-600 rounded-3xl p-5 text-white shadow-romantic cursor-pointer group transition-all"
      >
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-cream-100">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Birthday Surprise QR</span>
            </span>
            <h3 className="font-serif text-lg font-medium leading-tight">
              Pair Partner's iPhone
            </h3>
            <p className="text-xs text-cream-100/90 font-sans max-w-xs">
              Show him your generated invitation QR code so his iPhone 14 instantly links to your shared world.
            </p>
          </div>
          <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl group-hover:scale-105 transition-transform">
            <Heart className="w-6 h-6 fill-white text-white" />
          </div>
        </div>
      </div>

      {/* Feature Menu List */}
      <div className="bg-white rounded-3xl p-3 shadow-soft border border-warm-200/70 divide-y divide-warm-100">
        {menuSections.map((item) => {
          const Icon = item.icon
          return (
            <div
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className="p-3.5 rounded-2xl flex items-center justify-between hover:bg-cream-50/70 cursor-pointer transition-all group"
            >
              <div className="flex items-center gap-3.5">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border ${item.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-serif text-base font-medium text-warm-900 group-hover:text-blush-700 transition-colors">
                      {item.title}
                    </h4>
                    {item.badge && (
                      <span className="text-[10px] font-sans font-semibold text-warm-500 bg-warm-100 px-2 py-0.2 rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-warm-400 font-sans mt-0.5">
                    {item.subtitle}
                  </p>
                </div>
              </div>

              <ChevronRight className="w-5 h-5 text-warm-400 group-hover:text-blush-500 group-hover:translate-x-1 transition-all" />
            </div>
          )
        })}
      </div>

      {/* Info card */}
      <div className="bg-cream-50 rounded-3xl p-4 border border-warm-200/60 text-xs text-warm-500 flex items-center gap-2.5">
        <ShieldCheck className="w-5 h-5 text-blush-500 shrink-0" />
        <span>
          Space ID: <code className="font-mono text-warm-800">{coupleSpace?.id || 'demo-space'}</code>. All communication is encrypted and private.
        </span>
      </div>
    </div>
  )
}
