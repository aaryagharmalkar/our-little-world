import React, { useState, useRef, useEffect } from 'react'
import { Send, Heart, Sparkles } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useCouple } from '../../context/CoupleContext'
import { QUICK_MESSAGES } from '../../types/couple'
import { formatTimeAgo } from '../../lib/geo'

export const MessagesTab: React.FC = () => {
  const { profile, partnerProfile } = useAuth()
  const { messages, sendMessage } = useCouple()
  const [inputText, setInputText] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!inputText.trim()) return
    const text = inputText
    setInputText('')
    await sendMessage(text, false)
  }

  const handleQuickSend = async (msg: string) => {
    await sendMessage(msg, true)
  }

  return (
    <div className="flex flex-col h-[calc(100vh-135px)] max-w-xl mx-auto px-4 pt-1 pb-1">
      {/* Header bar */}
      <div className="flex items-center justify-between pb-3 border-b border-warm-200/70 shrink-0">
        <div>
          <h2 className="font-serif text-xl font-medium text-warm-900 flex items-center gap-1.5">
            <span>Our Little Letters</span>
            <span className="text-blush-500 font-sans text-sm">♡</span>
          </h2>
          <p className="text-[11px] text-warm-500">
            Realtime private messages synced instantly to your companion widget
          </p>
        </div>
      </div>

      {/* Quick Predefined Message Chips */}
      <div className="py-2.5 overflow-x-auto no-scrollbar flex items-center gap-1.5 shrink-0 border-b border-warm-100">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-warm-400 shrink-0 mr-1 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-blush-500" /> Quick:
        </span>
        {QUICK_MESSAGES.map((msg) => (
          <button
            key={msg}
            onClick={() => handleQuickSend(msg)}
            className="shrink-0 px-3 py-1 rounded-full bg-cream-50 hover:bg-blush-50 border border-warm-200/70 hover:border-blush-300 text-xs text-warm-700 hover:text-blush-700 transition-all active:scale-95 shadow-2xs"
          >
            {msg}
          </button>
        ))}
      </div>

      {/* Message Chat Timeline */}
      <div className="flex-1 overflow-y-auto py-4 space-y-3 pr-1">
        {messages.length === 0 ? (
          <div className="py-20 text-center space-y-2">
            <Heart className="w-8 h-8 text-blush-300 mx-auto" />
            <p className="font-serif text-base text-warm-700">No notes written yet</p>
            <p className="text-xs text-warm-400">Send your first sweet message to brighten their day!</p>
          </div>
        ) : (
          messages.map((m) => {
            const isMe = m.sender_id === profile?.id
            return (
              <div
                key={m.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} space-y-1 animate-fade-in`}
              >
                <div
                  className={`max-w-[80%] sm:max-w-[70%] px-4 py-2.5 rounded-3xl text-sm font-sans shadow-2xs ${
                    isMe
                      ? 'bg-gradient-to-r from-blush-500 to-rose-500 text-white rounded-br-xs shadow-romantic'
                      : 'bg-white text-warm-800 border border-warm-200/80 rounded-bl-xs'
                  }`}
                >
                  <p className="leading-relaxed break-words">{m.content}</p>
                </div>
                <span className="text-[10px] text-warm-400 px-1 font-sans">
                  {isMe ? 'You' : partnerProfile?.nickname || 'Him'} • {formatTimeAgo(m.created_at)}
                </span>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input box */}
      <form onSubmit={handleSend} className="pt-2 pb-safe shrink-0">
        <div className="relative flex items-center bg-white rounded-2xl border border-warm-200/80 shadow-soft p-1 focus-within:border-blush-300 focus-within:ring-2 focus-within:ring-blush-100">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Write a sweet note..."
            className="flex-1 px-4 py-2 text-sm text-warm-800 placeholder-warm-400 bg-transparent focus:outline-none font-sans"
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className={`p-2.5 rounded-xl transition-all ${
              inputText.trim()
                ? 'bg-blush-500 text-white shadow-soft hover:bg-blush-600 active:scale-95'
                : 'bg-warm-100 text-warm-300 cursor-not-allowed'
            }`}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  )
}
