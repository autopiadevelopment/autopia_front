import { useQuery, useQueryClient } from '@tanstack/react-query'
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { api, setUnauthorizedHandler, tokenStore } from '../lib/api'
import type { AuthResponse, CompleteAccess, User } from '../lib/types'

interface AuthState {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  // Tras verificar el email: reclama la cuenta o restablece la contraseña, y abre sesión
  completeAccess: (data: CompleteAccess) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient()
  // El token también vive en el estado de React: si solo estuviera en localStorage,
  // al cerrar sesión (o al caducar) la app no se volvería a pintar
  const [token, setToken] = useState(() => tokenStore.get())

  const { data: user, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: () => api<{ user: User }>('/users/me').then((r) => r.user),
    enabled: !!token,
    retry: false,
    staleTime: Infinity,
  })

  const logout = useCallback(() => {
    tokenStore.clear()
    setToken(null)
    qc.clear()
  }, [qc])

  useEffect(() => setUnauthorizedHandler(logout), [logout])

  const startSession = useCallback(
    ({ token, user }: AuthResponse) => {
      tokenStore.set(token)
      qc.setQueryData(['me'], user)
      setToken(token)
    },
    [qc],
  )

  const value = useMemo<AuthState>(
    () => ({
      user: token ? (user ?? null) : null,
      loading: !!token && isLoading,
      login: async (email, password) =>
        startSession(await api<AuthResponse>('/auth/login', { method: 'POST', body: { email, password } })),
      completeAccess: async (data) =>
        startSession(await api<AuthResponse>('/auth/set-password', { method: 'POST', body: data })),
      logout,
    }),
    [token, user, isLoading, startSession, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}
