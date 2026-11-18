import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { z } from 'zod'
import { useAuth } from '../auth/AuthContext'
import { Button, Empty, Field, PageHeader, Section, Select, TextArea } from '../components/ui'
import { site } from '../lib/site'
import { useHashScroll } from '../lib/useHashScroll'

type Faq = { q: string; a: string; link?: { to: string; label: string } }

// Contenido provisional: revisar con el equipo antes de publicar
const FAQS: { title: string; description: string; items: Faq[] }[] = [
  {
    title: 'Preinscripción y entrada',
    description: 'De tu solicitud a tu pase al bosque.',
    items: [
      {
        q: '¿Cómo funciona la preinscripción?',
        a: 'Te preinscribes con el coche con el que quieres venir y el equipo revisa todas las solicitudes. Mientras tanto, en «Mi entrada» la verás como «En revisión». Cuando haya decisión te avisaremos por email.',
        link: { to: '/entrada', label: 'Ver mi solicitud' },
      },
      {
        q: '¿Cuándo sabré si tengo plaza?',
        a: 'Revisamos las solicitudes en las semanas previas a cada edición. En cuanto tu coche sea aceptado, tu entrada aparecerá en «Mi entrada» con su código QR.',
      },
      {
        q: '¿Por qué no han aceptado mi coche?',
        a: 'Las plazas son limitadas y en cada edición buscamos variedad de épocas, estilos e historias. No es una valoración de tu coche: puedes volver a preinscribirte en las próximas convocatorias.',
      },
      {
        q: '¿Cómo uso mi entrada el día del evento?',
        a: 'Enseña el QR desde el móvil en la Puerta Garaje: no hace falta imprimirlo. La entrada va unida al coche con el que te aceptaron.',
        link: { to: '/entrada', label: 'Ver mi entrada' },
      },
      {
        q: '¿Puedo pasar mi plaza a otra persona?',
        a: 'Las plazas son nominativas y van unidas a tu coche. Si no puedes venir, escríbenos cuanto antes: así podremos dársela a otro participante.',
      },
    ],
  },
  {
    title: 'Tu coche',
    description: 'La ficha que revisa el equipo.',
    items: [
      {
        q: '¿Cuenta la ficha del coche para que me acepten?',
        a: 'Sí. El equipo revisa los datos y, sobre todo, la historia de cada coche. Cuanto más completa esté la ficha en «Mis coches», mejor podremos valorarlo.',
        link: { to: '/coches', label: 'Completar mis coches' },
      },
      {
        q: '¿Puedo cambiar el coche de mi preinscripción?',
        a: 'Sí, mientras esté en revisión. Si ya tienes plaza, escríbenos con la matrícula del nuevo coche y lo valoramos de nuevo.',
      },
      {
        q: 'Faltan datos de mi coche o hay alguno mal',
        a: 'Los datos vienen de tus inscripciones anteriores. Puedes completarlos o corregirlos tú mismo desde «Mis coches», con el botón Editar.',
        link: { to: '/coches', label: 'Ir a mis coches' },
      },
    ],
  },
  {
    title: 'El día del evento',
    description: 'Para que solo pienses en disfrutar.',
    items: [
      {
        q: '¿A qué hora tengo que llegar?',
        a: 'El acceso de participantes abre a las 08:00 y cierra a las 09:30. Después ya no se pueden mover coches dentro del recinto hasta el cierre.',
      },
      {
        q: '¿Qué pasa si llueve?',
        a: 'Autopia se celebra llueva o haga sol. Solo la aplazaríamos ante una alerta meteorológica oficial, y en ese caso te avisaríamos por email y aquí, en tu área.',
      },
      {
        q: '¿Puedo ir con mi perro?',
        a: 'Claro, siempre con correa. Recuerda que estamos en un bosque: llévale agua y sus bolsas.',
      },
      {
        q: '¿Habrá comida y bebida?',
        a: 'Sí: food trucks y una zona de picnic bajo los pinos. También puedes traer tu propia comida.',
      },
    ],
  },
  {
    title: 'Tu cuenta',
    description: 'Acceso, datos y comunicaciones.',
    items: [
      {
        q: 'He olvidado mi contraseña',
        a: 'Cierra sesión, escribe tu email en la pantalla de acceso y pulsa «¿Has olvidado tu contraseña?». Te enviaremos un código para crear una nueva.',
      },
      {
        q: '¿Puedo cambiar mi email?',
        a: 'El email identifica tu cuenta y tu historial, así que no se cambia desde aquí. Escríbenos desde tu email actual y lo cambiamos nosotros.',
      },
      {
        q: '¿Cómo me doy de baja de la newsletter?',
        a: 'Desde «Perfil», en el apartado Newsletter, o con el enlace que encontrarás al pie de cualquier carta.',
        link: { to: '/perfil#newsletter', label: 'Gestionar newsletter' },
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

const SUBJECTS = ['Mi entrada', 'Mi coche', 'Mi cuenta', 'Prensa y patrocinio', 'Otro'] as const
const contactSchema = z.object({
  subject: z.enum(SUBJECTS, { error: 'Elige un tema' }),
  message: z.string().trim().min(10, 'Cuéntanos un poco más (mín. 10 caracteres)').max(2000),
})
type ContactForm = z.infer<typeof contactSchema>

function Contact() {
  const { user } = useAuth()
  const [opened, setOpened] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm<ContactForm>({ resolver: zodResolver(contactSchema) })

  // Sin backend de contacto: se abre el cliente de correo con el mensaje ya escrito
  const send = ({ subject, message }: ContactForm) => {
    const body = `${message}\n\n—\n${[user?.name, user?.surname].filter(Boolean).join(' ')}\n${user?.email}`
    window.location.assign(`mailto:${site.email}?subject=${encodeURIComponent(`[Área de usuario] ${subject}`)}&body=${encodeURIComponent(body)}`)
    setOpened(true)
  }

  return (
    <div id="contacto" className="scroll-mt-24">
      <Section title="Contacto" description="¿No encuentras lo que buscas? Escríbenos.">
        <div className="grid gap-12 2xl:grid-cols-[1fr_16rem]">
          <form onSubmit={handleSubmit(send)} className="grid gap-y-8" noValidate>
            <Select label="Tema" options={SUBJECTS} placeholder="Elige un tema" error={errors.subject?.message} defaultValue="" {...register('subject')} />
            <TextArea label="Mensaje" rows={5} error={errors.message?.message} {...register('message')} />
            <div className="space-y-3">
              <Button type="submit">Escribir email</Button>
              <p className="text-xs text-forest/50">
                {opened
                  ? 'Si no se ha abierto tu aplicación de correo, escríbenos directamente a ' + site.email + '.'
                  : `Se abrirá tu aplicación de correo con el mensaje listo. Te responderemos a ${user?.email}.`}
              </p>
            </div>
          </form>

          <dl className="space-y-6 border-t border-forest/15 pt-8 2xl:border-l 2xl:border-t-0 2xl:pl-10 2xl:pt-0">
            <div>
              <dt className="text-[11px] font-bold uppercase tracking-[0.2em] text-forest/50">Email</dt>
              <dd className="mt-1"><a href={`mailto:${site.email}`} className="font-serif text-2xl italic hover:underline">{site.email}</a></dd>
            </div>
            <div>
              <dt className="text-[11px] font-bold uppercase tracking-[0.2em] text-forest/50">Web</dt>
              <dd className="mt-1"><a href={site.web} target="_blank" rel="noreferrer" className="font-serif text-2xl italic hover:underline">{site.web.replace(/^https?:\/\//, '')}</a></dd>
            </div>
            <p className="text-sm leading-relaxed text-forest/60">{site.replyTime}</p>
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
        <Field label="Buscar en las preguntas" type="search" placeholder="Preinscripción, QR, contraseña…" value={query} onChange={(e) => setQuery(e.target.value)} />
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
