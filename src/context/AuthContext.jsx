import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = useCallback(async (userId) => {
    if (!userId) return setProfile(null)
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()
    if (!error) setProfile(data)
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null)
      if (data.session?.user) fetchProfile(data.session.user.id)
      setLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      else setProfile(null)
    })

    return () => listener.subscription.unsubscribe()
  }, [fetchProfile])

  const signUp = async ({ email, password, fullName, phone, referredBy }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, phone, referred_by: referredBy || null } },
    })
    if (error) throw error
    // users row is created automatically via DB trigger (see schema.sql)
    return data
  }

  const signIn = async ({ email, password }) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  }

  const signInWithGoogle = async (redirectPath = '/dashboard') => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}${redirectPath}` },
    })
    if (error) throw error
    // Supabase redirects the browser to Google, then back to redirectTo — no data to return here.
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  const isAdmin = profile?.role === 'admin'

  return (
    <AuthContext.Provider
      value={{ user, profile, loading, isAdmin, signUp, signIn, signInWithGoogle, signOut, refreshProfile: () => fetchProfile(user?.id) }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
