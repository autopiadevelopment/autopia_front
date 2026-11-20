import { useState } from 'react'
import { TOPICS, useNewsletter, type Topic } from '../lib/newsletter'
import { Button, Section } from './ui'

const NAME = 'Cartas desde el bosque'
const PITCH = 'Una carta al mes con las próximas ediciones, rutas y las mejores historias del garaje. Sin ruido.'

// Mientras la newsletter no esté conectada a un proveedor se muestra "próximamente". Para activarla, poner a false.
const NEWSLETTER_COMING_SOON = true

function ComingSoon({ dark = false }: { dark?: boolean }) {
  return (
    <div className="flex flex-col justify-center">
      <span className={`self-start rounded-full px-5 py-2 text-[11px] font-bold uppercase tracking-[0.2em] ${dark ? 'bg-paper text-forest' : 'bg-forest text-paper'}`}>
        Próximamente
      </span>
      <p className="mt-5 font-serif text-3xl italic leading-snug">Muy pronto podrás suscribirte desde aquí.</p>
      <p className={`mt-3 text-sm leading-relaxed ${dark ? 'text-paper/60' : 'text-forest/60'}`}>Estamos preparando las primeras cartas.</p>
    </div>
  )
}

function NewsletterForm({ dark = false }: { dark?: boolean }) {
  return NEWSLETTER_COMING_SOON ? <ComingSoon dark={dark} /> : <RealNewsletterForm dark={dark} />
}

function RealNewsletterForm({ dark = false }: { dark?: boolean }) {
  const nl = useNewsletter()
  const [topics, setTopics] = useState<Topic[]>(nl.topics)
  const [editing, setEditing] = useState(false)
  const muted = dark ? 'text-paper/60' : 'text-forest/60'

  const toggle = (t: Topic) => setTopics((cur) => (cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t]))
  const save = async () => {
    await nl.subscribe(topics)
    setEditing(false)
  }

  if (nl.subscribed && !editing) {
    const labels = TOPICS.filter((t) => nl.topics.includes(t.id)).map((t) => t.label.toLowerCase())
    return (
      <div className="flex flex-col justify-center">
        <p className="font-serif text-3xl italic leading-snug">Ya estás en la lista.</p>
        <p className={`mt-3 text-sm leading-relaxed ${muted}`}>
          Recibirás las cartas en <strong className="font-bold">{nl.email}</strong>
          {labels.length ? ` sobre ${labels.join(', ').replace(/, ([^,]*)$/, ' y $1')}.` : '.'}
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
          <Button variant={dark ? 'light' : 'secondary'} onClick={() => { setTopics(nl.topics); setEditing(true) }}>
            Cambiar temas
          </Button>
          <button onClick={nl.unsubscribe} disabled={nl.saving} className={`font-serif text-lg italic transition hover:underline disabled:opacity-40 ${muted}`}>
            {nl.saving ? 'Dándote de baja…' : 'Darme de baja'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col justify-center">
      <p className={`text-[11px] font-bold uppercase tracking-[0.2em] ${muted}`}>¿Sobre qué quieres que te escribamos?</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {TOPICS.map((t) => (
          <label key={t.id} className="cursor-pointer">
            <input type="checkbox" className="peer sr-only" checked={topics.includes(t.id)} onChange={() => toggle(t.id)} />
            <span
              className={`inline-block rounded-full px-4 py-2 text-xs transition peer-focus-visible:ring-2 ${
                dark
                  ? 'text-paper/70 ring-1 ring-paper/30 hover:ring-paper/60 peer-checked:bg-paper peer-checked:text-forest'
                  : 'text-forest/70 ring-1 ring-forest/30 hover:ring-forest/60 peer-checked:bg-forest peer-checked:text-paper'
              }`}
            >
              {t.label}
            </span>
          </label>
        ))}
      </div>
      <div className={`mt-8 flex flex-wrap items-center gap-x-6 gap-y-4 border-t pt-6 ${dark ? 'border-paper/15' : 'border-forest/15'}`}>
        <Button variant={dark ? 'light' : 'primary'} disabled={!topics.length || nl.saving} onClick={save}>
          {nl.saving ? 'Guardando…' : editing ? 'Guardar temas' : 'Suscribirme'}
        </Button>
        {editing ? (
          <button onClick={() => setEditing(false)} className={`font-serif text-lg italic hover:underline ${muted}`}>Cancelar</button>
        ) : (
          <p className={`text-xs ${muted}`}>Con tu email {nl.email}. Puedes darte de baja cuando quieras.</p>
        )}
      </div>
    </div>
  )
}

// Banda verde para la portada del área de usuario
export function NewsletterBand() {
  return (
    <section className="grid gap-10 rounded-[2rem] bg-forest p-8 text-paper sm:p-12 xl:grid-cols-2 xl:gap-16">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-paper/60">Newsletter</p>
        <h2 className="mt-4 font-serif text-5xl font-normal normal-case leading-[0.95] tracking-normal xl:text-6xl">
          Cartas desde el <em>bosque</em>
        </h2>
        <p className="mt-5 max-w-md font-serif text-xl italic leading-snug text-paper/70">{PITCH}</p>
      </div>
      <NewsletterForm dark />
    </section>
  )
}

// Apartado dentro de Perfil
export function NewsletterSection() {
  return (
    <div id="newsletter" className="scroll-mt-24">
      <Section title="Newsletter" description={`${NAME}, una vez al mes.`}>
        <NewsletterForm />
      </Section>
    </div>
  )
}
