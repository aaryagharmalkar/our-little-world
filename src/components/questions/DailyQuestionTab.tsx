import React, { useState } from 'react'
import { Lock, Eye, Send, Sparkles, History, CheckCircle } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useCouple } from '../../context/CoupleContext'
import { formatTimeAgo } from '../../lib/geo'

export const DailyQuestionTab: React.FC = () => {
  const { profile, partnerProfile } = useAuth()
  const {
    dailyQuestion,
    myAnswer,
    partnerAnswer,
    areBothAnswersRevealed,
    allAnswersHistory,
    submitDailyAnswer,
  } = useCouple()

  const [inputAnswer, setInputAnswer] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputAnswer.trim() || isSubmitting) return

    setIsSubmitting(true)
    await submitDailyAnswer(inputAnswer)
    setInputAnswer('')
    setIsSubmitting(false)
  }

  return (
    <div className="space-y-6 pb-24 max-w-xl mx-auto px-4 pt-2">
      {/* Title */}
      <div>
        <h2 className="font-serif text-2xl font-medium text-warm-900 flex items-center gap-1.5">
          <span>Daily Question</span>
          <span className="text-blush-500 font-sans text-lg">♡</span>
        </h2>
        <p className="text-xs text-warm-500 mt-0.5">
          A new question every day to discover deeper facets of each other's hearts
        </p>
      </div>

      {/* Main Question Card */}
      <div className="bg-gradient-to-br from-white via-cream-50 to-blush-50/50 rounded-3xl p-6 shadow-soft border border-blush-200/80 space-y-4">
        {/* Status Tag */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-widest text-blush-600 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Today's Question</span>
          </span>

          {areBothAnswersRevealed ? (
            <span className="flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full font-medium border border-emerald-200">
              <Eye className="w-3.5 h-3.5" /> Both Answered!
            </span>
          ) : myAnswer ? (
            <span className="flex items-center gap-1 text-xs text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full font-medium border border-amber-200">
              <Lock className="w-3.5 h-3.5" /> Locked until partner replies
            </span>
          ) : (
            <span className="text-xs text-blush-600 bg-blush-100/80 px-2.5 py-0.5 rounded-full font-medium">
              Waiting for your answer
            </span>
          )}
        </div>

        {/* Question Text */}
        <h3 className="font-serif text-xl sm:text-2xl text-warm-900 leading-snug">
          "{dailyQuestion?.question_text || 'What is your absolute favorite memory of us together?'}"
        </h3>

        {/* Answer section */}
        {!myAnswer ? (
          <form onSubmit={handleSubmit} className="pt-2 space-y-3">
            <label className="block text-xs font-semibold text-warm-600 uppercase tracking-wider">
              Your Honest Answer
            </label>
            <textarea
              value={inputAnswer}
              onChange={(e) => setInputAnswer(e.target.value)}
              placeholder="Speak from your heart... (He will only see this once he submits his own answer!)"
              rows={3}
              className="w-full px-4 py-3 rounded-2xl bg-white border border-warm-200 text-sm text-warm-800 placeholder-warm-400 focus:outline-none focus:ring-2 focus:ring-blush-300 font-sans shadow-inner-soft"
            />
            <button
              type="submit"
              disabled={!inputAnswer.trim() || isSubmitting}
              className={`w-full py-3.5 px-6 rounded-2xl font-sans text-sm font-medium transition-all shadow-soft flex items-center justify-center gap-2 ${
                !inputAnswer.trim() || isSubmitting
                  ? 'bg-warm-200 text-warm-400 cursor-not-allowed'
                  : 'bg-blush-500 hover:bg-blush-600 text-white shadow-romantic active:scale-98'
              }`}
            >
              <Send className="w-4 h-4" />
              <span>Submit My Answer</span>
            </button>
          </form>
        ) : (
          <div className="space-y-3 pt-2">
            {/* My Answer Box */}
            <div className="bg-white rounded-2xl p-4 border border-warm-200/80 shadow-2xs">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-warm-700 uppercase tracking-wider flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                  Your Answer
                </span>
                <span className="text-[10px] text-warm-400 font-sans">
                  {formatTimeAgo(myAnswer.created_at)}
                </span>
              </div>
              <p className="font-sans text-sm text-warm-800 leading-relaxed">
                "{myAnswer.answer_text}"
              </p>
            </div>

            {/* Partner's Answer Box (Revealed vs Locked) */}
            {areBothAnswersRevealed && partnerAnswer ? (
              <div className="bg-blush-50/70 rounded-2xl p-4 border border-blush-200 shadow-2xs animate-fade-in">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold text-blush-800 uppercase tracking-wider flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5 text-blush-500" />
                    {partnerProfile?.nickname || "His"} Answer
                  </span>
                  <span className="text-[10px] text-warm-400 font-sans">
                    {formatTimeAgo(partnerAnswer.created_at)}
                  </span>
                </div>
                <p className="font-sans text-sm text-warm-900 leading-relaxed">
                  "{partnerAnswer.answer_text}"
                </p>
              </div>
            ) : (
              <div className="relative rounded-2xl p-6 bg-warm-100/60 border border-warm-200 text-center overflow-hidden">
                <div className="flex flex-col items-center justify-center space-y-2">
                  <div className="w-10 h-10 rounded-full bg-warm-200/80 flex items-center justify-center text-warm-500">
                    <Lock className="w-5 h-5" />
                  </div>
                  <h4 className="font-serif text-sm font-medium text-warm-800">
                    {partnerProfile?.nickname || "His"} answer is locked
                  </h4>
                  <p className="text-xs text-warm-500 max-w-xs">
                    Once he submits his response, both answers will unlock simultaneously!
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Question Archive / Previous Days */}
      <div className="bg-white rounded-3xl p-5 shadow-soft border border-warm-200/70 space-y-3">
        <div className="flex items-center gap-2 pb-2 border-b border-warm-100">
          <History className="w-4 h-4 text-warm-400" />
          <h3 className="font-serif text-base font-medium text-warm-900">
            Previous Answers Archive
          </h3>
        </div>

        {allAnswersHistory.length === 0 ? (
          <p className="text-xs text-warm-400 italic">No past answers archived yet.</p>
        ) : (
          <div className="space-y-3 divide-y divide-warm-100">
            {allAnswersHistory.slice(0, 5).map((ans) => (
              <div key={ans.id} className="pt-3 text-xs space-y-1">
                <div className="flex items-center justify-between text-warm-400 text-[11px]">
                  <span>{ans.answered_date}</span>
                  <span>{ans.user_id === profile?.id ? 'You' : partnerProfile?.nickname || 'Him'}</span>
                </div>
                <p className="text-warm-700 italic font-sans leading-relaxed">
                  "{ans.answer_text}"
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
