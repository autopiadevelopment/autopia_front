import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { QrCode } from '../components/QrCode'
import { buttonClass } from '../components/styles'
import { Button, Empty, ErrorMessage, Eyebrow, PageHeader, Section, Spinner } from '../components/ui'
import {
  carName,
  countdownLabel,
  currentEvent,
  downloadIcs,
  formatDay,
  formatEventDate,
  mapsUrl,
  STATUS_LABEL,
  useCurrentPreregistration,
  useCurrentTicket,
} from '../lib/ticket'
import type { Ticket as TicketT } from '../lib/types'

const Detail = ({ label, children }: { label: string; children: ReactNode }) => (
  <div>
    <dt className="text-[10px] font-bold uppercase tracking-[0.25em] text-paper/50">{label}</dt>
    <dd className="mt-1.5 font-serif text-2xl leading-tight">{children}</dd>
  </div>
)

function StatusBadge({ ticket }: { ticket: TicketT }) {
  const styles = {
    accepted: 'bg-paper text-forest',
    pending: 'ring-1 ring-paper/50',
    rejected: 'text-paper/60 ring-1 ring-paper/25',
  }[ticket.status]
  return (
    <span className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.25em] ${styles}`}>
      {ticket.status === 'pending' && <span className="h-1.5 w-1.5 rounded-full bg-paper motion-safe:animate-pulse" />}
      {STATUS_LABEL[ticket.status]}
    </span>
  )
}

// Matriz troquelada: QR si está aceptada; si no, el hueco del QR con el estado
function Stub({ ticket }: { ticket: TicketT }) {
  if (ticket.status === 'accepted' && ticket.code) {
    return (
      <>
        <div className="rounded-2xl bg-paper p-4 text-forest">
          <QrCode value={ticket.code} className="h-44 w-44 sm:h-48 sm:w-48" />
        </div>
        <p className="mt-5 font-display text-xs font-extrabold tracking-[0.25em]">{ticket.code}</p>
        <p className="mt-2 text-center font-serif text-lg italic text-paper/60">Muéstralo en el acceso</p>
      </>
    )
  }
  const pending = ticket.status === 'pending'
  return (
    <>
      <div className="relative flex h-52 w-52 items-center justify-center overflow-hidden rounded-2xl border border-dashed border-paper/30 sm:h-56 sm:w-56">
        {/* Silueta de QR difuminada: aún no hay código */}
        <QrCode value="autopia" className={`absolute inset-4 text-paper blur-[3px] ${pending ? 'opacity-15' : 'opacity-5'}`} />
        <p className="relative px-6 text-center font-serif text-3xl italic leading-tight">{pending ? 'En revisión' : 'Sin plaza'}</p>
      </div>
      <p className="mt-5 max-w-56 text-center font-serif text-lg italic leading-snug text-paper/60">
        {pending ? 'Tu QR aparecerá aquí cuando el equipo acepte tu coche.' : 'Esta vez no ha podido ser.'}
      </p>
    </>
  )
}

// Entrada con forma de billete: cuerpo + matriz troquelada
export function TicketCard({ ticket }: { ticket: TicketT }) {
  const e = ticket.event
  return (
    <article
      className={`relative grid overflow-hidden rounded-[2rem] bg-forest text-paper shadow-[0_30px_60px_-30px_rgba(20,45,40,0.6)] lg:grid-cols-[1fr_auto] ${ticket.status === 'rejected' ? 'opacity-80' : ''}`}
    >
      <div className="p-8 sm:p-12">
        <div className="flex items-center justify-between gap-6">
          <img src="/brand/logo-beige.svg" alt="Autopia" className="w-28" />
          <StatusBadge ticket={ticket} />
        </div>

        <p className="mt-12 text-[11px] font-bold uppercase tracking-[0.3em] text-paper/60">
          Participante · Edición {e.year} · {e.city}
        </p>
        <h2 className="mt-3 font-serif text-5xl font-normal normal-case leading-[0.95] tracking-normal sm:text-6xl xl:text-7xl">
          {e.name} <em>{e.year}</em>
        </h2>

        <dl className="mt-10 grid grid-cols-2 gap-x-8 gap-y-6 border-t border-paper/15 pt-8 xl:grid-cols-4">
          <Detail label="Fecha">{formatEventDate(e, { weekday: 'short', day: 'numeric', month: 'short' })}</Detail>
          <Detail label="Acceso desde">{ticket.doorsOpen ? `${ticket.doorsOpen} h` : 'Por confirmar'}</Detail>
          <Detail label="Puerta">{ticket.gate ?? 'Por confirmar'}</Detail>
          <Detail label="Lugar">{e.city}</Detail>
        </dl>

        <dl className="mt-8 grid gap-x-8 gap-y-6 border-t border-paper/15 pt-8 sm:grid-cols-2">
          <Detail label="Titular">{ticket.holder}</Detail>
          <Detail label="Coche">
            <em>{ticket.car ? carName(ticket) : 'No disponible'}</em>
            {ticket.car && (ticket.car.plate || ticket.car.year) && (
              <span className="mt-1 block font-sans text-xs uppercase tracking-[0.2em] text-paper/60">
                {[ticket.car.year, ticket.car.plate].filter(Boolean).join(' · ')}
              </span>
            )}
          </Detail>
        </dl>
      </div>

      <div className="relative flex flex-col items-center justify-center border-t-2 border-dashed border-paper/25 p-8 sm:p-12 lg:w-80 lg:border-l-2 lg:border-t-0">
        <span aria-hidden className="absolute -left-4 -top-4 h-8 w-8 rounded-full bg-paper" />
        <span aria-hidden className="absolute -right-4 -top-4 h-8 w-8 rounded-full bg-paper lg:-bottom-4 lg:-left-4 lg:right-auto lg:top-auto" />
        <Stub ticket={ticket} />
      </div>
    </article>
  )
}

// Recorrido de la solicitud: preregistro → revisión → plaza
function Progress({ ticket }: { ticket: TicketT }) {
  const reviewed = ticket.reviewedAt ? formatDay(ticket.reviewedAt) : ''
  const steps: { title: string; text: string; state: 'done' | 'current' | 'todo' | 'no' }[] = [
    { title: 'Preinscripción', text: `Recibida el ${formatDay(ticket.requestedAt)} con tu ${carName(ticket)}.`, state: 'done' },
    ticket.status === 'pending'
      ? { title: 'Revisión del equipo', text: 'En curso. Te avisaremos por email en cuanto haya decisión.', state: 'current' }
      : { title: 'Revisión del equipo', text: `Revisada el ${reviewed}.`, state: 'done' },
    ticket.status === 'accepted'
      ? { title: 'Plaza confirmada', text: 'Ya tienes tu entrada con QR. ¡Nos vemos en el bosque!', state: 'done' }
      : ticket.status === 'rejected'
        ? { title: 'Sin plaza', text: 'Tu coche no ha entrado en la selección de esta edición.', state: 'no' }
        : { title: 'Entrada con QR', text: 'Si tu coche entra, aquí tendrás tu entrada.', state: 'todo' },
  ]
  const dot = {
    done: 'bg-forest text-paper',
    current: 'ring-2 ring-forest text-forest',
    todo: 'ring-1 ring-forest/25 text-forest/40',
    no: 'ring-1 ring-red-800/50 text-red-800',
  }
  return (
    <ol className="grid gap-8 md:grid-cols-3 md:gap-6">
      {steps.map((s, i) => (
        <li key={s.title} className="flex gap-4 md:flex-col">
          <div className="flex items-center gap-4 md:w-full">
            <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-serif text-lg ${dot[s.state]}`}>
              {s.state === 'done' ? '✓' : s.state === 'no' ? '×' : i + 1}
            </span>
            {i < steps.length - 1 && <span className={`hidden h-px flex-1 md:block ${s.state === 'done' ? 'bg-forest' : 'bg-forest/20'}`} />}
          </div>
          <div>
            <p className={`font-display text-sm font-extrabold uppercase tracking-tight ${s.state === 'todo' ? 'text-forest/40' : ''}`}>{s.title}</p>
            <p className={`mt-1.5 text-sm leading-relaxed ${s.state === 'todo' ? 'text-forest/40' : 'text-forest/70'}`}>{s.text}</p>
          </div>
        </li>
      ))}
    </ol>
  )
}

