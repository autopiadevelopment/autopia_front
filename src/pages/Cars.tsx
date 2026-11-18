import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, type ReactNode } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'
import { Button, Card, Empty, ErrorMessage, Eyebrow, Field, PageHeader, Select, Spinner, TextArea } from '../components/ui'
import { api } from '../lib/api'
import { carsQuery } from '../lib/queries'
import type { Car } from '../lib/types'

// ── Ficha: mismas columnas que Vehículos.csv ────────────────────────────────

const nf = new Intl.NumberFormat('es-ES')
const MAX_YEAR = new Date().getFullYear() + 1

type Spec = { key: keyof Car; label: string; format?: (n: number) => string }

const IDENTITY: Spec[] = [
  { key: 'year', label: 'Año' },
  { key: 'plate', label: 'Matrícula' },
  { key: 'color', label: 'Color' },
  { key: 'mileage', label: 'Kilómetros', format: (n) => `${nf.format(n)} km` },
]
const MECHANICS: Spec[] = [
  { key: 'engine', label: 'Motor' },
  { key: 'displacement', label: 'Cilindrada', format: (n) => `${nf.format(n)} cc` },
  { key: 'cylinders', label: 'Cilindros' },
  { key: 'power', label: 'Potencia', format: (n) => `${nf.format(n)} CV` },
  { key: 'gearbox', label: 'Caja de cambios' },
  { key: 'bodyType', label: 'Carrocería' },
]
// Campos que cuentan para "ficha completa" (marca y modelo siempre están)
const COMPLETABLE: (keyof Car)[] = [...IDENTITY, ...MECHANICS].map((s) => s.key).concat('condition', 'description')

// Valores tal y como aparecen en Airtable
const ENGINES = ['Atmosférico', 'Turbo', 'Supercargado', 'Eléctrico']
const GEARBOXES = ['Manual', 'Automático', 'Otra']
const BODY_TYPES = ['Coupé', 'Cabrio', 'Berlina 4 puertas', 'Berlina', 'Compacto', 'Familiar', 'SUV', 'Spyder', 'Motor central/trasero', 'Furgoneta', 'Moto', 'Otro']
const CONDITIONS = ['Original', 'Modificado', 'Restaurado/a']

const has = (v: unknown) => v !== undefined && v !== null && v !== ''

function SpecList({ car, specs }: { car: Car; specs: Spec[] }) {
  const shown = specs.filter((s) => has(car[s.key]))
  if (!shown.length) return null
  return (
    <dl className="grid grid-cols-2 gap-x-8 gap-y-5 sm:grid-cols-3">
      {shown.map((s) => {
        const v = car[s.key] as string | number
        return (
          <div key={s.key}>
            <dt className="text-[11px] uppercase tracking-[0.2em] text-forest/50">{s.label}</dt>
            <dd className="mt-1">{s.format && typeof v === 'number' ? s.format(v) : v}</dd>
          </div>
        )
      })}
    </dl>
  )
}

function CarView({ car, onEdit, onDelete, deleting }: { car: Car; onEdit: () => void; onDelete: () => void; deleting: boolean }) {
  const [expanded, setExpanded] = useState(false)
  const pct = Math.round((COMPLETABLE.filter((k) => has(car[k])).length / COMPLETABLE.length) * 100)
  const longStory = (car.description?.length ?? 0) > 260
  const hasMechanics = MECHANICS.some((s) => has(car[s.key]))

  return (
    <div className="flex h-full flex-col gap-8">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <Eyebrow>{car.brand}</Eyebrow>
          <h3 className="mt-2 break-words font-serif text-5xl font-normal normal-case leading-none tracking-normal">
            <em>{car.model}</em>
          </h3>
        </div>
        {car.condition && (
          <span className="shrink-0 rounded-full px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] ring-1 ring-forest/40">
            {car.condition}
          </span>
        )}
      </div>

      <SpecList car={car} specs={IDENTITY} />

      {hasMechanics && (
        <div className="border-t border-forest/15 pt-6">
          <Eyebrow className="mb-4">Mecánica</Eyebrow>
          <SpecList car={car} specs={MECHANICS} />
        </div>
      )}

      {car.description && (
        <figure className="border-l-2 border-forest/20 pl-5">
          <figcaption className="text-[11px] font-bold uppercase tracking-[0.3em] text-forest/60">Su historia</figcaption>
          <blockquote className={`mt-3 whitespace-pre-line font-serif text-xl italic leading-snug text-forest/80 ${expanded ? '' : 'line-clamp-4'}`}>
            {car.description}
          </blockquote>
          {longStory && (
            <button onClick={() => setExpanded((e) => !e)} className="mt-2 text-[11px] font-bold uppercase tracking-[0.2em] text-forest/60 hover:text-forest">
              {expanded ? 'Leer menos ↑' : 'Leer más ↓'}
            </button>
          )}
        </figure>
      )}

      <div className="mt-auto flex flex-wrap items-end justify-between gap-6 border-t border-forest/15 pt-6">
        <div className="flex gap-3">
          <Button variant="secondary" onClick={onEdit}>Editar</Button>
          <Button variant="danger" disabled={deleting} onClick={onDelete}>Eliminar</Button>
        </div>
        <div className="ml-auto text-right">
          {pct < 100 ? (
            <button onClick={onEdit} className="group text-right" title="Completa los datos que faltan">
              <span className="block text-[11px] font-bold uppercase tracking-[0.2em] text-forest/60 group-hover:text-forest">Ficha al {pct}% · Completar</span>
              <span className="ml-auto mt-2 block h-px w-32 bg-forest/15">
                <span className="block h-px bg-forest" style={{ width: `${pct}%` }} />
              </span>
            </button>
          ) : (
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-forest/60">Ficha completa</span>
          )}
          {car.vehicleId && <p className="mt-2 text-[10px] tracking-[0.15em] text-forest/35" title="ID Vehículo">{car.vehicleId}</p>}
        </div>
      </div>
    </div>
  )
}

