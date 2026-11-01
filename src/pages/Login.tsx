import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { z } from 'zod'
import { useAuth } from '../auth/AuthContext'
import { Button, ErrorMessage, Field } from '../components/ui'

const schema = z.object({
  email: z.email('Email no válido'),
  password: z.string().min(1, 'Introduce tu contraseña'),
})
type Form = z.infer<typeof schema>

export default function Login() {
  const { login } = useAuth()
  const { register, handleSubmit, formState: { errors } } = useForm<Form>({ resolver: zodResolver(schema) })
  const mutation = useMutation({ mutationFn: (d: Form) => login(d.email, d.password) })

  return (
    <>
      <h1 className="font-serif text-5xl font-normal normal-case leading-none tracking-normal">
        Bienvenido <em>de nuevo</em>
      </h1>
      <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="mt-12 space-y-8" noValidate>
        <Field label="Email" type="email" autoComplete="email" error={errors.email?.message} {...register('email')} />
        <Field label="Contraseña" type="password" autoComplete="current-password" error={errors.password?.message} {...register('password')} />
        <ErrorMessage error={mutation.error} />
        <Button type="submit" className="w-full" disabled={mutation.isPending}>Entrar</Button>
      </form>
      <p className="mt-10 font-serif text-xl italic text-forest/70">
        ¿Aún no tienes cuenta? <Link to="/registro" className="not-italic font-sans text-sm font-bold underline">Regístrate</Link>
      </p>
    </>
  )
}
