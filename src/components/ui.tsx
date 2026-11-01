import { forwardRef, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode } from 'react'
import { ApiError } from '../lib/api'

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(' ')

export function Button({
  variant = 'primary',
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'danger' }) {
  const styles = {
    primary: 'bg-forest text-paper hover:bg-forest/85',
    secondary: 'bg-transparent text-forest ring-1 ring-forest/40 hover:bg-forest/5',
    danger: 'bg-transparent text-red-800 ring-1 ring-red-800/50 hover:bg-red-800 hover:text-paper',
  }[variant]
  return (
    <button
      {...props}
      className={cx(
        'inline-flex items-center justify-center rounded-full px-7 py-3 text-xs font-bold uppercase tracking-widest transition disabled:cursor-not-allowed disabled:opacity-40',
        styles,
        className,
      )}
    />
  )
}

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
}

// Campo minimalista: solo línea inferior
export const Field = forwardRef<HTMLInputElement, FieldProps>(function Field(
  { label, error, className, ...props },
  ref,
) {
  return (
    <label className="block">
      <span className="block text-[11px] font-bold uppercase tracking-[0.2em] text-forest/60">{label}</span>
      <input
        ref={ref}
        {...props}
        aria-invalid={!!error}
        className={cx(
          'mt-1 w-full border-0 border-b bg-transparent px-0 py-2 text-base outline-none transition placeholder:text-forest/30 focus:border-forest disabled:text-forest/50',
          error ? 'border-red-700' : 'border-forest/30',
          className,
        )}
      />
      {error && <span className="mt-1 block text-xs text-red-800">{error}</span>}
    </label>
  )
})

// Cabecera de página: etiqueta pequeña + título serif grande
export function PageHeader({
  eyebrow,
  title,
  accent,
  action,
}: {
  eyebrow: string
  title: string
  accent?: string
  action?: ReactNode
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-6 border-b border-forest/20 pb-10">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-forest/60">{eyebrow}</p>
        <h1 className="mt-3 font-serif text-5xl font-normal normal-case leading-none tracking-normal xl:text-7xl">
          {title} {accent && <em>{accent}</em>}
        </h1>
      </div>
      {action}
    </header>
  )
}

// Sección en dos columnas: título y descripción a la izquierda, contenido a la derecha
export function Section({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: ReactNode
}) {
  return (
    <section className="grid gap-8 border-b border-forest/15 py-12 xl:grid-cols-[20rem_1fr] xl:gap-16">
      <div>
        <h2 className="text-sm">{title}</h2>
        {description && <p className="mt-3 font-serif text-xl italic leading-snug text-forest/70">{description}</p>}
      </div>
      <div className="max-w-3xl">{children}</div>
    </section>
  )
}

// Tarjeta suave (formularios de acceso, elementos de lista)
export function Card({ title, children, className }: { title?: string; children: ReactNode; className?: string }) {
  return (
    <section className={cx('rounded-3xl bg-white/40 p-8 ring-1 ring-forest/10', className)}>
      {title && <h2 className="mb-6 text-sm">{title}</h2>}
      {children}
    </section>
  )
}

export function ErrorMessage({ error }: { error: unknown }) {
  if (!error) return null
  const message = error instanceof ApiError ? error.message : 'Algo ha ido mal. Inténtalo de nuevo.'
  const details = error instanceof ApiError ? error.details : undefined
  return (
    <div role="alert" className="rounded-xl bg-red-800/10 px-4 py-3 text-sm text-red-900">
      {message}
      {details && (
        <ul className="mt-1 list-disc pl-5">
          {details.map((d) => (
            <li key={d.field + d.message}>{d.field}: {d.message}</li>
          ))}
        </ul>
      )}
    </div>
  )
}

export const Spinner = () => (
  <p className="py-16 text-center font-serif text-2xl italic text-forest/60">Cargando…</p>
)

export const Empty = ({ children }: { children: ReactNode }) => (
  <p className="py-12 font-serif text-3xl italic leading-snug text-forest/50">{children}</p>
)
