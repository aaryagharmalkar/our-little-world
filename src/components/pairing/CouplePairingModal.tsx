import React, { useState, useEffect, useRef } from 'react'
import QRCode from 'qrcode'
import {
  X,
  Copy,
  Check,
  ArrowRight,
  ShieldCheck,
  Share2,
  Heart,
  QrCode,
  UserCheck,
  Lock,
  Mail,
  User,
} from 'lucide-react'
import { useCouple } from '../../context/CoupleContext'
import { useAuth } from '../../context/AuthContext'

interface Props {
  isOpen: boolean
  onClose: () => void
}

export const CouplePairingModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { user, profile, partnerProfile, signup, login, refreshSpace } = useAuth()
  const { generateInviteCode, joinCoupleSpace } = useCouple()

  const [activeTab, setActiveTab] = useState<'invite' | 'join'>('invite')
  const [inviteCode, setInviteCode] = useState<string>('LOVE-US-2026')
  const [joinInputCode, setJoinInputCode] = useState('')
  const [copiedLink, setCopiedLink] = useState(false)
  const [copiedCode, setCopiedCode] = useState(false)
  const [isJoining, setIsJoining] = useState(false)
  const [showQr, setShowQr] = useState(false)
  const [joinMsg, setJoinMsg] = useState<{ text: string; isError?: boolean } | null>(null)

  // Auth fields for partner joining without an existing account
  const [partnerName, setPartnerName] = useState('')
  const [partnerEmail, setPartnerEmail] = useState('')
  const [partnerPassword, setPartnerPassword] = useState('')

  const canvasRef = useRef<HTMLCanvasElement>(null)

  const baseUrl = import.meta.env.VITE_APP_URL || window.location.origin
  const activeCode = inviteCode || 'LOVE-US-2026'
  const inviteUrl = `${baseUrl}/?invite=${activeCode}`

  // Detect URL parameter ?invite=... on load
  useEffect(() => {
    if (isOpen) {
      const params = new URLSearchParams(window.location.search)
      const paramCode = params.get('invite')
      if (paramCode) {
        setJoinInputCode(paramCode.toUpperCase())
        setActiveTab('join')
      }
    }
  }, [isOpen])

  // Fetch or reuse active invite code
  useEffect(() => {
    if (isOpen && user) {
      generateInviteCode().then((code) => {
        if (code) setInviteCode(code)
      })
    }
  }, [isOpen, user, generateInviteCode])

  // Render QR Code
  useEffect(() => {
    if (inviteUrl && canvasRef.current && showQr) {
      QRCode.toCanvas(canvasRef.current, inviteUrl, {
        width: 170,
        margin: 2,
        color: {
          dark: '#B55A55',
          light: '#FCFAF7',
        },
      })
    }
  }, [inviteUrl, showQr])

  if (!isOpen) return null

  // Native iOS Share Sheet (WhatsApp, iMessage, AirDrop)
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Our Little World ♡',
          text: `Join me in our private couple space on Our Little World ♡`,
          url: inviteUrl,
        })
      } catch {
        // User cancelled share
      }
    } else {
      handleCopyLink()
    }
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteUrl)
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2000)
  }

  const handleCopyCode = () => {
    navigator.clipboard.writeText(activeCode)
    setCopiedCode(true)
    setTimeout(() => setCopiedCode(false), 2000)
  }

  const handleJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const targetCode = joinInputCode.trim() || activeCode
    if (!targetCode) return

    setIsJoining(true)
    setJoinMsg(null)

    try {
      // If not authenticated yet, create partner account seamlessly first
      if (!user) {
        if (!partnerEmail.trim() || !partnerPassword.trim()) {
          setJoinMsg({ text: 'Please enter your email and password to connect.', isError: true })
          setIsJoining(false)
          return
        }

        const signupRes = await signup(
          partnerEmail.trim(),
          partnerPassword.trim(),
          partnerName.trim() || 'Partner',
          partnerName.trim() || 'Partner'
        )

        if (signupRes.error) {
          // If already registered, attempt login
          const loginRes = await login(partnerEmail.trim(), partnerPassword.trim())
          if (loginRes.error) {
            setJoinMsg({ text: signupRes.error, isError: true })
            setIsJoining(false)
            return
          }
        } else {
          // Log in newly created user
          await login(partnerEmail.trim(), partnerPassword.trim())
        }
      }

      // Redeem invitation
      const res = await joinCoupleSpace(targetCode)
      if (res.success) {
        setJoinMsg({ text: 'Welcome to Our Little World! ♡ Connected successfully.' })
        await refreshSpace()
        setTimeout(() => {
          onClose()
        }, 1500)
      } else {
        setJoinMsg({ text: res.error || 'Failed to join space. Please check the code.', isError: true })
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Connection failed'
      setJoinMsg({ text: msg, isError: true })
    } finally {
      setIsJoining(false)
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

        {/* Pairing Status Header */}
        <div className="mt-4 p-3.5 rounded-2xl bg-cream-50 border border-warm-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blush-100 flex items-center justify-center text-blush-600">
              <Heart className={`w-5 h-5 fill-blush-500 ${partnerProfile ? '' : 'animate-pulse'}`} />
            </div>
            <div>
              <p className="text-xs font-semibold text-warm-900">
                {profile?.nickname || 'You'} & {partnerProfile?.nickname || 'Partner'}
              </p>
              <p className="text-[11px] text-warm-500">
                {partnerProfile ? 'Connected & Synced' : 'Waiting for partner to join'}
              </p>
            </div>
          </div>
          <span
            className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border ${
              partnerProfile
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}
          >
            {partnerProfile ? '● Paired' : '● In Progress'}
          </span>
        </div>

        {/* Tab Toggle */}
        <div className="flex bg-warm-100 p-1 rounded-2xl border border-warm-200/70 mt-4 mb-4">
          <button
            onClick={() => setActiveTab('invite')}
            className={`flex-1 py-2 text-xs font-sans font-medium rounded-xl transition-all ${
              activeTab === 'invite'
                ? 'bg-white text-warm-900 shadow-soft'
                : 'text-warm-500 hover:text-warm-800'
            }`}
          >
            Share Invite Link
          </button>
          <button
            onClick={() => setActiveTab('join')}
            className={`flex-1 py-2 text-xs font-sans font-medium rounded-xl transition-all ${
              activeTab === 'join'
                ? 'bg-white text-warm-900 shadow-soft'
                : 'text-warm-500 hover:text-warm-800'
            }`}
          >
            Enter a Code
          </button>
        </div>

        {/* TAB 1: SHARE INVITE LINK */}
        {activeTab === 'invite' && (
          <div className="space-y-4">
            {/* Primary Action: 1-Tap Share Button */}
            <button
              onClick={handleShare}
              className="w-full py-3.5 px-5 rounded-2xl bg-blush-500 hover:bg-blush-600 text-white font-sans text-sm font-medium shadow-romantic flex items-center justify-center gap-2 transition-all active:scale-98"
            >
              <Share2 className="w-4 h-4" />
              <span>Send Invite (WhatsApp / Messages)</span>
            </button>

            {/* Clean Pairing Code Box */}
            <div className="bg-sand-50 rounded-2xl p-4 border border-sand-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-warm-500">
                  Your Couple Pairing Code:
                </span>
                <span className="text-[10px] text-emerald-600 font-medium">Valid for your space</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <code className="text-base font-mono font-bold tracking-widest text-blush-700 bg-white px-3 py-1.5 rounded-xl border border-blush-200 flex-1 text-center">
                  {activeCode}
                </code>
                <button
                  onClick={handleCopyCode}
                  className="p-2 rounded-xl bg-white border border-warm-200 text-warm-700 text-xs font-medium flex items-center gap-1 hover:bg-blush-50 transition-colors"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCode ? 'Copied' : 'Copy'}</span>
                </button>
                <button
                  onClick={handleCopyLink}
                  className="p-2 rounded-xl bg-white border border-warm-200 text-warm-700 text-xs font-medium flex items-center gap-1 hover:bg-blush-50 transition-colors"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? 'Link Copied' : 'Copy Link'}</span>
                </button>
              </div>
              <p className="text-[11px] text-warm-500 leading-relaxed pt-1">
                When your partner opens your link on his phone, he connects automatically with zero technical steps!
              </p>
            </div>

            {/* Optional Birthday QR Code Toggle */}
            <div className="text-center pt-1">
              <button
                onClick={() => setShowQr(!showQr)}
                className="text-xs text-blush-600 hover:text-blush-700 font-medium inline-flex items-center gap-1.5 transition-colors"
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>{showQr ? 'Hide QR Code' : 'Show Birthday Surprise QR Code'}</span>
              </button>

              {showQr && (
                <div className="mt-3 p-4 bg-cream-50 rounded-2xl border border-blush-200/70 flex flex-col items-center animate-fade-in">
                  <div className="p-2 bg-white rounded-xl shadow-soft border border-blush-100 mb-2">
                    <canvas ref={canvasRef} className="rounded-lg" />
                  </div>
                  <p className="text-[11px] text-warm-500 max-w-xs">
                    He can point his iPhone Camera at this code to join instantly.
                  </p>
                </div>
              )}
            </div>

            {/* Security Guarantee */}
            <div className="flex items-center gap-2 text-[11px] text-warm-500 bg-sand-50/70 p-2.5 rounded-2xl border border-sand-200/80">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                Maximum 2 members strictly enforced by database rules. No third parties can ever access your space.
              </span>
            </div>
          </div>
        )}

        {/* TAB 2: ENTER A CODE TO JOIN */}
        {activeTab === 'join' && (
          <form onSubmit={handleJoinSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-warm-600 uppercase tracking-wider mb-1.5">
                Pairing Code
              </label>
              <input
                type="text"
                value={joinInputCode}
                onChange={(e) => setJoinInputCode(e.target.value.toUpperCase())}
                placeholder="e.g. LOVE-US-2026"
                className="w-full px-4 py-3 rounded-2xl bg-cream-50 border border-warm-200 text-center font-mono font-bold text-lg tracking-widest text-warm-900 focus:outline-none focus:ring-2 focus:ring-blush-300 uppercase"
              />
            </div>

            {/* If user is not yet logged in on this device */}
            {!user && (
              <div className="p-4 bg-cream-50 rounded-2xl border border-warm-200 space-y-3">
                <p className="text-xs font-semibold text-warm-800 flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-blush-600" />
                  <span>Create Your Partner Profile (1-Step)</span>
                </p>

                <div>
                  <label className="block text-[11px] text-warm-500 mb-1">Your Name or Nickname</label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 w-4 h-4 text-warm-400" />
                    <input
                      type="text"
                      required
                      value={partnerName}
                      onChange={(e) => setPartnerName(e.target.value)}
                      placeholder="e.g. Abhi"
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-white border border-warm-200 focus:outline-none focus:ring-2 focus:ring-blush-300"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] text-warm-500 mb-1">Your Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 w-4 h-4 text-warm-400" />
                    <input
                      type="email"
                      required
                      value={partnerEmail}
                      onChange={(e) => setPartnerEmail(e.target.value)}
                      placeholder="partner@example.com"
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-white border border-warm-200 focus:outline-none focus:ring-2 focus:ring-blush-300"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] text-warm-500 mb-1">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 w-4 h-4 text-warm-400" />
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={partnerPassword}
                      onChange={(e) => setPartnerPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-white border border-warm-200 focus:outline-none focus:ring-2 focus:ring-blush-300"
                    />
                  </div>
                </div>
              </div>
            )}

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
              disabled={(!joinInputCode.trim() && !activeCode) || isJoining}
              className={`w-full py-3.5 px-6 rounded-2xl text-white font-sans text-sm font-medium transition-all shadow-soft flex items-center justify-center gap-2 ${
                isJoining
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
