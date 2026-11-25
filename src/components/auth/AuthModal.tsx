import React, { useState } from 'react'
import { X, Lock, Mail, User, Heart, LogOut, ShieldAlert } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

interface Props {
  isOpen: boolean
  onClose: () => void
}

export const AuthModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { user, profile, isConfigured, login, signup, logout } = useAuth()
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [nickname, setNickname] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')
    setIsLoading(true)

    if (mode === 'signin') {
      const res = await login(email, password)
      setIsLoading(false)
      if (res.error) {
        setErrorMsg(res.error)
      } else {
        onClose()
      }
    } else {
      const res = await signup(email, password, fullName, nickname)
      if (res.error) {
        setIsLoading(false)
        setErrorMsg(res.error)
      } else {
        // Seamless instant login after signup
        await login(email, password)
        setIsLoading(false)
        onClose()
      }
    }
  }

  const handleLogout = async () => {
    await logout()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-warm-900/40 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-sm bg-white rounded-3xl p-6 shadow-float border border-warm-200/80">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-warm-100">
          <div>
            <h3 className="font-serif text-xl font-medium text-warm-900 flex items-center gap-1.5">
              <span>{user ? 'Account & Profile' : mode === 'signin' ? 'Welcome Home' : 'Create Space'}</span>
              <span className="text-blush-500 font-sans text-sm">♡</span>
            </h3>
            <p className="text-xs text-warm-500">
              {user ? `Signed in as ${profile?.nickname || user.email}` : 'Private access to our little world'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-warm-400 hover:text-warm-700 rounded-full hover:bg-warm-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* If already signed in */}
        {user ? (
          <div className="py-4 space-y-4">
            <div className="bg-cream-50 rounded-2xl p-4 border border-warm-200 space-y-1">
              <p className="text-xs text-warm-400 uppercase tracking-wider font-semibold">Profile</p>
              <p className="font-serif text-lg text-warm-900">{profile?.full_name || 'Partner'}</p>
              <p className="text-xs text-warm-600">Nickname: <strong>{profile?.nickname || 'Love'}</strong></p>
              <p className="text-xs text-warm-400">{user.email}</p>
            </div>

            <button
              onClick={handleLogout}
              className="w-full py-3 px-4 rounded-2xl bg-warm-100 hover:bg-rose-50 text-warm-700 hover:text-rose-600 border border-warm-200 text-xs font-medium flex items-center justify-center gap-2 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Log Out</span>
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
            {!isConfigured && (
              <div className="flex items-center gap-2 text-[11px] text-amber-800 bg-amber-50 p-2.5 rounded-2xl border border-amber-200">
                <ShieldAlert className="w-4 h-4 shrink-0 text-amber-600" />
                <span>Running in local Demo Mode. Add Supabase keys to .env for production auth.</span>
              </div>
            )}

            {mode === 'signup' && (
              <>
                <div>
                  <label className="block text-[11px] font-semibold text-warm-600 uppercase tracking-wider mb-1">
                    Full Name
                  </label>
                  <div className="flex items-center bg-cream-50 rounded-xl px-3 py-2 border border-warm-200">
                    <User className="w-4 h-4 text-warm-400 mr-2" />
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Aarya"
                      required
                      className="bg-transparent text-sm w-full outline-none text-warm-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-warm-600 uppercase tracking-wider mb-1">
                    Couple Nickname
                  </label>
                  <div className="flex items-center bg-cream-50 rounded-xl px-3 py-2 border border-warm-200">
                    <Heart className="w-4 h-4 text-blush-400 mr-2" />
                    <input
                      type="text"
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      placeholder="e.g. Me ♡"
                      required
                      className="bg-transparent text-sm w-full outline-none text-warm-900"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-[11px] font-semibold text-warm-600 uppercase tracking-wider mb-1">
                Email Address
              </label>
              <div className="flex items-center bg-cream-50 rounded-xl px-3 py-2 border border-warm-200">
                <Mail className="w-4 h-4 text-warm-400 mr-2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="love@ourlittleworld.app"
                  required
                  className="bg-transparent text-sm w-full outline-none text-warm-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-warm-600 uppercase tracking-wider mb-1">
                Password
              </label>
              <div className="flex items-center bg-cream-50 rounded-xl px-3 py-2 border border-warm-200">
                <Lock className="w-4 h-4 text-warm-400 mr-2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="bg-transparent text-sm w-full outline-none text-warm-900"
                />
              </div>
            </div>

            {errorMsg && (
              <p className="text-xs text-rose-600 bg-rose-50 p-2.5 rounded-xl border border-rose-200">
                {errorMsg}
              </p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-2xl bg-blush-500 hover:bg-blush-600 text-white text-sm font-medium shadow-romantic active:scale-98 transition-all"
            >
              {isLoading ? 'Processing...' : mode === 'signin' ? 'Sign In ♡' : 'Create Account ♡'}
            </button>

            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
                className="text-xs text-blush-600 hover:text-blush-700 font-medium"
              >
                {mode === 'signin' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
