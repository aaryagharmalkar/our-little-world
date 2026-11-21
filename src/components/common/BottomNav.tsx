import React from 'react'
import { Home, Image as ImageIcon, MessageCircleHeart, HeartHandshake, Compass } from 'lucide-react'
import { useCouple } from '../../context/CoupleContext'

export const BottomNav: React.FC = () => {
  const { activeTab, setActiveTab, latestInteraction } = useCouple()

  const navItems = [
    { id: 'dashboard', label: 'Home', icon: Home },
    { id: 'photos', label: 'Photos', icon: ImageIcon },
    { id: 'messages', label: 'Notes', icon: MessageCircleHeart },
    { 
      id: 'interactions', 
      label: 'Hugs & Kisses', 
      icon: HeartHandshake,
      hasBadge: Boolean(latestInteraction && !latestInteraction.opened_at) 
    },
    { id: 'more', label: 'Explore', icon: Compass },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-cream-50/95 backdrop-blur-lg border-t border-warm-200/60 pb-safe transition-all shadow-soft">
      <div className="max-w-md mx-auto flex items-center justify-around px-2 py-1.5">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = activeTab === item.id || (item.id === 'more' && ['mood', 'questions', 'countdown', 'location', 'widget'].includes(activeTab))

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`relative flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl transition-all ${
                isActive
                  ? 'text-blush-600 scale-105'
                  : 'text-warm-400 hover:text-warm-600'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.2px]' : 'stroke-[1.8px]'}`} />
                {item.hasBadge && (
                  <span className="absolute -top-1 -right-1.5 w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                )}
              </div>
              <span className={`text-[10px] mt-1 font-sans tracking-tight transition-colors ${
                isActive ? 'font-semibold text-blush-600' : 'font-normal text-warm-500'
              }`}>
                {item.label}
              </span>
              {isActive && (
                <div className="w-1 h-1 rounded-full bg-blush-500 mt-0.5" />
              )}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
