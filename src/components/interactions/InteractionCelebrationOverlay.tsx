import React, { useEffect, useState } from 'react'
import confetti from 'canvas-confetti'
import { X, Heart } from 'lucide-react'
import { VirtualInteraction } from '../../types/database'
import { VIRTUAL_INTERACTIONS } from '../../types/couple'

interface Props {
  interaction: VirtualInteraction | null
  onClose: () => void
}

export const InteractionCelebrationOverlay: React.FC<Props> = ({ interaction, onClose }) => {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (interaction && !interaction.opened_at) {
      setVisible(true)

      // Trigger custom romantic confetti burst
      const isKiss = interaction.interaction_type === 'kiss' || interaction.interaction_type === 'forehead_kiss'
      const colors = isKiss ? ['#CE7973', '#DD9B93', '#F2D7D2', '#FF4D6D'] : ['#AB97CC', '#E4DBEF', '#CE7973', '#FFD166']

      confetti({
        particleCount: 50,
        spread: 70,
        origin: { y: 0.6 },
        colors,
      })

      const timer = setTimeout(() => {
        confetti({
          particleCount: 30,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors,
        })
        confetti({
          particleCount: 30,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors,
        })
      }, 300)

      return () => clearTimeout(timer)
    }
  }, [interaction])

  if (!interaction || !visible) return null

  const config = VIRTUAL_INTERACTIONS.find((i) => i.type === interaction.interaction_type) || VIRTUAL_INTERACTIONS[0]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-warm-900/40 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-sm bg-gradient-to-b from-cream-50 to-blush-50/80 rounded-4xl p-6 shadow-romantic border border-blush-200/80 text-center animate-scale-up">
        {/* Close Button */}
        <button
          onClick={() => {
            setVisible(false)
            onClose()
          }}
          className="absolute top-4 right-4 p-2 text-warm-400 hover:text-warm-700 rounded-full hover:bg-warm-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Floating Animated Badge */}
        <div className="relative mx-auto w-24 h-24 mb-4 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-blush-200 to-lavender-200 animate-pulse-slow opacity-60" />
          <div className="relative text-5xl transform hover:scale-110 transition-transform">
            {config.icon}
          </div>
          <div className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-white shadow-soft">
            <Heart className="w-4 h-4 text-blush-500 fill-blush-500" />
          </div>
        </div>

        {/* Sender Info & Title */}
        <p className="text-xs font-sans uppercase tracking-widest text-blush-600 font-semibold mb-1">
          Special Delivery from {interaction.sender_name || 'Your Love'}
        </p>
        <h2 className="font-serif text-2xl font-normal text-warm-900 mb-2">
          {config.title}
        </h2>
        <p className="text-sm font-sans text-warm-600 mb-4 px-2">
          {config.description}
        </p>

        {/* Personal Message Note if attached */}
        {interaction.message && (
          <div className="bg-white/90 border border-blush-100 rounded-2xl p-4 mb-5 shadow-inner-soft text-left">
            <p className="text-xs text-warm-400 font-medium mb-1 uppercase tracking-wider font-sans">
              Personal note:
            </p>
            <p className="font-handwriting text-lg text-warm-800 leading-snug">
              "{interaction.message}"
            </p>
          </div>
        )}

        <button
          onClick={() => {
            setVisible(false)
            onClose()
          }}
          className="w-full py-3 px-6 rounded-2xl bg-gradient-to-r from-blush-500 to-rose-500 text-white font-sans text-sm font-medium shadow-romantic hover:opacity-95 transition-opacity"
        >
          Accept with Love ♡
        </button>
      </div>
    </div>
  )
}
