import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Button, Card, Empty, ErrorMessage, Field, PageHeader, Spinner } from '../components/ui'
import { api } from '../lib/api'
import type { Car } from '../lib/types'

const schema = z.object({
  brand: z.string().trim().min(1, 'Obligatorio').max(60),
  model: z.string().trim().min(1, 'Obligatorio').max(60),
  year: z.string().regex(/^(\d{4})?$/, 'Año de 4 cifras'),
  plate: z.string().trim().max(15),
  color: z.string().trim().max(40),
  description: z.string().trim().max(1000),
})
type Form = z.infer<typeof schema>

const empty: Form = { brand: '', model: '', year: '', plate: '', color: '', description: '' }

// Al crear, los campos vacíos se omiten. Al editar se mandan vacíos para poder borrarlos.
const toPayload = (f: Form, editing: boolean) => {
  const optional = {
    year: f.year ? Number(f.year) : null,
    plate: f.plate,
    color: f.color,
    description: f.description,
  }
  const filled = Object.fromEntries(Object.entries(optional).filter(([, v]) => v !== '' && v !== null))
  return { brand: f.brand, model: f.model, ...(editing ? optional : filled) }
}

function CarForm({ car, onDone }: { car?: Car; onDone: () => void }) {
  const qc = useQueryClient()
  const { register, handleSubmit, formState: { errors } } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: car
      ? { brand: car.brand, model: car.model, year: car.year?.toString() ?? '', plate: car.plate ?? '', color: car.color ?? '', description: car.description ?? '' }
      : empty,
  })
  const mutation = useMutation({
    mutationFn: (f: Form) =>
      car
        ? api(`/cars/${car.id}`, { method: 'PATCH', body: toPayload(f, true) })
        : api('/cars', { method: 'POST', body: toPayload(f, false) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['cars'] }); onDone() },
  })

  return (
    <form onSubmit={handleSubmit((f) => mutation.mutate(f))} className="grid gap-x-10 gap-y-8 sm:grid-cols-2" noValidate>
      <Field label="Marca" error={errors.brand?.message} {...register('brand')} />
      <Field label="Modelo" error={errors.model?.message} {...register('model')} />
      <Field label="Año" inputMode="numeric" error={errors.year?.message} {...register('year')} />
      <Field label="Matrícula" error={errors.plate?.message} {...register('plate')} />
      <Field label="Color" error={errors.color?.message} {...register('color')} />
      <Field label="Descripción" error={errors.description?.message} {...register('description')} />
      <div className="space-y-3 sm:col-span-2">
        <ErrorMessage error={mutation.error} />
        <div className="flex gap-2">
          <Button type="submit" disabled={mutation.isPending}>{car ? 'Guardar' : 'Añadir coche'}</Button>
          <Button type="button" variant="secondary" onClick={onDone}>Cancelar</Button>
        </div>
      </div>
    </form>
  )
}

export default function Cars() {
  const qc = useQueryClient()
  const [editing, setEditing] = useState<string | 'new' | null>(null)
  const { data, isLoading, error } = useQuery({
    queryKey: ['cars'],
    queryFn: () => api<{ cars: Car[] }>('/cars').then((r) => r.cars),
  })
  const remove = useMutation({
    mutationFn: (id: string) => api(`/cars/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cars'] }),
  })

  return (
    <>
      <PageHeader
        eyebrow="Garaje"
        title="Mis"
        accent="coches"
        action={editing !== 'new' && <Button onClick={() => setEditing('new')}>Añadir coche</Button>}
      />

      <div className="mt-12 space-y-8">
        {editing === 'new' && <Card title="Nuevo coche"><CarForm onDone={() => setEditing(null)} /></Card>}

        {isLoading && <Spinner />}
        <ErrorMessage error={error ?? remove.error} />
        {data?.length === 0 && editing !== 'new' && <Empty>Tu garaje está vacío. Añade tu primer coche.</Empty>}

        <div className="grid gap-8 2xl:grid-cols-2">
          {data?.map((car) => (
            <Card key={car.id} className={editing === car.id ? '2xl:col-span-2' : ''}>
              {editing === car.id ? (
                <CarForm car={car} onDone={() => setEditing(null)} />
              ) : (
                <div className="flex h-full flex-col justify-between gap-8">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-forest/60">{car.brand}</p>
                    <h3 className="mt-2 font-serif text-5xl font-normal normal-case leading-none tracking-normal">
                      <em>{car.model}</em>
                    </h3>
                    <dl className="mt-6 flex flex-wrap gap-x-10 gap-y-3 text-sm">
                      {car.year && <div><dt className="text-[11px] uppercase tracking-[0.2em] text-forest/50">Año</dt><dd>{car.year}</dd></div>}
                      {car.color && <div><dt className="text-[11px] uppercase tracking-[0.2em] text-forest/50">Color</dt><dd>{car.color}</dd></div>}
                      {car.plate && <div><dt className="text-[11px] uppercase tracking-[0.2em] text-forest/50">Matrícula</dt><dd>{car.plate}</dd></div>}
                    </dl>
                    {car.description && <p className="mt-6 font-serif text-xl italic leading-snug text-forest/75">{car.description}</p>}
                  </div>
                  <div className="flex gap-3">
                    <Button variant="secondary" onClick={() => setEditing(car.id)}>Editar</Button>
                    <Button
                      variant="danger"
                      disabled={remove.isPending}
                      onClick={() => confirm(`¿Eliminar ${car.brand} ${car.model}?`) && remove.mutate(car.id)}
                    >
                      Eliminar
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      </div>
    </>
  )
}
