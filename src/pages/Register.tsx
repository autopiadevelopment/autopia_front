import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { z } from 'zod'
import { useAuth } from '../auth/AuthContext'
import { Button, ErrorMessage, Field } from '../components/ui'

const schema = z
  .object({
    name: z.string().trim().min(1, 'Obligatorio').max(80),
    surname: z.string().trim().max(120),
    email: z.email('Email no válido'),
    password: z.string().min(8, 'Mínimo 8 caracteres').max(72, 'Máximo 72 caracteres'),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, { path: ['confirm'], message: 'Las contraseñas no coinciden' })
type Form = z.infer<typeof schema>

export default function Register() {
  const { register: signUp } = useAuth()
  const { register, handleSubmit, formState: { errors } } = useForm<Form>({ resolver: zodResolver(schema) })
  const mutation = useMutation({
    mutationFn: ({ confirm: _c, surname, ...d }: Form) => signUp({ ...d, ...(surname && { surname }) }),
  })

  return (
    <>
      <h1 className="font-serif text-5xl font-normal normal-case leading-none tracking-normal">
        Crea tu <em>cuenta</em>
      </h1>
      <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="mt-12 space-y-7" noValidate>
        <div className="grid gap-7 sm:grid-cols-2">
          <Field label="Nombre" autoComplete="given-name" error={errors.name?.message} {...register('name')} />
          <Field label="Apellidos" autoComplete="family-name" error={errors.surname?.message} {...register('surname')} />
        </div>
        <Field label="Email" type="email" autoComplete="email" error={errors.email?.message} {...register('email')} />
        <div className="grid gap-7 sm:grid-cols-2">
          <Field label="Contraseña" type="password" autoComplete="new-password" error={errors.password?.message} {...register('password')} />
          <Field label="Repítela" type="password" autoComplete="new-password" error={errors.confirm?.message} {...register('confirm')} />
        </div>
        <ErrorMessage error={mutation.error} />
        <Button type="submit" className="w-full" disabled={mutation.isPending}>Crear cuenta</Button>
      </form>
      <p className="mt-10 font-serif text-xl italic text-forest/70">
        ¿Ya tienes cuenta? <Link to="/login" className="not-italic font-sans text-sm font-bold underline">Inicia sesión</Link>
      </p>
    </>
  )
}
