import { useQuery } from '@tanstack/react-query'
import { Empty, ErrorMessage, PageHeader, Spinner } from '../components/ui'
import { api } from '../lib/api'
import type { Participation } from '../lib/types'

// Mientras el historial no esté listo se muestra el aviso de "próximamente". Para activarlo, poner a false.
export const HISTORY_COMING_SOON = true

export default function History() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['participations'],
    queryFn: () => api<{ participations: Participation[] }>('/users/me/participations').then((r) => r.participations),
    enabled: !HISTORY_COMING_SOON,
  })

  if (HISTORY_COMING_SOON) {
    return (
      <>
        <PageHeader eyebrow="Tu recorrido" title="Mi" accent="historial" />
        <div className="mt-10 max-w-2xl rounded-3xl bg-white/40 p-10 ring-1 ring-forest/10">
          <span className="inline-block rounded-full bg-forest px-5 py-2 text-[11px] font-bold uppercase tracking-[0.2em] text-paper">Próximamente</span>
          <p className="mt-6 font-serif text-3xl italic leading-snug">
            Muy pronto podrás ver aquí tu historial de entradas: las ediciones en las que has estado y con qué coche.
          </p>
          <p className="mt-4 text-sm leading-relaxed text-forest/70">Estamos terminando de prepararlo.</p>
        </div>
      </>
    )
  }

  return (
    <>
      <PageHeader eyebrow="Tu recorrido" title="Mi" accent="historial" />
      <div className="mt-6">
        {isLoading && <Spinner />}
        <ErrorMessage error={error} />
        {data?.length === 0 && <Empty>Aún no constan ediciones en las que hayas estado. Te esperamos en el bosque.</Empty>}
        {data?.map((p) => (
          <article key={p.id} className="grid items-center gap-6 border-b border-forest/15 py-10 md:grid-cols-[18rem_1fr_auto] xl:gap-16">
            <p className="font-serif text-7xl leading-none xl:text-8xl">{p.year}</p>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-forest/60">{p.event ?? 'Autopia'}</p>
              {p.car ? (
                <p className="mt-2 font-serif text-3xl italic">
                  {p.car.brand} {p.car.model}{p.car.year ? ` · ${p.car.year}` : ''}
                </p>
              ) : (
                <p className="mt-2 font-serif text-3xl italic text-forest/60">Disfrutando del bosque</p>
              )}
            </div>
            <span className={`justify-self-start rounded-full px-5 py-2 text-[11px] font-bold uppercase tracking-[0.2em] md:justify-self-end ${p.role === 'participant' ? 'bg-forest text-paper' : 'ring-1 ring-forest/40'}`}>
              {p.role === 'participant' ? 'Participante' : 'Visitante'}
            </span>
          </article>
        ))}
      </div>
    </>
  )
}
