import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { NewsletterBand } from '../components/Newsletter'
import { PageHeader } from '../components/ui'
import { navNumber } from '../lib/nav'
import { carsQuery } from '../lib/queries'
import { carName, countdownLabel, currentEvent, eventDays, formatEventDate, STATUS_LABEL, useCurrentPreregistration, useCurrentTicket } from '../lib/ticket'
import type { TicketStatus } from '../lib/types'

const COPY: Record<TicketStatus, { line: (car: string) => string; cta: string }> = {
  pending: { line: (car) => `Tu ${car} está preinscrito y en revisión.`, cta: 'Ver mi solicitud' },
  accepted: { line: (car) => `Tu ${car} tiene plaza. Ya tienes tu entrada.`, cta: 'Ver mi entrada' },
  rejected: { line: (car) => `Esta vez tu ${car} no ha entrado en la selección.`, cta: 'Ver detalles' },
}

// Aviso de la próxima cita: lleva directo a la entrada (o al prerregistro, si aún no hay entrada)
function NextEvent() {
  const { data: ticket, isLoading } = useCurrentTicket()
  const { data: pre, isLoading: preLoading } = useCurrentPreregistration()
  if (isLoading || (!ticket && preLoading)) return <div className="mt-16 h-40 rounded-[2rem] bg-forest/5" aria-hidden />
  if (!ticket && !pre) return null
  const e = ticket?.event ?? currentEvent
  const copy = ticket
    ? { label: STATUS_LABEL[ticket.status], line: COPY[ticket.status].line(carName(ticket)), cta: COPY[ticket.status].cta }
    : { label: 'Prerregistro hecho', line: 'Tu entrada aparecerá aquí cuando esté lista.', cta: 'Ver mi prerregistro' }
  return (
    <Link
      to="/entrada"
      className="group mt-16 grid items-center gap-8 rounded-[2rem] p-8 ring-1 ring-forest/15 transition hover:bg-white/40 sm:p-10 lg:grid-cols-[auto_1fr_auto] lg:gap-12"
    >
      <div className="lg:border-r lg:border-forest/15 lg:pr-12 lg:text-center">
        <p className="font-serif text-8xl leading-none">{eventDays(e)}</p>
        <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.3em] text-forest/60">{formatEventDate(e, { month: 'long', year: 'numeric' })}</p>
      </div>
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-forest/60">
          Próximo evento · {copy.label} · {countdownLabel(e)}
        </p>
        <h2 className="mt-3 font-serif text-4xl font-normal normal-case leading-tight tracking-normal xl:text-5xl">
          {e.name} <em>{e.year}</em>
        </h2>
        <p className="mt-2 font-serif text-xl italic text-forest/70">{copy.line}</p>
      </div>
      <span className="inline-flex items-center gap-3 justify-self-start rounded-full bg-forest px-7 py-3 text-xs font-bold uppercase tracking-widest text-paper transition group-hover:bg-forest/85 lg:justify-self-end">
        {copy.cta} <span className="transition group-hover:translate-x-1">→</span>
      </span>
    </Link>
  )
}

export default function Home() {
  const { user } = useAuth()
  const { data: cars } = useQuery(carsQuery)

  const carsHint =
    cars === undefined ? 'Tu garaje' : cars.length === 0 ? 'Aún sin coches' : `${cars.length} ${cars.length === 1 ? 'coche' : 'coches'} en tu garaje`

  const sections = [
    { to: '/perfil', title: 'Perfil', text: 'Tus datos personales y la newsletter.', hint: user?.email },
    { to: '/coches', title: 'Mis coches', text: 'La ficha completa de los coches que traes a Autopía.', hint: carsHint },
    { to: '/historial', title: 'Historial', text: 'Las ediciones en las que has estado y con qué coche.', hint: 'Próximamente' },
    { to: '/ayuda', title: 'Ayuda', text: 'Preguntas frecuentes y contacto con el equipo.', hint: '¿Hablamos?' },
  ]

  return (
    <>
      <PageHeader eyebrow={`Hola, ${user?.name}`} title="Bienvenido a tu" accent="área de usuario" />
      <p className="mt-10 max-w-2xl font-serif text-3xl italic leading-snug text-forest/70">
        Tu entrada, tus coches y tu paso por Autopía, todo en un mismo sitio.
      </p>

      <NextEvent />

      <div className="mt-6 grid gap-6 md:grid-cols-2 2xl:grid-cols-4">
        {sections.map((s) => (
          <Link
            key={s.to}
            to={s.to}
            className="group flex min-h-72 flex-col justify-between rounded-3xl bg-white/40 p-8 ring-1 ring-forest/10 transition hover:bg-forest hover:text-paper"
          >
            <div className="flex items-start justify-between">
              <span className="font-serif text-3xl italic text-forest/40 transition group-hover:text-paper/50">{navNumber(s.to)}</span>
              <span className="text-2xl transition group-hover:translate-x-1">→</span>
            </div>
            <div>
              <h2 className="text-lg">{s.title}</h2>
              <p className="mt-3 font-serif text-xl italic leading-snug text-forest/70 transition group-hover:text-paper/75">{s.text}</p>
              <p className="mt-6 truncate text-[11px] font-bold uppercase tracking-[0.2em] text-forest/50 transition group-hover:text-paper/60">{s.hint}</p>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-20">
        <NewsletterBand />
      </div>
    </>
  )
}
