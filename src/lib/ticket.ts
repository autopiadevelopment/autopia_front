import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../auth/AuthContext'
import { api } from './api'
import type { EventInfo, Preregistration, Ticket, TicketRecord, TicketStatus, User } from './types'

// ─────────────────────────────────────────────────────────────────────────────
// Prerregistro y entrada son cosas distintas, cada una con su tabla:
// - Prerregistro: GET /users/me/preregistrations. No lleva coche.
// - Entrada: GET /users/me/tickets. Lleva coche. De momento la tabla está vacía.
// MOCK: solo los datos del evento (programa, consejos), que aún no están en la API.
// ─────────────────────────────────────────────────────────────────────────────

// mock: AUTOPÍA Madrid 2027 (EVT-003 en Eventos.csv). Programa y consejos inventados.
const CURRENT_EVENT: EventInfo = {
  id: 'EVT-003',
  name: 'AUTOPÍA Madrid',
  year: 2027,
  date: '2027-04-24',
  endDate: '2027-04-25',
  city: 'Boadilla del Monte',
  province: 'Madrid',
  venue: 'Bosque de la Ciudad Financiera del Santander',
  summary:
    'La edición madrileña vuelve al bosque de la Ciudad Financiera del Santander: un fin de semana entre clásicos, deportivos y coches con historia, con ruta por el pinar, comida bajo los árboles y los premios Autopia al caer la tarde.',
  schedule: [
    { time: '08:00', title: 'Acceso de participantes', text: 'Llegada y colocación de los coches por zonas. El acceso cierra a las 09:30.' },
    { time: '10:00', title: 'Apertura al público', text: 'Se abren las puertas para visitantes.' },
    { time: '11:30', title: 'Ruta por el bosque', text: 'Salida escalonada de los participantes inscritos en la ruta.' },
    { time: '13:30', title: 'Comida bajo los pinos', text: 'Food trucks y zona de picnic.' },
    { time: '16:30', title: 'Premios Autopia', text: 'Mejor historia, mejor restauración y elección del público.' },
    { time: '18:30', title: 'Cierre', text: 'Salida ordenada de los coches, siguiendo al equipo de pista.' },
  ],
  tips: [
    'Lleva la entrada en el móvil con el brillo alto; no hace falta imprimirla.',
    'Documentación del coche y seguro en vigor, y depósito con margen para la ruta.',
    'Calzado cómodo: el recinto es de tierra y pinar.',
    'Perros con correa, bienvenidos.',
    'Está prohibido fumar y hacer fuego en toda la zona de bosque.',
  ],
}

export const currentEvent = CURRENT_EVENT

// Prerregistro del usuario al evento actual (o null). No va unido a ningún coche.
export function useCurrentPreregistration() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['preregistrations', user?.id],
    enabled: !!user,
    queryFn: () =>
      api<{ preregistrations: Preregistration[] }>('/users/me/preregistrations').then(
        (r) => r.preregistrations.find((p) => p.eventId === CURRENT_EVENT.id) ?? null,
      ),
  })
}

const toTicket = (user: User, t: TicketRecord): Ticket => ({
  status: t.status,
  requestedAt: t.createdAt.slice(0, 10),
  reviewedAt: t.reviewedAt?.slice(0, 10),
  code: t.code,
  holder: [user.name, user.surname].filter(Boolean).join(' '),
  gate: t.gate,
  doorsOpen: t.doorsOpen,
  car: t.car,
  event: CURRENT_EVENT,
})

// Entrada del usuario al evento actual (o null)
export function useCurrentTicket() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['tickets', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { tickets } = await api<{ tickets: TicketRecord[] }>('/users/me/tickets')
      const t = tickets.find((x) => x.eventId === CURRENT_EVENT.id)
      return t ? toTicket(user!, t) : null
    },
  })
}

// "Porsche 911", o "coche" si el coche de la entrada ya no existe
export const carName = (t: Ticket) => (t.car ? `${t.car.brand} ${t.car.model}` : 'coche')

