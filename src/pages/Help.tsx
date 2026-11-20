import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { z } from 'zod'
import { useAuth } from '../auth/AuthContext'
import { Button, Empty, Field, PageHeader, Section, TextArea } from '../components/ui'
import { site } from '../lib/site'
import { useHashScroll } from '../lib/useHashScroll'

type Faq = { q: string; a: string; link?: { to: string; label: string } }

// Contenido provisional (de relleno, basado en autopia.events/sobre-nosotros): revisar con el equipo antes de publicar
const FAQS: { title: string; description: string; items: Faq[] }[] = [
  {
    title: 'Sobre Autopia',
    description: 'Quiénes somos y qué es esto del bosque.',
    items: [
      {
        q: '¿Qué es Autopia?',
        a: 'Un encuentro de coches clásicos, especiales y de vanguardia en 70 hectáreas de bosque. Cultura del automóvil y ocio en un mismo sitio, sin prisas.',
      },
      {
        q: '¿Quién está detrás?',
        a: 'Juan Hernández-Luike, ligado desde siempre a Luike Motorpress, y Héctor Álvarez, creador de If You Like Cars. Lo organizamos junto a Luikemotion, IYLC y Last Lap.',
      },
      {
        q: '¿Qué tipo de coches se ven?',
        a: 'De todo un poco: clásicos, deportivos, rarezas y coches con historia. Más que el valor del coche, nos importa lo que cuenta.',
      },
    ],
  },
  {
    title: 'Tu coche',
    description: 'La ficha que revisa el equipo.',
    items: [
      {
        q: 'Hay datos de mi coche que están mal',
        a: 'Puedes corregirlos tú mismo desde «Mis coches», con el botón Editar.',
        link: { to: '/coches', label: 'Ir a mis coches' },
      },
    ],
  },
  {
    title: 'Tu cuenta',
    description: 'Acceso, datos y comunicaciones.',
    items: [
      {
        q: 'He olvidado mi contraseña',
        a: 'En la pantalla de acceso, escribe tu email y pulsa «¿Has olvidado tu contraseña?». Te enviaremos un código para crear una nueva.',
      },
    ],
  },
]

const norm = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

function FaqItem({ faq }: { faq: Faq }) {
  return (
    <details className="group border-t border-forest/15 first:border-t-0 [&_summary::-webkit-details-marker]:hidden">
      <summary className="flex cursor-pointer list-none items-baseline justify-between gap-6 py-5 outline-none focus-visible:underline">
        <span className="font-serif text-2xl leading-snug">{faq.q}</span>
        <span aria-hidden className="text-2xl leading-none text-forest/50 transition group-open:rotate-45">+</span>
      </summary>
      <div className="pb-6 pr-10">
        <p className="leading-relaxed text-forest/75">{faq.a}</p>
        {faq.link && (
          <Link to={faq.link.to} className="mt-4 inline-block text-[11px] font-bold uppercase tracking-[0.2em] underline-offset-4 hover:underline">
            {faq.link.label} →
          </Link>
        )}
      </div>
    </details>
  )
}

const contactSchema = z.object({
  message: z.string().trim().min(10, 'Cuéntanos un poco más (mín. 10 caracteres)').max(2000),
})
type ContactForm = z.infer<typeof contactSchema>

function Contact() {
  const { user } = useAuth()
  const [opened, setOpened] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm<ContactForm>({ resolver: zodResolver(contactSchema) })

  // Sin backend de contacto: se abre el cliente de correo con el mensaje ya escrito
  const send = ({ message }: ContactForm) => {
    const body = `${message}\n\n—\n${[user?.name, user?.surname].filter(Boolean).join(' ')}\n${user?.email}`
    window.location.assign(`mailto:${site.email}?subject=${encodeURIComponent('[Área de usuario] Contacto')}&body=${encodeURIComponent(body)}`)
    setOpened(true)
  }

  return (
    <div id="contacto" className="scroll-mt-24">
      <Section title="Contacto" description="¿No encuentras lo que buscas? Escríbenos.">
        <div className="grid gap-12 2xl:grid-cols-[1fr_16rem]">
          <form onSubmit={handleSubmit(send)} className="grid gap-y-8" noValidate>
            <TextArea label="Mensaje" rows={5} error={errors.message?.message} {...register('message')} />
            <div className="space-y-3">
              <Button type="submit">Escribir email</Button>
              <p className="text-xs text-forest/50">
                {opened
                  ? 'Si no se ha abierto tu aplicación de correo, inténtalo de nuevo en unos minutos.'
                  : `Se abrirá tu aplicación de correo con el mensaje listo. Te responderemos a ${user?.email}.`}
              </p>
            </div>
          </form>

          <dl className="space-y-6 border-t border-forest/15 pt-8 2xl:border-l 2xl:border-t-0 2xl:pl-10 2xl:pt-0">
            <div>
              <dt className="text-[11px] font-bold uppercase tracking-[0.2em] text-forest/50">Web</dt>
              <dd className="mt-1"><a href={site.web} target="_blank" rel="noreferrer" className="font-serif text-2xl italic hover:underline">{site.web.replace(/^https?:\/\//, '')}</a></dd>
            </div>
          </dl>
        </div>
      </Section>
    </div>
  )
}

export default function Help() {
  const [query, setQuery] = useState('')
  useHashScroll()

  const groups = useMemo(() => {
    const q = norm(query.trim())
    if (!q) return FAQS
    return FAQS.map((g) => ({ ...g, items: g.items.filter((f) => norm(f.q + ' ' + f.a).includes(q)) })).filter((g) => g.items.length)
  }, [query])

  return (
    <>
      <PageHeader
        eyebrow="Ayuda"
        title="¿En qué te"
        accent="ayudamos?"
        action={<a href="#contacto" className="font-serif text-2xl italic text-forest/70 hover:text-forest">Contactar →</a>}
      />

      <div className="max-w-xl pt-10">
        <Field label="Buscar en las preguntas" type="search" placeholder="Coches, contraseña…" value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>

      {groups.map((g) => (
        <Section key={g.title} title={g.title} description={g.description}>
          {g.items.map((f) => <FaqItem key={f.q} faq={f} />)}
        </Section>
      ))}
      {!groups.length && (
        <div className="border-b border-forest/15">
          <Empty>No hay preguntas que coincidan con «{query}». Escríbenos abajo y te ayudamos.</Empty>
        </div>
      )}

      <Contact />
    </>
  )
}
