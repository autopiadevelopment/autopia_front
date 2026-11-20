import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { useAuth } from '../auth/AuthContext'
import { NewsletterSection } from '../components/Newsletter'
import { Button, ErrorMessage, Field, PageHeader, Section } from '../components/ui'
import { api } from '../lib/api'
import type { User } from '../lib/types'
import { useHashScroll } from '../lib/useHashScroll'

const profileSchema = z.object({
  name: z.string().trim().min(1, 'Obligatorio').max(80),
  surname: z.string().trim().max(120),
  phone: z.string().trim().max(30),
})
type ProfileForm = z.infer<typeof profileSchema>

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

export default function Profile() {
  const { user } = useAuth()
  useHashScroll()
  if (!user) return null
  return (
    <>
      <PageHeader eyebrow="Área de usuario" title="Hola," accent={user.name} />
      <ProfileCard key={user.id} user={user} />
      <NewsletterSection />
    </>
  )
}
