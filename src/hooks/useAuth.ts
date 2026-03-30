'use client'

import { useState, useEffect, useCallback } from 'react'
import { User, Session, AuthError } from '@supabase/supabase-js'
import { createBrowserClient } from '@/lib/supabase'

type AuthState = {
  user: User | null
  session: Session | null
  loading: boolean
}

type SignInResult = { error: AuthError | null }
type SignUpResult = { error: AuthError | null; needsEmailConfirmation: boolean }

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
  })

  const supabase = createBrowserClient()

  useEffect(() => {
    // 初回セッション取得
    supabase.auth.getSession().then(({ data: { session } }) => {
      setState({ user: session?.user ?? null, session, loading: false })
    })

    // 認証状態の変更を購読
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setState({ user: session?.user ?? null, session, loading: false })
    })

    return () => subscription.unsubscribe()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const signIn = useCallback(async (email: string, password: string): Promise<SignInResult> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error }
  }, [supabase])

  const signUp = useCallback(async (email: string, password: string, displayName: string): Promise<SignUpResult> => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName },
      },
    })
    // メール確認が必要な場合はセッションが null になる
    const needsEmailConfirmation = !error && data.session === null
    return { error, needsEmailConfirmation }
  }, [supabase])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
  }, [supabase])

  return {
    user: state.user,
    session: state.session,
    loading: state.loading,
    signIn,
    signUp,
    signOut,
  }
}
