import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useEffect, useState, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { useAuth } from '../auth/AuthContext'
import { CodeInput } from '../components/CodeInput'
import { Button, ErrorMessage, Field } from '../components/ui'
import { api, ApiError } from '../lib/api'
import type { AccountStatus } from '../lib/types'

// Acceso sin contraseña de entrada: primero el email y, según quién sea, el camino que le toca.
//   active  → contraseña (o código si la ha olvidado)
//   pending → "ya nos conocemos" → código → crear contraseña
//   unknown → no está en la BBDD: no puede entrar

type Reason = 'claim' | 'reset'
type Step =
  | { name: 'email' }
  | { name: 'password' }
  | { name: 'welcome' }
  | { name: 'unknown' }
  | { name: 'code'; reason: Reason; resendIn: number }
  | { name: 'create'; reason: Reason; ticket: string }

const sendCode = (email: string) => api<{ resendIn: number }>('/auth/code', { method: 'POST', body: { email } })

export default function Access() {
  const [email, setEmail] = useState('')
  const [step, setStep] = useState<Step>({ name: 'email' })

  const restart = () => setStep({ name: 'email' })
  const toCode = (reason: Reason) => ({ resendIn }: { resendIn: number }) => setStep({ name: 'code', reason, resendIn })

  switch (step.name) {
    case 'email':
      return (
        <EmailStep
          defaultEmail={email}
          onFound={(found, status) => {
            setEmail(found)
            setStep(status === 'active' ? { name: 'password' } : status === 'pending' ? { name: 'welcome' } : { name: 'unknown' })
          }}
        />
      )
    case 'password':
      return <PasswordStep email={email} onChangeEmail={restart} onForgot={toCode('reset')} />
    case 'welcome':
      return <WelcomeStep email={email} onChangeEmail={restart} onSent={toCode('claim')} />
    case 'unknown':
      return <UnknownStep email={email} onChangeEmail={restart} />
    case 'code':
      return (
        <CodeStep
          email={email}
          resendIn={step.resendIn}
          onChangeEmail={restart}
          onVerified={(ticket) => setStep({ name: 'create', reason: step.reason, ticket })}
        />
      )
    case 'create':
      return <CreatePasswordStep email={email} reason={step.reason} ticket={step.ticket} onRestart={restart} />
  }
}

/* ───────────── Piezas comunes ───────────── */

function Stage({ eyebrow, title, accent, children }: { eyebrow: string; title: string; accent: string; children: ReactNode }) {
  return (
    <div className="motion-safe:animate-rise">
      <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-forest/60">{eyebrow}</p>
      <h1 className="mt-4 font-serif text-5xl font-normal normal-case leading-[1.05] tracking-normal">
        {title} <em>{accent}</em>
      </h1>
      {children}
    </div>
  )
}

const Lead = ({ children }: { children: ReactNode }) => (
  <p className="mt-6 font-serif text-2xl italic leading-snug text-forest/75">{children}</p>
)

const Body = ({ children }: { children: ReactNode }) => (
  <p className="mt-4 text-sm leading-relaxed text-forest/70">{children}</p>
)

function TextButton({ children, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      {...props}
      className="font-serif text-lg italic text-forest/60 underline-offset-4 transition hover:text-forest hover:underline disabled:cursor-wait disabled:opacity-50"
    >
      {children}
    </button>
  )
}

function EmailChip({ email, onChange }: { email: string; onChange: () => void }) {
  return (
    <div className="mt-8 flex items-center justify-between gap-4 border-y border-forest/15 py-3">
      <span className="truncate text-sm">{email}</span>
      <TextButton onClick={onChange}>Cambiar</TextButton>
    </div>
  )
}

// Para que los gestores de contraseñas asocien la contraseña a este email
const HiddenUsername = ({ email }: { email: string }) => (
  <input type="email" name="username" autoComplete="username" value={email} readOnly hidden />
)

function useCountdown(initial: number) {
  const [left, setLeft] = useState(initial)
  useEffect(() => {
    if (left <= 0) return
    const t = setTimeout(() => setLeft((s) => s - 1), 1000)
    return () => clearTimeout(t)
  }, [left])
  return [left, setLeft] as const
}

/* ───────────── 1 · Email ───────────── */

const emailSchema = z.object({ email: z.string().trim().toLowerCase().pipe(z.email('Introduce un email válido')) })
type EmailForm = z.infer<typeof emailSchema>