export const STATUS_LABEL: Record<TicketStatus, string> = {
  pending: 'En revisión',
  accepted: 'Confirmada',
  rejected: 'Sin plaza',
}

export const formatDay = (iso: string) =>
  new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'long' }).format(new Date(`${iso}T00:00:00`))

// ── Utilidades de fecha del evento ──────────────────────────────────────────

const eventDate = (e: EventInfo) => new Date(`${e.date}T00:00:00`)
const eventEndDate = (e: EventInfo) => new Date(`${e.endDate ?? e.date}T00:00:00`)
const isMultiDay = (e: EventInfo) => !!e.endDate && e.endDate !== e.date

export const daysUntil = (e: EventInfo) => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.round((eventDate(e).getTime() - today.getTime()) / 86_400_000)
}

export const countdownLabel = (e: EventInfo) => {
  const d = daysUntil(e)
  if (d > 1) return `Faltan ${d} días`
  if (d === 1) return 'Es mañana'
  if (d === 0) return 'Es hoy'
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  if (today <= eventEndDate(e)) return 'En marcha'
  return 'Evento finalizado'
}

export const formatEventDate = (e: EventInfo, opts: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) =>
  new Intl.DateTimeFormat('es-ES', opts).format(eventDate(e))

// Días del evento: "24–25" (o "24" si dura un día)
export const eventDays = (e: EventInfo) =>
  isMultiDay(e) ? `${eventDate(e).getDate()}–${eventEndDate(e).getDate()}` : String(eventDate(e).getDate())

// Fechas del evento en texto. long: "sábado 24 y domingo 25 de abril de 2027" · short: "sáb 24 – dom 25 abr"
export function formatEventRange(e: EventInfo, style: 'long' | 'short' = 'long') {
  if (!isMultiDay(e)) {
    return formatEventDate(e, style === 'long' ? undefined : { weekday: 'short', day: 'numeric', month: 'short' })
  }
  const wd = (d: Date) => new Intl.DateTimeFormat('es-ES', { weekday: style }).format(d)
  const [a, b] = [eventDate(e), eventEndDate(e)]
  if (style === 'short') {
    const month = new Intl.DateTimeFormat('es-ES', { month: 'short' }).format(b)
    return `${wd(a)} ${a.getDate()} – ${wd(b)} ${b.getDate()} ${month}`
  }
  const tail = new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' }).format(b)
  return `${wd(a)} ${a.getDate()} y ${wd(b)} ${b.getDate()} de ${tail}`
}

export const mapsUrl = (e: EventInfo) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${e.venue}, ${e.city}, ${e.province}`)}`

// Descarga un .ics con el evento (día completo) para añadirlo al calendario (solo entradas aceptadas)
export function downloadIcs(t: Ticket, code: string) {
  const e = t.event
  const day = e.date.replaceAll('-', '')
  const next = new Date(eventEndDate(e).getTime() + 86_400_000)
  const end = `${next.getFullYear()}${String(next.getMonth() + 1).padStart(2, '0')}${String(next.getDate()).padStart(2, '0')}`
  const esc = (s: string) => s.replace(/[\\,;]/g, (c) => `\\${c}`).replace(/\n/g, '\\n')
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '')
  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Autopia//Area de usuario//ES',
    'BEGIN:VEVENT',
    `UID:${code}@autopia`,
    `DTSTAMP:${stamp}`,
    `DTSTART;VALUE=DATE:${day}`,
    `DTEND;VALUE=DATE:${end}`,
    `SUMMARY:${esc(`${e.name} ${e.year}`)}`,
    `LOCATION:${esc(`${e.venue}, ${e.city}`)}`,
    `DESCRIPTION:${esc([`Entrada ${code}`, t.gate, t.doorsOpen && `desde las ${t.doorsOpen}`].filter(Boolean).join(' · '))}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')
  const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }))
  const a = Object.assign(document.createElement('a'), { href: url, download: `autopia-${e.year}.ics` })
  a.click()
  URL.revokeObjectURL(url)
}