const textLink = 'underline underline-offset-4 hover:text-forest'

// Prerregistrado pero aún sin entrada (el prerregistro no lleva coche)
function Preregistered() {
  const e = currentEvent
  return (
    <>
      <PageHeader
        eyebrow={`${e.name} ${e.year}`}
        title="Mi"
        accent="entrada"
        action={<p className="font-serif text-3xl italic text-forest/70">{countdownLabel(e)}</p>}
      />
      <p className="mt-10 max-w-2xl font-serif text-3xl italic leading-snug text-forest/70">
        Tienes hecho el prerregistro para {e.name} {e.year}. Tu entrada aparecerá aquí cuando esté lista.
      </p>
      <Section title="El evento" description={formatEventDate(e)}>
        <p className="font-serif text-3xl italic leading-snug text-forest/80">{e.summary}</p>
        <dl className="mt-10 grid gap-x-10 gap-y-6 sm:grid-cols-3">
          {[
            ['Lugar', e.venue],
            ['Ciudad', `${e.city}, ${e.province}`],
            ['Fecha', formatEventDate(e, { day: 'numeric', month: 'long', year: 'numeric' })],
          ].map(([k, v]) => (
            <div key={k}>
              <dt className="text-[11px] font-bold uppercase tracking-[0.2em] text-forest/50">{k}</dt>
              <dd className="mt-1">{v}</dd>
            </div>
          ))}
        </dl>
      </Section>
    </>
  )
}

