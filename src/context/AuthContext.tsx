import React, { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { Profile, CoupleSpace } from '../types/database'
import { DEMO_USER_ME, DEMO_USER_PARTNER, DEMO_COUPLE_SPACE } from '../lib/demoData'

interface AuthContextType {
  user: User | null
  profile: Profile | null
  coupleSpace: CoupleSpace | null
  partnerProfile: Profile | null
  isDemoMode: boolean
  isConfigured: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<{ error?: string }>
  signup: (email: string, password: string, fullName: string, nickname: string) => Promise<{ error?: string }>
  logout: () => Promise<void>
  switchDemoUser: (userType: 'me' | 'partner') => void
  refreshSpace: () => Promise<void>
  setCoupleSpace: (space: CoupleSpace | null) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isConfigured = isSupabaseConfigured()
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [partnerProfile, setPartnerProfile] = useState<Profile | null>(null)
  const [coupleSpace, setCoupleSpace] = useState<CoupleSpace | null>(null)
  const [isDemoMode, setIsDemoMode] = useState<boolean>(!isConfigured)
  const [isLoading, setIsLoading] = useState<boolean>(true)

  // Demo user toggle for easy testing on Windows 11
  const switchDemoUser = (userType: 'me' | 'partner') => {
    setIsDemoMode(true)
    if (userType === 'me') {
      setProfile(DEMO_USER_ME as Profile)
      setPartnerProfile(DEMO_USER_PARTNER as Profile)
      setUser({ id: DEMO_USER_ME.id, email: DEMO_USER_ME.email } as User)
    } else {
      setProfile(DEMO_USER_PARTNER as Profile)
      setPartnerProfile(DEMO_USER_ME as Profile)
      setUser({ id: DEMO_USER_PARTNER.id, email: DEMO_USER_PARTNER.email } as User)
    }
    setCoupleSpace(DEMO_COUPLE_SPACE)
  }

  const loadUserData = async (userId: string) => {
    try {
      // 1. Fetch own profile
      const { data: prof } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      
      if (prof) setProfile(prof)

      // 2. Fetch active couple space
      const { data: member } = await supabase
        .from('couple_members')
        .select('space_id, role, couple_spaces (*)')
        .eq('user_id', userId)
        .limit(1)
        .maybeSingle()

      if (member && member.couple_spaces) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const space = member.couple_spaces as any
        setCoupleSpace(space)

        // 3. Fetch partner profile
        const { data: partnerMember } = await supabase
          .from('couple_members')
          .select('user_id, profiles (*)')
          .eq('space_id', space.id)
          .neq('user_id', userId)
          .limit(1)
          .maybeSingle()

        if (partnerMember && partnerMember.profiles) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          setPartnerProfile(partnerMember.profiles as any)
        }
      }
    } catch (err) {
      console.error('Error loading user data:', err)
    }
  }

  const refreshSpace = async () => {
    if (user && isConfigured) {
      await loadUserData(user.id)
    }
  }

  useEffect(() => {
    if (!isConfigured) {
      // Initialize with demo data
      switchDemoUser('me')
      setIsLoading(false)
      return
    }

    // Check active Supabase session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        loadUserData(session.user.id).finally(() => setIsLoading(false))
      } else {
        setIsLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        loadUserData(session.user.id)
      } else {
        setProfile(null)
        setPartnerProfile(null)
        setCoupleSpace(null)
      }
      setIsLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [isConfigured])

  const login = async (email: string, password: string) => {
    if (!isConfigured) {
      switchDemoUser(email.includes('boyfriend') || email.includes('him') ? 'partner' : 'me')
      return {}
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { error: error.message }
    return {}
  }

  const signup = async (email: string, password: string, fullName: string, nickname: string) => {
    if (!isConfigured) {
      switchDemoUser('me')
      return {}
    }
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          nickname: nickname,
        },
      },
    })
    if (error) return { error: error.message }
    return {}
  }

  const logout = async () => {
    if (isConfigured) {
      await supabase.auth.signOut()
    }
    setUser(null)
    setProfile(null)
    setPartnerProfile(null)
    setCoupleSpace(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        coupleSpace,
        partnerProfile,
        isDemoMode,
        isConfigured,
        isLoading,
        login,
        signup,
        logout,
        switchDemoUser,
        refreshSpace,
        setCoupleSpace,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}