// ── Formulario ──────────────────────────────────────────────────────────────

// '' → null. Los enteros admiten puntos de miles ("183.000"); la potencia, coma decimal.
const INT_KEYS = new Set<string>(['year', 'displacement', 'cylinders', 'mileage'])
const NUMBER_KEYS = new Set<string>([...INT_KEYS, 'power'])
const toNumber = (s: string, int: boolean) => {
  const t = s.trim().replace(/\s/g, '')
  if (!t) return null
  const n = int ? Number(t.replace(/\./g, '')) : Number(t.replace(',', '.'))
  return Number.isFinite(n) && n >= 0 && (!int || Number.isInteger(n)) ? n : NaN
}
const numberField = (int: boolean) =>
  z.string().refine((s) => !Number.isNaN(toNumber(s, int)), int ? 'Número entero' : 'Número no válido')

const text = (max: number) => z.string().trim().max(max, `Máximo ${max} caracteres`)
const schema = z.object({
  brand: text(60).min(1, 'Obligatorio'),
  model: text(120).min(1, 'Obligatorio'),
  year: z.string().trim().refine((s) => !s || (/^\d{4}$/.test(s) && +s >= 1885 && +s <= MAX_YEAR), `Año entre 1885 y ${MAX_YEAR}`),
  plate: text(25),
  color: text(120),
  mileage: numberField(true),
  engine: text(120),
  displacement: numberField(true),
  cylinders: numberField(true),
  power: numberField(false),
  gearbox: text(40),
  bodyType: text(60),
  condition: text(40),
  description: text(3000),
})
type Form = z.infer<typeof schema>
type Key = keyof Form

const toForm = (car?: Car): Form => {
  const s = (v?: string | number) => (v === undefined || v === null ? '' : String(v))
  return {
    brand: s(car?.brand), model: s(car?.model), year: s(car?.year), plate: s(car?.plate), color: s(car?.color),
    mileage: s(car?.mileage), engine: s(car?.engine), displacement: s(car?.displacement), cylinders: s(car?.cylinders),
    power: s(car?.power), gearbox: s(car?.gearbox), bodyType: s(car?.bodyType), condition: s(car?.condition),
    description: s(car?.description),
  }
}

// Al crear se omiten los vacíos. Al editar solo se mandan los campos tocados,
// y vacíos ('' en texto, null en números) para poder borrarlos.
const toPayload = (f: Form, dirty?: Partial<Record<Key, boolean>>) => {
  const out: Record<string, string | number | null> = {}
  for (const k of Object.keys(f) as Key[]) {
    if (dirty && !dirty[k]) continue
    const value = NUMBER_KEYS.has(k) ? toNumber(f[k], INT_KEYS.has(k)) : f[k].trim()
    if (!dirty && (value === '' || value === null)) continue
    out[k] = value
  }
  return out
}

// Si un coche trae un valor que no está en la lista, se mantiene como opción
const withCurrent = (options: string[], current?: string) => (current && !options.includes(current) ? [...options, current] : options)

const FormGroup = ({ title, children }: { title: string; children: ReactNode }) => (
  <fieldset className="grid gap-x-10 gap-y-8 sm:col-span-2 sm:grid-cols-2">
    <legend className="mb-6 w-full border-b border-forest/15 pb-3 text-[11px] font-bold uppercase tracking-[0.3em] text-forest/60">{title}</legend>
    {children}
  </fieldset>
)

