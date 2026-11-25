import React, { useState } from 'react'
import { Smartphone, Copy, Check, Sparkles, Heart, Code, Zap } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useCouple } from '../../context/CoupleContext'
import { formatDistance } from '../../lib/geo'
import { generateFullWidgetScript } from '../../lib/widgetScriptTemplate'

export const WidgetPreviewTab: React.FC = () => {
  const { coupleSpace, profile, partnerProfile } = useAuth()
  const { currentHourlyPhoto, myMood, partnerMood, distanceKm, distanceTrend, messages, daysTogether, dailyQuestion } = useCouple()

  const [size, setSize] = useState<'small' | 'medium' | 'large'>('medium')
  const [copiedCode, setCopiedCode] = useState(false)
  const [copiedToken, setCopiedToken] = useState(false)

  const latestMsg = messages.length > 0 ? messages[messages.length - 1] : null
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co'
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
  const widgetToken =
    coupleSpace?.widget_access_token ||
    (coupleSpace?.id ? localStorage.getItem(`widget_token_${coupleSpace.id}`) : null) ||
    'olw_demo_token_8899aabbcc'
  const appUrl = import.meta.env.VITE_APP_URL || window.location.origin

  const fullScriptCode = generateFullWidgetScript({
    supabaseUrl,
    supabaseAnonKey: supabaseKey,
    widgetToken,
    appBaseUrl: appUrl,
  })

  const handleCopyCode = () => {
    navigator.clipboard.writeText(fullScriptCode)
    setCopiedCode(true)
    setTimeout(() => setCopiedCode(false), 2000)
  }

  const handleCopyToken = () => {
    navigator.clipboard.writeText(widgetToken)
    setCopiedToken(true)
    setTimeout(() => setCopiedToken(false), 2000)
  }

  return (
    <div className="space-y-6 pb-24 max-w-xl mx-auto px-4 pt-2">
      {/* Title */}
      <div>
        <h2 className="font-serif text-2xl font-medium text-warm-900 flex items-center gap-1.5">
          <span>Scriptable iPhone Widget</span>
          <span className="text-blush-500 font-sans text-lg">♡</span>
        </h2>
        <p className="text-xs text-warm-500 mt-0.5">
          Realtime preview of your personalized iOS home screen widget
        </p>
      </div>

      {/* Size Picker */}
      <div className="flex bg-warm-200/60 p-1 rounded-2xl border border-warm-200">
        {(['small', 'medium', 'large'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setSize(s)}
            className={`flex-1 py-1.5 text-xs font-sans font-medium rounded-xl capitalize transition-all ${
              size === s
                ? 'bg-white text-warm-900 shadow-soft'
                : 'text-warm-500 hover:text-warm-800'
            }`}
          >
            {s} Widget
          </button>
        ))}
      </div>

      {/* Realistic iOS Widget Frame Preview */}
      <div className="flex items-center justify-center p-4 bg-gradient-to-b from-warm-100 to-sand-100 rounded-3xl border border-warm-200/80 shadow-inner-soft">
        {/* SMALL WIDGET PREVIEW */}
        {size === 'small' && (
          <div className="w-[160px] h-[160px] bg-cream-50 rounded-[2.2rem] p-3 shadow-float border border-warm-200 flex flex-col justify-between select-none">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-bold text-blush-600 font-serif">Us ♡</span>
              <span className="font-bold text-emerald-600 font-sans">
                {distanceKm !== null ? `${formatDistance(distanceKm)}` : '♡'}
              </span>
            </div>

            <div className="w-full h-[74px] rounded-2xl overflow-hidden bg-warm-200 border border-warm-300/40">
              {currentHourlyPhoto ? (
                <img src={currentHourlyPhoto.signed_url || currentHourlyPhoto.public_url} alt="Widget" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs text-warm-400">Photo</div>
              )}
            </div>

            <div className="bg-white/90 rounded-xl px-2 py-1 flex items-center justify-between text-xs border border-blush-100 shadow-2xs">
              <span>{myMood?.emoji || '🥰'}</span>
              <span className="text-blush-400 text-[10px]">♡</span>
              <span>{partnerMood?.emoji || '😴'}</span>
            </div>
          </div>
        )}

        {/* MEDIUM WIDGET PREVIEW */}
        {size === 'medium' && (
          <div className="w-[330px] h-[160px] bg-cream-50 rounded-[2.2rem] p-3.5 shadow-float border border-warm-200 flex items-center gap-3 select-none">
            {/* Left Photo */}
            <div className="w-[130px] h-[132px] rounded-2xl overflow-hidden bg-warm-200 border border-warm-300/50 shrink-0">
              {currentHourlyPhoto ? (
                <img src={currentHourlyPhoto.signed_url || currentHourlyPhoto.public_url} alt="Widget" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs text-warm-400">Memory</div>
              )}
            </div>

            {/* Right Information */}
            <div className="flex-1 flex flex-col justify-between h-[132px] py-0.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-blush-600 font-serif">Our Little World</span>
                <Heart className="w-3 h-3 text-blush-500 fill-blush-500" />
              </div>

              <div>
                <p className="font-sans font-bold text-sm text-warm-900 leading-tight">
                  {distanceKm !== null ? `${formatDistance(distanceKm)} apart` : 'Connected in Heart'}
                </p>
                {distanceTrend === 'getting_closer' && (
                  <span className="text-[9px] text-emerald-600 font-bold">● Getting closer</span>
                )}
              </div>

              {/* Mood Pill */}
              <div className="bg-white/90 rounded-xl px-2.5 py-1 text-[10px] text-warm-800 border border-warm-200/60 shadow-2xs flex items-center gap-1.5">
                <span>{myMood?.emoji || '🥰'} {profile?.nickname || 'You'}</span>
                <span className="text-blush-400 font-bold">♡</span>
                <span>{partnerMood?.emoji || '😴'} {partnerProfile?.nickname || 'Him'}</span>
              </div>

              {/* Latest Message Note */}
              <div className="bg-blush-100/70 rounded-xl px-2.5 py-1 text-[10px] text-blush-800 italic line-clamp-1 border border-blush-200/60 font-sans">
                "{latestMsg ? latestMsg.content : 'Missing you so much ♡'}"
              </div>
            </div>
          </div>
        )}

        {/* LARGE WIDGET PREVIEW */}
        {size === 'large' && (
          <div className="w-[330px] h-[330px] bg-cream-50 rounded-[2.5rem] p-4 shadow-float border border-warm-200 flex flex-col justify-between select-none">
            {/* Top Photo */}
            <div className="w-full h-[140px] rounded-2xl overflow-hidden bg-warm-200 border border-warm-300/50">
              {currentHourlyPhoto ? (
                <img src={currentHourlyPhoto.signed_url || currentHourlyPhoto.public_url} alt="Widget" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs text-warm-400">Photo</div>
              )}
            </div>

            {/* Distance & Days Together */}
            <div className="flex items-center justify-between">
              <div>
                <span className="font-bold text-base text-warm-900 font-sans block">
                  {distanceKm !== null ? `${formatDistance(distanceKm)} apart` : 'Distance Paused'}
                </span>
                <span className="text-[10px] text-emerald-600 font-bold">● Getting closer</span>
              </div>
              <span className="text-xs text-blush-600 font-serif font-medium">
                {daysTogether} days together ♡
              </span>
            </div>

            {/* Mood Card */}
            <div className="bg-white/90 rounded-2xl p-2.5 border border-warm-200/70 flex items-center justify-between text-xs">
              <span>{myMood?.emoji || '🥰'} {myMood?.mood_label || 'Happy'}</span>
              <span className="text-blush-500 font-bold">♡</span>
              <span>{partnerMood?.emoji || '😴'} {partnerMood?.mood_label || 'Resting'}</span>
            </div>

            {/* Message or Question Teaser */}
            <div className="bg-blush-100/70 rounded-2xl p-3 border border-blush-200/70 text-xs">
              <span className="text-[10px] font-bold text-blush-700 uppercase tracking-wider block mb-1">
                Question of the Day:
              </span>
              <p className="text-warm-800 line-clamp-2 italic">
                "{dailyQuestion?.question_text || 'What is your favorite memory of us together?'}"
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Widget Token & Configuration */}
      <div className="bg-white rounded-3xl p-5 shadow-soft border border-warm-200/70 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-warm-100">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blush-500" />
            <h3 className="font-serif text-base font-medium text-warm-900">
              Couple Widget Token
            </h3>
          </div>
          <span className="text-[11px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            Securely Bound
          </span>
        </div>

        <p className="text-xs text-warm-500 leading-relaxed font-sans">
          This token allows your Scriptable widgets to securely fetch the latest photo, mood, and distance without exposing your master account password:
        </p>

        <div className="flex items-center gap-2 bg-cream-50 p-2.5 rounded-2xl border border-warm-200">
          <code className="text-xs font-mono text-warm-800 flex-1 truncate">
            {widgetToken}
          </code>
          <button
            onClick={handleCopyToken}
            className="p-2 rounded-xl bg-white hover:bg-blush-50 text-warm-700 border border-warm-200 text-xs flex items-center gap-1 transition-colors"
          >
            {copiedToken ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedToken ? 'Copied' : 'Copy Token'}</span>
          </button>
          <button
            onClick={handleCopyCode}
            className="p-2 rounded-xl bg-blush-50 hover:bg-blush-100 text-blush-700 border border-blush-200 text-xs flex items-center gap-1 transition-colors font-medium"
          >
            {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Code className="w-3.5 h-3.5" />}
            <span>{copiedCode ? 'Full Script Copied!' : 'Copy Full Script'}</span>
          </button>
        </div>
      </div>

      {/* Production-Ready Behavior Card */}
      <div className="bg-white rounded-3xl p-5 shadow-soft border border-warm-200/70 space-y-3 font-sans">
        <div className="flex items-center gap-2 pb-2 border-b border-warm-100">
          <Zap className="w-4 h-4 text-emerald-600" />
          <h3 className="font-serif text-base font-medium text-warm-900">
            How Automatic Updates Work (Zero-Touch)
          </h3>
        </div>

        <p className="text-xs text-warm-600 leading-relaxed">
          <strong>1. 100% Background Automatic:</strong> Once added to your Home Screen, Apple's iOS WidgetKit automatically executes the script headlessly every ~15 minutes. You <em>never</em> need to open Scriptable or click Play.
        </p>

        <p className="text-xs text-warm-600 leading-relaxed">
          <strong>2. Instant 1-Second Turbo (Optional):</strong> If you want the widget to update the exact millisecond you close the app after updating your mood:
        </p>
        <div className="bg-sand-50 p-3 rounded-2xl border border-sand-200 text-[11px] text-warm-700 space-y-1">
          <p>• Open Apple's <strong>Shortcuts</strong> app ➔ tap <strong>Automation</strong> tab ➔ <strong>+</strong></p>
          <p>• Select <strong>App</strong> ➔ choose <strong>"Our World"</strong> ➔ check <strong>Is Closed</strong> ➔ <strong>Run Immediately</strong></p>
          <p>• Action: <strong>Scriptable ➔ Run Script</strong> ➔ select <strong>"Our Little World"</strong> ➔ turn <strong>Run in Background ON</strong></p>
        </div>
      </div>

      {/* Step-by-Step Installation Guide for iPhone 14 & 15 */}
      <div className="bg-sand-50 rounded-3xl p-5 border border-sand-200/70 space-y-3 font-sans">
        <h4 className="font-serif text-base font-medium text-warm-900 flex items-center gap-1.5">
          <Smartphone className="w-4 h-4 text-blush-500" />
          <span>Quick 2-Minute iPhone Setup Guide</span>
        </h4>

        <ol className="text-xs text-warm-700 space-y-2.5 list-decimal list-inside leading-relaxed">
          <li>
            Install the free <strong>Scriptable</strong> app from the iOS App Store.
          </li>
          <li>
            Tap <strong>Copy Full Script</strong> above (it already has your unique tokens pre-configured!).
          </li>
          <li>
            Open Scriptable, tap <strong>+</strong>, paste the script, and tap the title at top to name it <strong>Our Little World</strong>. Tap Done.
          </li>
          <li>
            Go to your iPhone Home Screen, long-press empty space until icons jiggle, tap <strong>+</strong> at the top left, search for <strong>Scriptable</strong>, and add the <strong>Medium</strong> widget.
          </li>
          <li>
            Long-press the widget on your home screen, tap <strong>Edit Widget</strong>, choose <strong>Our Little World</strong> as the script, and you are done! It now updates seamlessly on its own.
          </li>
        </ol>
      </div>
    </div>
  )
}
