import React, { useState } from 'react'
import { Sparkles, History } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useCouple } from '../../context/CoupleContext'
import { MOOD_OPTIONS } from '../../types/couple'
import { MoodEmoji } from '../../types/database'
import { formatTimeAgo } from '../../lib/geo'

export const MoodCheckinTab: React.FC = () => {
  const { profile, partnerProfile } = useAuth()
  const { myMood, partnerMood, moodHistory, updateMood } = useCouple()

  const [selectedEmoji, setSelectedEmoji] = useState<MoodEmoji>(myMood?.emoji || '🥰')
  const [selectedLabel, setSelectedLabel] = useState<string>(myMood?.mood_label || 'Happy')
  const [note, setNote] = useState<string>(myMood?.note || '')
  const [isSaved, setIsSaved] = useState<boolean>(false)

  const handleSelectOption = (emoji: MoodEmoji, label: string) => {
    setSelectedEmoji(emoji)
    setSelectedLabel(label)
  }

  const handleSaveMood = async () => {
    await updateMood(selectedEmoji, selectedLabel, note)
    setIsSaved(true)
    setTimeout(() => setIsSaved(false), 2000)
  }

  return (
    <div className="space-y-6 pb-24 max-w-xl mx-auto px-4 pt-2">
      {/* Title */}
      <div>
        <h2 className="font-serif text-2xl font-medium text-warm-900 flex items-center gap-1.5">
          <span>Daily Mood Check-in</span>
          <span className="text-blush-500 font-sans text-lg">♡</span>
        </h2>
        <p className="text-xs text-warm-500 mt-0.5">
          Share how your heart is feeling right now with your love
        </p>
      </div>

      {/* Partner's Current Mood Card */}
      <div className="bg-gradient-to-br from-cream-50 to-lavender-50/50 rounded-3xl p-5 shadow-soft border border-lavender-200/60">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-lavender-600 font-sans">
            {partnerProfile?.nickname || "His"} Current Mood
          </span>
          <span className="text-xs text-warm-400 font-sans">
            {partnerMood ? `Updated ${formatTimeAgo(partnerMood.created_at)}` : 'Waiting for check-in'}
          </span>
        </div>

        {partnerMood ? (
          <div className="flex items-center gap-4 mt-2">
            <span className="text-5xl filter drop-shadow-sm">{partnerMood.emoji}</span>
            <div>
              <p className="font-serif text-xl font-medium text-warm-900">
                {partnerMood.mood_label}
              </p>
              {partnerMood.note ? (
                <p className="font-handwriting text-lg text-warm-700 leading-snug mt-1">
                  "{partnerMood.note}"
                </p>
              ) : (
                <p className="text-xs text-warm-400 italic">No extra note left</p>
              )}
            </div>
          </div>
        ) : (
          <p className="text-xs text-warm-500 italic mt-1">
            He hasn't shared his mood today yet. Send him a little nudge!
          </p>
        )}
      </div>

      {/* Mood Selector Grid */}
      <div className="bg-white rounded-3xl p-5 shadow-soft border border-warm-200/70 space-y-4">
        <div>
          <h3 className="font-serif text-base font-medium text-warm-900 mb-1">
            How are you feeling, {profile?.nickname || 'Love'}?
          </h3>
          <p className="text-xs text-warm-500">
            Pick the emoji that best captures your mood today:
          </p>
        </div>

        <div className="grid grid-cols-5 gap-2.5">
          {MOOD_OPTIONS.map((opt) => {
            const isSelected = selectedEmoji === opt.emoji
            return (
              <button
                key={opt.emoji}
                onClick={() => handleSelectOption(opt.emoji, opt.label)}
                className={`flex flex-col items-center justify-center p-2.5 rounded-2xl border transition-all active:scale-95 ${
                  isSelected
                    ? `${opt.bg} ${opt.border} border-2 shadow-sm scale-105`
                    : 'bg-warm-50/50 border-warm-100 hover:bg-cream-100 hover:border-warm-200'
                }`}
              >
                <span className="text-3xl mb-1">{opt.emoji}</span>
                <span className="text-[10px] font-sans font-medium text-warm-700 truncate w-full text-center">
                  {opt.label}
                </span>
              </button>
            )
          })}
        </div>

        {/* Optional Note */}
        <div className="pt-2">
          <label className="block text-xs font-semibold text-warm-600 uppercase tracking-wider mb-1.5">
            Personal Note (Optional)
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Had a tiring day, need a warm hug tonight..."
            rows={2}
            className="w-full px-4 py-2.5 rounded-2xl bg-cream-50 border border-warm-200 text-sm text-warm-800 placeholder-warm-400 focus:outline-none focus:ring-2 focus:ring-blush-300 font-sans"
          />
        </div>

        {/* Save Button */}
        <button
          onClick={handleSaveMood}
          className="w-full py-3.5 px-6 rounded-2xl bg-blush-500 hover:bg-blush-600 text-white font-sans text-sm font-medium shadow-romantic active:scale-98 transition-all flex items-center justify-center gap-2"
        >
          <Sparkles className="w-4 h-4" />
          <span>{isSaved ? 'Mood Updated! ♡' : 'Update My Mood'}</span>
        </button>
      </div>

      {/* Mood History Timeline */}
      <div className="bg-white rounded-3xl p-5 shadow-soft border border-warm-200/70 space-y-3">
        <div className="flex items-center gap-2 pb-2 border-b border-warm-100">
          <History className="w-4 h-4 text-warm-400" />
          <h3 className="font-serif text-base font-medium text-warm-900">
            Recent Mood History
          </h3>
        </div>

        {moodHistory.length === 0 ? (
          <p className="text-xs text-warm-400 italic">No mood history recorded yet.</p>
        ) : (
          <div className="divide-y divide-warm-100">
            {moodHistory.slice(0, 8).map((m) => {
              const isMine = m.user_id === profile?.id
              return (
                <div key={m.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl">{m.emoji}</span>
                    <div>
                      <p className="font-sans font-medium text-warm-800">
                        {isMine ? 'You' : partnerProfile?.nickname || 'Him'} felt{' '}
                        <span className="text-blush-700">{m.mood_label}</span>
                      </p>
                      {m.note && <p className="text-warm-500 italic text-[11px]">"{m.note}"</p>}
                    </div>
                  </div>
                  <span className="text-warm-400 text-[10px] shrink-0 font-sans">
                    {formatTimeAgo(m.created_at)}
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
