import React, { useState } from 'react'
import { Send, Sparkles, History } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useCouple } from '../../context/CoupleContext'
import { VIRTUAL_INTERACTIONS } from '../../types/couple'
import { VirtualInteractionType } from '../../types/database'
import { formatTimeAgo } from '../../lib/geo'

export const VirtualInteractionsTab: React.FC = () => {
  const { profile, partnerProfile } = useAuth()
  const { virtualInteractions, sendVirtualInteraction } = useCouple()

  const [selectedType, setSelectedType] = useState<VirtualInteractionType>('forehead_kiss')
  const [customNote, setCustomNote] = useState('')
  const [justSent, setJustSent] = useState(false)

  const handleSend = async () => {
    await sendVirtualInteraction(selectedType, customNote)
    setCustomNote('')
    setJustSent(true)
    setTimeout(() => setJustSent(false), 2500)
  }

  const activeConfig = VIRTUAL_INTERACTIONS.find((i) => i.type === selectedType) || VIRTUAL_INTERACTIONS[0]

  return (
    <div className="space-y-6 pb-24 max-w-xl mx-auto px-4 pt-2">
      {/* Title */}
      <div>
        <h2 className="font-serif text-2xl font-medium text-warm-900 flex items-center gap-1.5">
          <span>Hugs, Kisses & Touches</span>
          <span className="text-blush-500 font-sans text-lg">♡</span>
        </h2>
        <p className="text-xs text-warm-500 mt-0.5">
          Send gentle digital affections that burst into fullscreen animations on his device
        </p>
      </div>

      {/* Selector Grid */}
      <div className="grid grid-cols-3 gap-3">
        {VIRTUAL_INTERACTIONS.map((item) => {
          const isSelected = selectedType === item.type
          return (
            <button
              key={item.type}
              onClick={() => setSelectedType(item.type)}
              className={`p-4 rounded-3xl border flex flex-col items-center text-center transition-all active:scale-95 ${
                isSelected
                  ? 'bg-gradient-to-b from-white to-blush-50/70 border-blush-400 shadow-romantic scale-102 ring-2 ring-blush-200'
                  : 'bg-white border-warm-200/80 hover:bg-cream-50 hover:border-warm-300 shadow-2xs'
              }`}
            >
              <span className="text-4xl mb-2 filter drop-shadow-xs">{item.icon}</span>
              <span className="font-serif text-sm font-medium text-warm-900 leading-tight">
                {item.title}
              </span>
              <span className="text-[10px] text-warm-400 font-sans mt-0.5 line-clamp-1">
                {item.description}
              </span>
            </button>
          )
        })}
      </div>

      {/* Selected Action Preview & Personal Note Card */}
      <div className="bg-white rounded-3xl p-5 shadow-soft border border-warm-200/70 space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-warm-100">
          <div className="w-10 h-10 rounded-2xl bg-blush-100 flex items-center justify-center text-2xl">
            {activeConfig.icon}
          </div>
          <div>
            <h4 className="font-serif text-base font-medium text-warm-900">
              Sending a {activeConfig.title}
            </h4>
            <p className="text-xs text-warm-500">To {partnerProfile?.nickname || 'Your Boyfriend'}</p>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-warm-600 uppercase tracking-wider mb-1.5">
            Attach a whispered note (Optional)
          </label>
          <input
            type="text"
            value={customNote}
            onChange={(e) => setCustomNote(e.target.value)}
            placeholder="e.g. Thinking about you this second... miss you so much"
            className="w-full px-4 py-2.5 rounded-2xl bg-cream-50 border border-warm-200 text-sm text-warm-800 placeholder-warm-400 focus:outline-none focus:ring-2 focus:ring-blush-300 font-sans"
          />
        </div>

        <button
          onClick={handleSend}
          className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-blush-500 to-rose-500 hover:opacity-95 text-white font-sans text-sm font-medium shadow-romantic active:scale-98 transition-all flex items-center justify-center gap-2"
        >
          {justSent ? (
            <>
              <Sparkles className="w-4 h-4 text-cream-200 animate-spin" />
              <span>Sent with Endless Love! ♡</span>
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>Send {activeConfig.title}</span>
            </>
          )}
        </button>
      </div>

      {/* Interaction History */}
      <div className="bg-white rounded-3xl p-5 shadow-soft border border-warm-200/70 space-y-3">
        <div className="flex items-center gap-2 pb-2 border-b border-warm-100">
          <History className="w-4 h-4 text-warm-400" />
          <h3 className="font-serif text-base font-medium text-warm-900">
            Recent Hugs & Kisses Log
          </h3>
        </div>

        {virtualInteractions.length === 0 ? (
          <p className="text-xs text-warm-400 italic">No interactions sent yet. Be the first to send a cuddle!</p>
        ) : (
          <div className="divide-y divide-warm-100">
            {virtualInteractions.slice(0, 8).map((it) => {
              const isMine = it.sender_id === profile?.id
              const config = VIRTUAL_INTERACTIONS.find((c) => c.type === it.interaction_type) || VIRTUAL_INTERACTIONS[0]
              return (
                <div key={it.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl">{config.icon}</span>
                    <div>
                      <p className="font-sans font-medium text-warm-800">
                        {isMine ? 'You' : partnerProfile?.nickname || 'Him'} sent a{' '}
                        <span className="text-blush-700">{config.title}</span>
                      </p>
                      {it.message && <p className="text-warm-500 italic text-[11px]">"{it.message}"</p>}
                    </div>
                  </div>
                  <span className="text-warm-400 text-[10px] shrink-0 font-sans">
                    {formatTimeAgo(it.created_at)}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