export default function Ticket() {
  const { data: ticket, isLoading, error } = useCurrentTicket()
  const { data: pre, isLoading: preLoading, error: preError } = useCurrentPreregistration()

  // Qué se enseña: la entrada si la hay (aunque también haya prerregistro); si no, el
  // prerregistro; si no hay ninguno de los dos, se le avisa
  if (isLoading || (!ticket && preLoading)) return <Spinner />
  if (error) return <ErrorMessage error={error} />
  if (!ticket) {
    if (preError) return <ErrorMessage error={preError} />
    if (pre) return <Preregistered />
    return (
      <>
        <PageHeader eyebrow="Próximo evento" title="Mi" accent="entrada" />
        <Empty>Todavía no tienes entrada ni prerregistro para {currentEvent.name} {currentEvent.year}.</Empty>
        <Link to="/ayuda#contacto" className={buttonClass('secondary')}>Escríbenos</Link>
      </>
    )
  }

  const e = ticket.event
  const { status } = ticket
  return (
    <>
      <PageHeader
        eyebrow={`${e.name} ${e.year}`}
        title="Mi"
        accent="entrada"
        action={<p className="font-serif text-3xl italic text-forest/70">{countdownLabel(e)}</p>}
      />

      <div className="mt-12 motion-safe:animate-rise">
        <TicketCard ticket={ticket} />
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        {status === 'accepted' && ticket.code && <Button onClick={() => downloadIcs(ticket, ticket.code!)}>Añadir al calendario</Button>}
        {status === 'pending' && <Link to="/coches" className={buttonClass('primary')}>Completar la ficha del coche</Link>}
        {status === 'rejected' ? (
          <Link to="/ayuda#contacto" className={buttonClass('secondary')}>Escríbenos</Link>
        ) : (
          <a href={mapsUrl(e)} target="_blank" rel="noreferrer" className={buttonClass('secondary')}>Cómo llegar ↗</a>
        )}
      </div>
      <p className="mt-4 max-w-2xl text-xs leading-relaxed text-forest/50">
        {status === 'accepted' && (
          <>La entrada es personal y va unida a tu coche. Si no puedes venir, <Link to="/ayuda#contacto" className={textLink}>escríbenos</Link>.</>
        )}
        {status === 'pending' && (
          <>El equipo revisa la ficha de cada coche: cuanto más completa esté, mejor. Si quieres cambiar de coche mientras tanto, <Link to="/ayuda#contacto" className={textLink}>escríbenos</Link>.</>
        )}
        {status === 'rejected' && <>Si crees que es un error o quieres saber más, cuéntanoslo.</>}
      </p>

      <Section title="Tu solicitud" description={STATUS_LABEL[status]}>
        <Progress ticket={ticket} />
        {status === 'rejected' && (
          <p className="mt-10 font-serif text-2xl italic leading-snug text-forest/75">
            Las plazas son limitadas y en cada edición buscamos variedad de épocas, estilos e historias. No es una valoración de tu
            coche: te esperamos en las próximas convocatorias.
          </p>
        )}
      </Section>

      <Section title="El evento" description={formatEventDate(e)}>
        <p className="font-serif text-3xl italic leading-snug text-forest/80">{e.summary}</p>
        <dl className="mt-10 grid gap-x-10 gap-y-6 sm:grid-cols-3">
          {[
            ['Lugar', e.venue],
            ['Ciudad', `${e.city}, ${e.province}`],
            ['Acceso participantes', [ticket.gate, ticket.doorsOpen && `${ticket.doorsOpen} h`].filter(Boolean).join(' · ') || 'Por confirmar'],
          ].map(([k, v]) => (
            <div key={k}>
              <dt className="text-[11px] font-bold uppercase tracking-[0.2em] text-forest/50">{k}</dt>
              <dd className="mt-1">{v}</dd>
            </div>
          ))}
        </dl>
        {status !== 'rejected' && (
          <p className="mt-6 text-sm text-forest/60">
            {status === 'accepted' ? 'Te enviaremos' : 'Si tu coche entra, te enviaremos'} la ubicación exacta y el plano de accesos por email una semana antes.
          </p>
        )}
      </Section>

      {status !== 'rejected' && (
        <>
          <Section title="Programa" description="Horarios orientativos: pueden ajustarse el mismo día.">
            <ol>
              {e.schedule.map((s) => (
                <li key={s.time} className="grid grid-cols-[5rem_1fr] gap-6 border-t border-forest/15 py-5 first:border-t-0 first:pt-0 sm:grid-cols-[7rem_1fr]">
                  <span className="font-serif text-3xl leading-none">{s.time}</span>
                  <div>
                    <p className="font-display text-sm font-extrabold uppercase tracking-tight">{s.title}</p>
                    {s.text && <p className="mt-1.5 text-sm leading-relaxed text-forest/70">{s.text}</p>}
                  </div>
                </li>
              ))}
            </ol>
          </Section>

          <Section title="Antes de ir" description="Lo que conviene saber para disfrutar del día.">
            <ul className="space-y-4">
              {e.tips.map((tip, i) => (
                <li key={tip} className="flex gap-5">
                  <span className="font-serif text-xl italic text-forest/40">{String(i + 1).padStart(2, '0')}</span>
                  <span className="leading-relaxed">{tip}</span>
                </li>
              ))}
            </ul>
            <Eyebrow className="mt-10">
              ¿Más dudas? <Link to="/ayuda" className="text-forest underline underline-offset-4">Preguntas frecuentes →</Link>
            </Eyebrow>
          </Section>
        </>
      )}
    </>
  )
}