function CarForm({ car, onDone }: { car?: Car; onDone: () => void }) {
  const qc = useQueryClient()
  const { register, handleSubmit, control, formState: { errors, dirtyFields, isDirty } } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: toForm(car),
  })
  const description = useWatch({ control, name: 'description' })
  const mutation = useMutation({
    mutationFn: (f: Form) =>
      car
        ? api(`/cars/${car.id}`, { method: 'PATCH', body: toPayload(f, dirtyFields) })
        : api('/cars', { method: 'POST', body: toPayload(f) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: carsQuery.queryKey })
      qc.invalidateQueries({ queryKey: ['ticket'] })
      onDone()
    },
  })

  return (
    <form onSubmit={handleSubmit((f) => mutation.mutate(f))} className="grid gap-y-12 sm:grid-cols-2" noValidate>
      <FormGroup title="Identificación">
        <Field label="Marca" error={errors.brand?.message} {...register('brand')} />
        <Field label="Modelo" error={errors.model?.message} {...register('model')} />
        <Field label="Año" inputMode="numeric" placeholder="1990" error={errors.year?.message} {...register('year')} />
        <Field label="Matrícula" error={errors.plate?.message} {...register('plate')} />
        <Field label="Color" error={errors.color?.message} {...register('color')} />
        <Field label="Kilómetros" inputMode="numeric" placeholder="95000" error={errors.mileage?.message} {...register('mileage')} />
      </FormGroup>

      <FormGroup title="Mecánica">
        <Field label="Motor" list="car-engines" placeholder="Atmosférico, Turbo…" error={errors.engine?.message} {...register('engine')} />
        <Field label="Cilindrada (cc)" inputMode="numeric" placeholder="2000" error={errors.displacement?.message} {...register('displacement')} />
        <Field label="Número de cilindros" inputMode="numeric" placeholder="4" error={errors.cylinders?.message} {...register('cylinders')} />
        <Field label="Potencia (CV)" inputMode="decimal" placeholder="190" error={errors.power?.message} {...register('power')} />
        <Select label="Caja de cambios" options={withCurrent(GEARBOXES, car?.gearbox)} error={errors.gearbox?.message} {...register('gearbox')} />
        <Field label="Tipo de carrocería" list="car-bodies" placeholder="Coupé, Cabrio…" error={errors.bodyType?.message} {...register('bodyType')} />
        <Select label="Estado de conservación" options={withCurrent(CONDITIONS, car?.condition)} error={errors.condition?.message} {...register('condition')} />
        <datalist id="car-engines">{ENGINES.map((o) => <option key={o} value={o} />)}</datalist>
        <datalist id="car-bodies">{BODY_TYPES.map((o) => <option key={o} value={o} />)}</datalist>
      </FormGroup>

      <FormGroup title="Historia">
        <div className="sm:col-span-2">
          <TextArea
            label="Historia personal y emocional"
            hint={`${description?.length ?? 0}/3000`}
            rows={6}
            placeholder="Cómo llegó a tu vida, qué te hace sentir, qué le has hecho…"
            error={errors.description?.message}
            {...register('description')}
          />
        </div>
      </FormGroup>

      <div className="space-y-3 sm:col-span-2">
        <ErrorMessage error={mutation.error} />
        <div className="flex gap-2">
          <Button type="submit" disabled={mutation.isPending || (!!car && !isDirty)}>{car ? 'Guardar' : 'Añadir coche'}</Button>
          <Button type="button" variant="secondary" onClick={onDone}>Cancelar</Button>
        </div>
      </div>
    </form>
  )
}

// ── Página ──────────────────────────────────────────────────────────────────

export default function Cars() {
  const qc = useQueryClient()
  const [editing, setEditing] = useState<string | 'new' | null>(null)
  const { data, isLoading, error } = useQuery(carsQuery)
  const remove = useMutation({
    mutationFn: (id: string) => api(`/cars/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: carsQuery.queryKey })
      qc.invalidateQueries({ queryKey: ['ticket'] })
    },
  })

  const count = data?.length
  return (
    <>
      <PageHeader
        eyebrow={count ? `Garaje · ${count} ${count === 1 ? 'coche' : 'coches'}` : 'Garaje'}
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
                <CarView
                  car={car}
                  onEdit={() => setEditing(car.id)}
                  deleting={remove.isPending}
                  onDelete={() => confirm(`¿Eliminar ${car.brand} ${car.model}?`) && remove.mutate(car.id)}
                />
              )}
            </Card>
          ))}
        </div>
      </div>
    </>
  )
}
