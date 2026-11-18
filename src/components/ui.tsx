import {
  forwardRef,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react'
import { ApiError } from '../lib/api'
import { buttonClass, cx, type ButtonVariant } from './styles'

export function Button({
  variant = 'primary',
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  return <button {...props} className={buttonClass(variant, className)} />
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

const lineInput = (error?: string) =>
  cx(
    'mt-1 w-full border-0 border-b bg-transparent px-0 py-2 text-base outline-none transition placeholder:text-forest/30 focus:border-forest disabled:text-forest/50',
    error ? 'border-red-700' : 'border-forest/30',
  )

const FieldLabel = ({ label, hint }: { label: string; hint?: string }) => (
  <span className="flex items-baseline justify-between gap-4 text-[11px] font-bold uppercase tracking-[0.2em] text-forest/60">
    {label}
    {hint && <span className="font-normal normal-case tracking-normal text-forest/40">{hint}</span>}
  </span>
)

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string
  error?: string
  hint?: string
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(function TextArea(
  { label, error, hint, className, rows = 4, ...props },
  ref,
) {
  return (
    <label className="block">
      <FieldLabel label={label} hint={hint} />
      <textarea ref={ref} rows={rows} {...props} aria-invalid={!!error} className={cx(lineInput(error), 'resize-y leading-relaxed', className)} />
      {error && <span className="mt-1 block text-xs text-red-800">{error}</span>}
    </label>
  )
})

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  error?: string
  options: readonly string[]
  placeholder?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, error, options, placeholder = 'Sin indicar', className, ...props },
  ref,
) {
  return (
    <label className="block">
      <FieldLabel label={label} />
      <span className="relative block">
        <select ref={ref} {...props} aria-invalid={!!error} className={cx(lineInput(error), 'cursor-pointer appearance-none pr-8', className)}>
          <option value="">{placeholder}</option>
          {options.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
        <span aria-hidden className="pointer-events-none absolute right-1 top-1/2 -translate-y-1/2 text-sm text-forest/50">↓</span>
      </span>
      {error && <span className="mt-1 block text-xs text-red-800">{error}</span>}
    </label>
  )
})

// Etiqueta pequeña en mayúsculas espaciadas
export const Eyebrow = ({ children, className }: { children: ReactNode; className?: string }) => (
  <p className={cx('text-[11px] font-bold uppercase tracking-[0.3em] text-forest/60', className)}>{children}</p>
)

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