function EmailStep({ defaultEmail, onFound }: { defaultEmail: string; onFound: (email: string, status: AccountStatus) => void }) {
  const { register, handleSubmit, formState: { errors } } = useForm<EmailForm>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: defaultEmail },
  })
  const lookup = useMutation({
    mutationFn: ({ email }: EmailForm) => api<{ status: AccountStatus }>('/auth/lookup', { method: 'POST', body: { email } }),
    onSuccess: ({ status }, { email }) => onFound(email, status),
  })

  return (
    <Stage eyebrow="Área de usuario" title="Te damos la" accent="bienvenida">
      <Lead>Tus coches, tus ediciones y todo lo que has vivido en Autopia, en un solo lugar.</Lead>
      <form onSubmit={handleSubmit((d) => lookup.mutate(d))} className="mt-10 space-y-8" noValidate>
        <Field label="Email" type="email" autoComplete="email" autoFocus error={errors.email?.message} {...register('email')} />
        <ErrorMessage error={lookup.error} />
        <Button type="submit" className="w-full" disabled={lookup.isPending}>
          {lookup.isPending ? 'Un momento…' : 'Continuar'}
        </Button>
      </form>
      <Body>Si ya has estado en Autopia, te reconoceremos.</Body>
    </Stage>
  )
}

/* ───────────── 2a · Cuenta activa: contraseña ───────────── */

const passwordSchema = z.object({ password: z.string().min(1, 'Introduce tu contraseña') })
type PasswordForm = z.infer<typeof passwordSchema>

function PasswordStep({ email, onChangeEmail, onForgot }: { email: string; onChangeEmail: () => void; onForgot: (r: { resendIn: number }) => void }) {
  const { login } = useAuth()
  const { register, handleSubmit, formState: { errors } } = useForm<PasswordForm>({ resolver: zodResolver(passwordSchema) })
  const signIn = useMutation({ mutationFn: ({ password }: PasswordForm) => login(email, password) })
  const forgot = useMutation({ mutationFn: () => sendCode(email), onSuccess: onForgot })

  const error =
    signIn.error instanceof ApiError && signIn.error.status === 401
      ? new ApiError(401, 'La contraseña no es correcta.')
      : signIn.error

  return (
    <Stage eyebrow="Hola de nuevo" title="Qué alegría" accent="volver a verte">
      <EmailChip email={email} onChange={onChangeEmail} />
      <form onSubmit={handleSubmit((d) => signIn.mutate(d))} className="mt-10 space-y-8" noValidate>
        <HiddenUsername email={email} />
        <Field label="Contraseña" type="password" autoComplete="current-password" autoFocus error={errors.password?.message} {...register('password')} />
        <ErrorMessage error={error ?? forgot.error} />
        <Button type="submit" className="w-full" disabled={signIn.isPending}>
          {signIn.isPending ? 'Entrando…' : 'Entrar'}
        </Button>
      </form>
      <div className="mt-8 text-center">
        <TextButton onClick={() => forgot.mutate()} disabled={forgot.isPending}>
          {forgot.isPending ? 'Enviándote un código…' : '¿Has olvidado tu contraseña?'}
        </TextButton>
      </div>
    </Stage>
  )
}

/* ───────────── 2b · Ya vino a Autopia, pero sin contraseña ───────────── */

function WelcomeStep({ email, onChangeEmail, onSent }: { email: string; onChangeEmail: () => void; onSent: (r: { resendIn: number }) => void }) {
  const send = useMutation({ mutationFn: () => sendCode(email), onSuccess: onSent })

  return (
    <Stage eyebrow="Cuenta encontrada" title="Vaya, ya" accent="nos conocemos">
      <Lead>Parece que has venido a Autopia anteriormente y ya formas parte de nuestro registro.</Lead>
      <Body>
        Para ver tu área de usuario, crea una contraseña para tu cuenta. Antes te enviaremos un código a tu email
        para confirmar que eres tú.
      </Body>
      <EmailChip email={email} onChange={onChangeEmail} />
      <div className="mt-10 space-y-8">
        <ErrorMessage error={send.error} />
        <Button className="w-full" onClick={() => send.mutate()} disabled={send.isPending} autoFocus>
          {send.isPending ? 'Enviando…' : 'Enviarme el código'}
        </Button>
      </div>
    </Stage>
  )
}

/* ───────────── 2c · No está en la BBDD ───────────── */

function UnknownStep({ email, onChangeEmail }: { email: string; onChangeEmail: () => void }) {
  return (
    <Stage eyebrow="Sin registro" title="No te" accent="encontramos">
      <Lead>Este email no figura entre quienes han pasado por Autopia.</Lead>
      <Body>
        El área de usuario es para quienes ya han venido a alguna edición. Comprueba que está bien escrito o prueba con
        el email que usaste al inscribirte.
      </Body>
      <EmailChip email={email} onChange={onChangeEmail} />
      <div className="mt-10">
        <Button className="w-full" onClick={onChangeEmail} autoFocus>
          Probar con otro email
        </Button>
      </div>
    </Stage>
  )
}

/* ───────────── 3 · Código ───────────── */

