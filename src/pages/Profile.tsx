import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { useAuth } from '../auth/AuthContext'
import { Button, ErrorMessage, Field, PageHeader, Section } from '../components/ui'
import { api } from '../lib/api'
import type { User } from '../lib/types'

const profileSchema = z.object({
  name: z.string().trim().min(1, 'Obligatorio').max(80),
  surname: z.string().trim().max(120),
  phone: z.string().trim().max(30),
})
type ProfileForm = z.infer<typeof profileSchema>

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Obligatorio'),
  newPassword: z.string().min(8, 'Mínimo 8 caracteres').max(72, 'Máximo 72 caracteres'),
})
type PasswordForm = z.infer<typeof passwordSchema>

function ProfileCard({ user }: { user: User }) {
  const qc = useQueryClient()
  const [saved, setSaved] = useState(false)
  const { register, handleSubmit, formState: { errors, isDirty }, reset } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user.name, surname: user.surname ?? '', phone: user.phone ?? '' },
  })
  const mutation = useMutation({
    mutationFn: (d: ProfileForm) => api<{ user: User }>('/users/me', { method: 'PATCH', body: d }),
    onSuccess: ({ user }) => {
      qc.setQueryData(['me'], user)
      reset({ name: user.name, surname: user.surname ?? '', phone: user.phone ?? '' })
      setSaved(true)
    },
  })

  return (
    <Section title="Mis datos" description="Así te conocemos en Autopia.">
      <form onSubmit={handleSubmit((d) => { setSaved(false); mutation.mutate(d) })} className="grid gap-x-10 gap-y-8 sm:grid-cols-2" noValidate>
        <Field label="Email" value={user.email} disabled readOnly />
        <Field label="Teléfono" type="tel" autoComplete="tel" error={errors.phone?.message} {...register('phone')} />
        <Field label="Nombre" error={errors.name?.message} {...register('name')} />
        <Field label="Apellidos" error={errors.surname?.message} {...register('surname')} />
        <div className="space-y-3 sm:col-span-2">
          <ErrorMessage error={mutation.error} />
          {saved && !isDirty && <p className="text-sm text-forest font-semibold">Cambios guardados.</p>}
          <Button type="submit" disabled={!isDirty || mutation.isPending}>Guardar cambios</Button>
        </div>
      </form>
    </Section>
  )
}

function PasswordCard() {
  const [done, setDone] = useState(false)
  const { register, handleSubmit, reset, formState: { errors } } = useForm<PasswordForm>({ resolver: zodResolver(passwordSchema) })
  const mutation = useMutation({
    mutationFn: (d: PasswordForm) => api('/auth/change-password', { method: 'POST', body: d }),
    onSuccess: () => { reset(); setDone(true) },
  })

  return (
    <Section title="Contraseña" description="Elige una que no uses en otro sitio.">
      <form onSubmit={handleSubmit((d) => { setDone(false); mutation.mutate(d) })} className="grid gap-x-10 gap-y-8 sm:grid-cols-2" noValidate>
        <Field label="Contraseña actual" type="password" autoComplete="current-password" error={errors.currentPassword?.message} {...register('currentPassword')} />
        <Field label="Nueva contraseña" type="password" autoComplete="new-password" error={errors.newPassword?.message} {...register('newPassword')} />
        <div className="space-y-3 sm:col-span-2">
          <ErrorMessage error={mutation.error} />
          {done && <p className="text-sm text-forest font-semibold">Contraseña actualizada.</p>}
          <Button type="submit" variant="secondary" disabled={mutation.isPending}>Actualizar contraseña</Button>
        </div>
      </form>
    </Section>
  )
}

function DeleteAccountCard() {
  const { logout } = useAuth()
  const mutation = useMutation({ mutationFn: () => api('/users/me', { method: 'DELETE' }), onSuccess: logout })
  return (
    <Section title="Eliminar cuenta" description="Una decisión sin vuelta atrás.">
      <p className="mb-6 text-sm leading-relaxed text-forest/70">Al eliminar tu cuenta se borran también tus coches y tu historial. No se puede deshacer.</p>
      <ErrorMessage error={mutation.error} />
      <Button
        variant="danger"
        disabled={mutation.isPending}
        onClick={() => confirm('¿Seguro que quieres eliminar tu cuenta?') && mutation.mutate()}
      >
        Eliminar mi cuenta
      </Button>
    </Section>
  )
}

export default function Profile() {
  const { user } = useAuth()
  if (!user) return null
  return (
    <>
      <PageHeader eyebrow="Área de usuario" title="Hola," accent={user.name} />
      <ProfileCard key={user.id} user={user} />
      <PasswordCard />
      <DeleteAccountCard />
    </>
  )
}
