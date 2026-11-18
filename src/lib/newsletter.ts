import { useState } from 'react'
import { useAuth } from '../auth/AuthContext'

// ─────────────────────────────────────────────────────────────────────────────
// MOCK: la newsletter aún no está conectada a ningún proveedor.
// El estado se guarda solo en este navegador. Al conectarla, `save` debe llamar
// a la API (p. ej. PUT /users/me/newsletter) y el estado inicial leerse de /users/me.
// ─────────────────────────────────────────────────────────────────────────────

export const TOPICS = [
  { id: 'events', label: 'Próximas ediciones' },
  { id: 'routes', label: 'Rutas y quedadas' },
  { id: 'stories', label: 'Historias del garaje' },
] as const
export type Topic = (typeof TOPICS)[number]['id']

interface State {
  subscribed: boolean
  topics: Topic[]
}

const DEFAULT: State = { subscribed: false, topics: ['events', 'routes', 'stories'] }
const key = (userId: string) => `autopia_newsletter_${userId}`

function read(userId: string): State {
  try {
    const raw = localStorage.getItem(key(userId))
    return raw ? { ...DEFAULT, ...JSON.parse(raw) } : DEFAULT
  } catch {
    return DEFAULT
  }
}

export function useNewsletter() {
  const { user } = useAuth()
  const [state, setState] = useState<State>(() => (user ? read(user.id) : DEFAULT))
  const [saving, setSaving] = useState(false)

  const save = async (next: State) => {
    setSaving(true)
    await new Promise((r) => setTimeout(r, 500)) // mock: latencia de red
    try {
      if (user) localStorage.setItem(key(user.id), JSON.stringify(next))
    } catch {
      /* sin almacenamiento: se queda solo en memoria */
    }
    setState(next)
    setSaving(false)
  }

  return {
    ...state,
    saving,
    email: user?.email ?? '',
    subscribe: (topics: Topic[]) => save({ subscribed: true, topics }),
    unsubscribe: () => save({ ...state, subscribed: false }),
  }
}
