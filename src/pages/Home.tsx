import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { PageHeader } from '../components/ui'
import { api } from '../lib/api'
import type { Car } from '../lib/types'

export default function Home() {
  const { user } = useAuth()
  const { data: cars } = useQuery({
    queryKey: ['cars'],
    queryFn: () => api<{ cars: Car[] }>('/cars').then((r) => r.cars),
  })

  const carsHint =
    cars === undefined ? 'Tu garaje' : cars.length === 0 ? 'Aún sin coches' : `${cars.length} ${cars.length === 1 ? 'coche' : 'coches'} en tu garaje`

  const sections = [
    { to: '/perfil', title: 'Perfil', text: 'Tus datos personales, contraseña y cuenta.', hint: user?.email },
    { to: '/coches', title: 'Mis coches', text: 'Consulta y gestiona los coches que traes a Autopia.', hint: carsHint },
    { to: '/historial', title: 'Historial', text: 'Las ediciones en las que has estado, como participante o visitante.', hint: 'Tu recorrido' },
  ]

  return (
    <>
      <PageHeader eyebrow={`Hola, ${user?.name}`} title="Bienvenido a tu" accent="área de usuario" />
      <p className="mt-10 max-w-2xl font-serif text-3xl italic leading-snug text-forest/70">
        Desde aquí puedes gestionar tu perfil, tus coches y revisar tu paso por Autopia.
      </p>

      <div className="mt-16 grid gap-6 xl:grid-cols-3">
        {sections.map((s, i) => (
          <Link
            key={s.to}
            to={s.to}
            className="group flex min-h-72 flex-col justify-between rounded-3xl bg-white/40 p-8 ring-1 ring-forest/10 transition hover:bg-forest hover:text-paper"
          >
            <div className="flex items-start justify-between">
              <span className="font-serif text-3xl italic text-forest/40 transition group-hover:text-paper/50">0{i + 2}</span>
              <span className="text-2xl transition group-hover:translate-x-1">→</span>
            </div>
            <div>
              <h2 className="text-lg">{s.title}</h2>
              <p className="mt-3 font-serif text-xl italic leading-snug text-forest/70 transition group-hover:text-paper/75">{s.text}</p>
              <p className="mt-6 text-[11px] font-bold uppercase tracking-[0.2em] text-forest/50 transition group-hover:text-paper/60">{s.hint}</p>
            </div>
          </Link>
        ))}
      </div>
    </>
  )
}