function CodeStep({
  email,
  resendIn,
  onChangeEmail,
  onVerified,
}: {
  email: string
  resendIn: number
  onChangeEmail: () => void
  onVerified: (ticket: string) => void
}) {
  const [code, setCode] = useState('')
  const [left, setLeft] = useCountdown(resendIn)
  const verify = useMutation({
    mutationFn: (c: string) => api<{ ticket: string }>('/auth/code/verify', { method: 'POST', body: { email, code: c } }),
    onSuccess: ({ ticket }) => onVerified(ticket),
    onError: () => setCode(''),
  })
  const resend = useMutation({
    mutationFn: () => sendCode(email),
    onSuccess: (r) => {
      verify.reset()
      setCode('')
      setLeft(r.resendIn)
    },
  })
  const submit = (c: string) => !verify.isPending && verify.mutate(c)

  return (
    <Stage eyebrow="Verificación" title="Revisa tu" accent="correo">
      <Lead>Te hemos enviado un código de seis cifras. Caduca en 10 minutos.</Lead>
      <EmailChip email={email} onChange={onChangeEmail} />
      <form
        onSubmit={(e) => {
          e.preventDefault()
          if (code.length === 6) submit(code)
        }}
        className="mt-10 space-y-8"
        noValidate
      >
        <CodeInput
          value={code}
          onChange={(v) => {
            setCode(v)
            if (verify.isError) verify.reset()
          }}
          onComplete={submit}
          invalid={verify.isError}
          busy={verify.isPending}
          autoFocus
        />
        <ErrorMessage error={verify.error ?? resend.error} />
        <Button type="submit" className="w-full" disabled={code.length < 6 || verify.isPending}>
          {verify.isPending ? 'Comprobando…' : 'Confirmar'}
        </Button>
      </form>
      <p className="mt-8 text-center text-sm leading-relaxed text-forest/70">
        {resend.isSuccess && left > 0 ? 'Te hemos enviado un código nuevo.' : '¿No te ha llegado? Mira en la carpeta de spam.'}
        <br />
        {left > 0 ? (
          <span className="font-serif text-lg italic text-forest/50">
            Podrás pedir otro en {left} s
          </span>
        ) : (
          <TextButton onClick={() => resend.mutate()} disabled={resend.isPending}>
            {resend.isPending ? 'Enviando…' : 'Enviarme otro código'}
          </TextButton>
        )}
      </p>
    </Stage>
  )
}

/* ───────────── 4 · Crear contraseña ───────────── */

const createSchema = z
  .object({
    password: z.string().min(8, 'Mínimo 8 caracteres').max(72, 'Máximo 72 caracteres'),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, { path: ['confirm'], message: 'Las contraseñas no coinciden' })
type CreateForm = z.infer<typeof createSchema>

function CreatePasswordStep({
  email,
  reason,
  ticket,
  onRestart,
}: {
  email: string
  reason: Reason
  ticket: string
  onRestart: () => void
}) {
  const { completeAccess } = useAuth()
  const { register, handleSubmit, formState: { errors } } = useForm<CreateForm>({ resolver: zodResolver(createSchema) })
  const save = useMutation({
    mutationFn: ({ password }: CreateForm) => completeAccess({ ticket, password }),
  })
  const expired = save.error instanceof ApiError && save.error.status === 401

  const copy = {
    claim: {
      eyebrow: 'Último paso',
      title: 'Crea tu',
      accent: 'contraseña',
      lead: 'Email confirmado. Con ella entrarás en tu área de usuario a partir de ahora.',
      cta: 'Entrar en Autopia',
    },
    reset: {
      eyebrow: 'Nueva contraseña',
      title: 'Elige una',
      accent: 'contraseña nueva',
      lead: 'Email confirmado. Escoge una que no uses en ningún otro sitio.',
      cta: 'Guardar y entrar',
    },
  }[reason]

  return (
    <Stage eyebrow={copy.eyebrow} title={copy.title} accent={copy.accent}>
      <Lead>{copy.lead}</Lead>
      <form onSubmit={handleSubmit((d) => save.mutate(d))} className="mt-10 space-y-8" noValidate>
        <HiddenUsername email={email} />
        <div className="grid gap-8 sm:grid-cols-2">
          <Field label="Contraseña" type="password" autoComplete="new-password" autoFocus error={errors.password?.message} {...register('password')} />
          <Field label="Repítela" type="password" autoComplete="new-password" error={errors.confirm?.message} {...register('confirm')} />
        </div>
        <Body>Mínimo 8 caracteres.</Body>
        <ErrorMessage error={save.error} />
        {expired ? (
          <Button type="button" className="w-full" onClick={onRestart}>
            Volver a empezar
          </Button>
        ) : (
          <Button type="submit" className="w-full" disabled={save.isPending}>
            {save.isPending ? 'Un momento…' : copy.cta}
          </Button>
        )}
      </form>
    </Stage>
  )
}
