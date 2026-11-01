import { useQuery, useQueryClient } from '@tanstack/react-query'
import { createContext, useCallback, useContext, useEffect, useMemo, type ReactNode } from 'react'
import { api, setUnauthorizedHandler, tokenStore } from '../lib/api'
import type { AuthResponse, User } from '../lib/types'

interface AuthState {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (data: Record<string, unknown>) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient()

  const { data: user, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: () => api<{ user: User }>('/users/me').then((r) => r.user),
    enabled: !!tokenStore.get(),
    retry: false,
    staleTime: Infinity,
  })

  const logout = useCallback(() => {
    tokenStore.clear()
    qc.clear()
  }, [qc])

  useEffect(() => setUnauthorizedHandler(logout), [logout])

  const startSession = useCallback(
    ({ token, user }: AuthResponse) => {
      tokenStore.set(token)
      qc.setQueryData(['me'], user)
    },
    [qc],
  )

  const value = useMemo<AuthState>(
    () => ({
      user: tokenStore.get() ? (user ?? null) : null,
      loading: !!tokenStore.get() && isLoading,
      login: async (email, password) =>
        startSession(await api<AuthResponse>('/auth/login', { method: 'POST', body: { email, password } })),
      register: async (data) =>
        startSession(await api<AuthResponse>('/auth/register', { method: 'POST', body: data })),
      logout,
    }),
    [user, isLoading, startSession, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}
