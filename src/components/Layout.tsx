import { useState } from 'react'
import { NavLink, Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { Spinner } from './ui'

const items = [
  { to: '/', label: 'Inicio', end: true },
  { to: '/perfil', label: 'Perfil' },
  { to: '/coches', label: 'Mis coches' },
  { to: '/historial', label: 'Historial' },
]

function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { user, logout } = useAuth()
  return (
    <div className="flex h-full flex-col bg-forest px-9 py-10 text-paper">
      <img src="/brand/logo-tag-beige.svg" alt="Autopia 05 · Idilio automovilístico en el bosque" className="w-full" />

      <nav className="mt-16 border-b border-paper/15">
        {items.map((it, i) => (
          <NavLink
            key={it.to}
            to={it.to}
            end={it.end}
            onClick={onNavigate}
            className={({ isActive }) =>
              `group flex items-baseline gap-5 border-t border-paper/15 py-5 transition ${isActive ? 'text-paper' : 'text-paper/50 hover:text-paper'}`
            }
          >
            {({ isActive }) => (
              <>
                <span className={`font-serif text-lg italic ${isActive ? 'text-paper' : 'text-paper/40'}`}>
                  0{i + 1}
                </span>
                <span className="font-display text-sm font-extrabold uppercase tracking-wide">{it.label}</span>
                {isActive && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-paper" />}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto pt-10">
        <p className="font-serif text-3xl leading-none">{user?.name}</p>
        <p className="mt-2 break-all text-xs text-paper/50">{user?.email}</p>
        <button onClick={logout} className="mt-6 font-serif text-xl italic text-paper/70 transition hover:text-paper">
          Cerrar sesión →
        </button>
      </div>
    </div>
  )
}

export function ProtectedLayout() {
  const { user, loading } = useAuth()
  const [open, setOpen] = useState(false)
  if (loading) return <Spinner />
  if (!user) return <Navigate to="/login" replace />

  return (
    <div className="min-h-screen lg:flex">
      {/* Escritorio: menú fijo a toda la altura */}
      <aside className="hidden w-80 shrink-0 lg:block xl:w-96">
        <div className="sticky top-0 h-screen">
          <Sidebar />
        </div>
      </aside>

      {/* Móvil: botón flotante + panel lateral */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Abrir menú"
        className="fixed left-4 top-4 z-30 flex h-12 w-12 flex-col items-center justify-center gap-1.5 rounded-full bg-forest lg:hidden"
      >
        <span className="h-px w-5 bg-paper" />
        <span className="h-px w-5 bg-paper" />
      </button>
      {open && (
        <div className="fixed inset-0 z-40 flex lg:hidden">
          <div className="w-80 max-w-[85%] overflow-y-auto">
            <Sidebar onNavigate={() => setOpen(false)} />
          </div>
          <button aria-label="Cerrar menú" className="flex-1 bg-forest/60" onClick={() => setOpen(false)} />
        </div>
      )}

      <main className="min-w-0 flex-1 px-6 pb-24 pt-24 lg:px-14 lg:pt-14 xl:px-24">
        <Outlet />
      </main>
    </div>
  )
}

export function PublicLayout() {
  const { user, loading } = useAuth()
  if (loading) return <Spinner />
  if (user) return <Navigate to="/" replace />
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-2">
      <div className="hidden flex-col justify-between bg-forest p-16 text-paper lg:flex">
        <img src="/brand/logo-beige.svg" alt="Autopia" className="w-56" />
        <p className="font-serif text-6xl italic leading-[1.05] xl:text-7xl">
          Idilio automovilístico en el bosque.
        </p>
        <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-paper/60">Área de usuario</p>
      </div>
      <div className="flex min-h-screen items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <img src="/brand/logo-green.svg" alt="Autopia" className="mb-12 w-40 lg:hidden" />
          <Outlet />
        </div>
      </div>
    </div>
  )
}
