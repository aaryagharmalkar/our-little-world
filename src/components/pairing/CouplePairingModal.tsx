import React, { useState, useEffect, useRef } from 'react'
import QRCode from 'qrcode'
import { X, Sparkles, Copy, Check, ArrowRight, ShieldCheck } from 'lucide-react'
import { useCouple } from '../../context/CoupleContext'

interface Props {
  isOpen: boolean
  onClose: () => void
}

export const CouplePairingModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { generateInviteCode, joinCoupleSpace } = useCouple()

  const [activeTab, setActiveTab] = useState<'invite' | 'join'>('invite')
  const [inviteCode, setInviteCode] = useState<string>('')
  const [joinInputCode, setJoinInputCode] = useState('')
  const [copiedLink, setCopiedLink] = useState(false)
  const [copiedCode, setCopiedCode] = useState(false)
  const [isJoining, setIsJoining] = useState(false)
  const [joinMsg, setJoinMsg] = useState<{ text: string; isError?: boolean } | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const baseUrl = import.meta.env.VITE_APP_URL || window.location.origin
  const inviteUrl = inviteCode ? `${baseUrl}/?invite=${inviteCode}` : ''

  useEffect(() => {
    if (isOpen && !inviteCode) {
      generateInviteCode().then((code) => {
        if (code) setInviteCode(code)
      })
    }
  }, [isOpen, inviteCode, generateInviteCode])

  useEffect(() => {
    if (inviteUrl && canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, inviteUrl, {
        width: 180,
        margin: 2,
        color: {
          dark: '#B55A55',
          light: '#FCFAF7',
        },
      })
    }
  }, [inviteUrl])

  if (!isOpen) return null

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteUrl)
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2000)
  }

  const handleCopyCode = () => {
    navigator.clipboard.writeText(inviteCode)
    setCopiedCode(true)
    setTimeout(() => setCopiedCode(false), 2000)
  }

  const handleJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!joinInputCode.trim()) return

    setIsJoining(true)
    setJoinMsg(null)
    const res = await joinCoupleSpace(joinInputCode)
    setIsJoining(false)

    if (res.success) {
      setJoinMsg({ text: 'Welcome to Our Little World! ♡' })
      setTimeout(() => {
        onClose()
      }, 1500)
    } else {
      setJoinMsg({ text: res.error || 'Failed to join space', isError: true })
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-warm-900/40 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-white rounded-3xl p-6 shadow-float border border-warm-200/80 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-warm-100">
          <div>
            <h3 className="font-serif text-xl font-medium text-warm-900 flex items-center gap-1.5">
              <span>Couple Space & Pairing</span>
              <span className="text-blush-500 font-sans text-sm">♡</span>
            </h3>
            <p className="text-xs text-warm-500">Private pairing exclusively for the two of you</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-warm-400 hover:text-warm-700 rounded-full hover:bg-warm-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Toggle */}
        <div className="flex bg-warm-100 p-1 rounded-2xl border border-warm-200/70 mt-4 mb-4">
          <button
            onClick={() => setActiveTab('invite')}
            className={`flex-1 py-1.5 text-xs font-sans font-medium rounded-xl transition-all ${
              activeTab === 'invite'
                ? 'bg-white text-warm-900 shadow-soft'
                : 'text-warm-500 hover:text-warm-800'
            }`}
          >
            Birthday Surprise QR
          </button>
          <button
            onClick={() => setActiveTab('join')}
            className={`flex-1 py-1.5 text-xs font-sans font-medium rounded-xl transition-all ${
              activeTab === 'join'
                ? 'bg-white text-warm-900 shadow-soft'
                : 'text-warm-500 hover:text-warm-800'
            }`}
          >
            Join with Code
          </button>
        </div>

        {/* INVITE / BIRTHDAY SURPRISE QR TAB */}
        {activeTab === 'invite' && (
          <div className="space-y-4 text-center">
            <div className="bg-gradient-to-b from-cream-50 to-blush-50/60 rounded-3xl p-5 border border-blush-200/80 flex flex-col items-center">
              <span className="text-xs font-semibold uppercase tracking-widest text-blush-600 mb-2 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Birthday Surprise Flow</span>
              </span>

              {/* QR Code Canvas */}
              <div className="p-3 bg-white rounded-2xl shadow-soft border border-blush-100 mb-3">
                <canvas ref={canvasRef} className="rounded-lg" />
              </div>

              <p className="font-serif text-sm font-medium text-warm-900">
                Scan with iPhone Camera to Open
              </p>
              <p className="text-[11px] text-warm-500 max-w-xs mt-0.5">
                Hand this QR code to him on his birthday. When he opens it, he will seamlessly join your private world.
              </p>
            </div>

            {/* Invite Pairing Code */}
            <div className="bg-cream-50 rounded-2xl p-3 border border-warm-200 text-left">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-warm-500">
                  Single-Use Pairing Code:
                </span>
                <span className="text-[10px] text-emerald-600 font-medium">Valid for 30 days</span>
              </div>
              <div className="flex items-center justify-between">
                <code className="text-sm font-mono font-bold tracking-wider text-blush-700">
                  {inviteCode || 'GENERATING...'}
                </code>
                <div className="flex gap-1.5">
                  <button
                    onClick={handleCopyCode}
                    className="p-1.5 rounded-lg bg-white border border-warm-200 text-warm-600 text-xs flex items-center gap-1 hover:bg-blush-50"
                  >
                    {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedCode ? 'Copied' : 'Code'}</span>
                  </button>
                  <button
                    onClick={handleCopyLink}
                    className="p-1.5 rounded-lg bg-white border border-warm-200 text-warm-600 text-xs flex items-center gap-1 hover:bg-blush-50"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedLink ? 'Copied' : 'Link'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Security Guarantee */}
            <div className="flex items-center gap-2 text-[11px] text-warm-500 bg-sand-50 p-2.5 rounded-2xl border border-sand-200 text-left">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                Maximum 2 members strictly enforced by database rules. No third parties can ever view your photos or memories.
              </span>
            </div>
          </div>
        )}

        {/* JOIN SPACE TAB */}
        {activeTab === 'join' && (
          <form onSubmit={handleJoinSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-warm-600 uppercase tracking-wider mb-1.5">
                Enter 8-Character Pairing Code
              </label>
              <input
                type="text"
                value={joinInputCode}
                onChange={(e) => setJoinInputCode(e.target.value.toUpperCase())}
                placeholder="e.g. 7K2M9X4P"
                maxLength={10}
                className="w-full px-4 py-3 rounded-2xl bg-cream-50 border border-warm-200 text-center font-mono font-bold text-lg tracking-widest text-warm-900 focus:outline-none focus:ring-2 focus:ring-blush-300"
              />
            </div>

            {joinMsg && (
              <div
                className={`p-3 rounded-2xl text-xs flex items-center gap-2 ${
                  joinMsg.isError
                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                }`}
              >
                {joinMsg.isError ? <X className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                <span>{joinMsg.text}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={!joinInputCode.trim() || isJoining}
              className={`w-full py-3.5 px-6 rounded-2xl text-white font-sans text-sm font-medium transition-all shadow-soft flex items-center justify-center gap-2 ${
                !joinInputCode.trim() || isJoining
                  ? 'bg-warm-200 text-warm-400 cursor-not-allowed'
                  : 'bg-blush-500 hover:bg-blush-600 shadow-romantic active:scale-98'
              }`}
            >
              {isJoining ? (
                <span>Connecting to your love...</span>
              ) : (
                <>
                  <span>Join Our Little World</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
