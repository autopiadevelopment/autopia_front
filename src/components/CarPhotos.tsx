import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useState, type DragEvent } from 'react'
import { createPortal } from 'react-dom'
import { api, ApiError } from '../lib/api'
import { carsQuery } from '../lib/queries'
import type { Car } from '../lib/types'
import { cx } from './styles'
import { ErrorMessage } from './ui'

export const MAX_PHOTOS = 10 // igual que en el back (car.service.js)
const MAX_SIDE = 2400 // px: suficiente para verse a pantalla completa
const MAX_BYTES = 15 * 1024 * 1024 // límite del back

const pad = (n: number) => String(n).padStart(2, '0')

// ── Galería (ficha) ─────────────────────────────────────────────────────────

// Portada a sangre arriba de la tarjeta + tira de miniaturas. Al pulsar, se abre el visor.
export function CarGallery({ car, onAdd }: { car: Car; onAdd: () => void }) {
  const photos = car.photos ?? []
  const [active, setActive] = useState(0)
  const [open, setOpen] = useState<number | null>(null)
  const current = Math.min(active, photos.length - 1)

  if (!photos.length) {
    return (
      <button
        onClick={onAdd}
        className="group -mx-8 -mt-8 flex aspect-[16/6] flex-col items-center justify-center gap-3 rounded-t-3xl border-b border-forest/10 bg-forest/[0.04] transition hover:bg-forest/[0.07]"
      >
        <span className="font-serif text-2xl italic text-forest/45">Aún sin fotografías</span>
        <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-forest/50 group-hover:text-forest">Añadir fotos →</span>
      </button>
    )
  }

  return (
    <div className="-mx-8 -mt-8">
      <button
        onClick={() => setOpen(current)}
        className="group relative block aspect-[16/10] w-full overflow-hidden rounded-t-3xl bg-forest/10"
        aria-label="Ver fotos a pantalla completa"
      >
        <img
          key={photos[current]}
          src={photos[current]}
          alt={`${car.brand} ${car.model}`}
          decoding="async"
          className="h-full w-full animate-fade object-cover transition duration-[1.2s] ease-out group-hover:scale-[1.03]"
        />
        <span className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-forest/60 to-transparent" />
        <span className="pointer-events-none absolute bottom-4 left-6 font-serif text-lg italic text-paper">
          {pad(current + 1)} <span className="text-paper/60">/ {pad(photos.length)}</span>
        </span>
        <span className="pointer-events-none absolute bottom-5 right-6 text-[10px] font-bold uppercase tracking-[0.25em] text-paper/0 transition group-hover:text-paper/90">
          Ampliar ↗
        </span>
      </button>

      {photos.length > 1 && (
        <div className="flex gap-2 overflow-x-auto px-8 pt-4">
          {photos.map((p, i) => (
            <button
              key={p}
              onClick={() => setActive(i)}
              aria-label={`Foto ${i + 1}`}
              className={cx(
                'h-14 w-20 shrink-0 overflow-hidden rounded-lg transition',
                i === current ? 'opacity-100 ring-1 ring-forest ring-offset-2 ring-offset-paper' : 'opacity-50 hover:opacity-90',
              )}
            >
              <img src={p} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {open !== null && <Lightbox car={car} start={open} onClose={(i) => { setActive(i); setOpen(null) }} />}
    </div>
  )
}

// ── Visor a pantalla completa ───────────────────────────────────────────────

function Lightbox({ car, start, onClose }: { car: Car; start: number; onClose: (index: number) => void }) {
  const photos = car.photos ?? []
  const [i, setI] = useState(start)
  const go = (d: number) => setI((n) => (n + d + photos.length) % photos.length)
  const close = () => onClose(i)

  // Teclado (Esc, ← →) y sin scroll de fondo mientras está abierto
  const keys = useRef({ go, close })
  useEffect(() => {
    keys.current = { go, close }
  })
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') keys.current.close()
      if (e.key === 'ArrowLeft') keys.current.go(-1)
      if (e.key === 'ArrowRight') keys.current.go(1)
    }
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = overflow
      window.removeEventListener('keydown', onKey)
    }
  }, [])

  // Deslizar en móvil
  const touchX = useRef<number | null>(null)

  const arrow = 'flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-lg ring-1 ring-paper/30 transition hover:bg-paper hover:text-forest'

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Fotos de ${car.brand} ${car.model}`}
      className="fixed inset-0 z-50 flex animate-fade flex-col bg-forest/95 text-paper backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && close()}
    >
      <header className="flex items-start justify-between gap-6 px-6 py-6 sm:px-10">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-paper/60">{car.brand}</p>
          <p className="mt-1 font-serif text-3xl italic leading-none">{car.model}</p>
        </div>
        <div className="flex items-center gap-6">
          <span className="font-serif text-xl italic">
            {pad(i + 1)} <span className="text-paper/50">/ {pad(photos.length)}</span>
          </span>
          <button onClick={close} className="text-[11px] font-bold uppercase tracking-[0.25em] text-paper/70 hover:text-paper">
            Cerrar ✕
          </button>
        </div>
      </header>

      <div
        className="flex min-h-0 flex-1 items-center justify-center gap-6 px-4 sm:px-10"
        onClick={(e) => e.target === e.currentTarget && close()}
        onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
        onTouchEnd={(e) => {
          if (touchX.current === null) return
          const dx = e.changedTouches[0].clientX - touchX.current
          if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1)
          touchX.current = null
        }}
      >
        {photos.length > 1 && <button onClick={() => go(-1)} className={cx(arrow, 'hidden sm:flex')} aria-label="Anterior">←</button>}
        <img
          key={photos[i]}
          src={photos[i]}
          alt={`${car.brand} ${car.model}, foto ${i + 1}`}
          className="max-h-full min-h-0 max-w-full animate-rise rounded-xl object-contain shadow-2xl shadow-black/40"
        />
        {photos.length > 1 && <button onClick={() => go(1)} className={cx(arrow, 'hidden sm:flex')} aria-label="Siguiente">→</button>}
      </div>

      {photos.length > 1 && (
        <div className="flex justify-center gap-2 overflow-x-auto px-6 py-6">
          {photos.map((p, n) => (
            <button
              key={p}
              onClick={() => setI(n)}
              aria-label={`Foto ${n + 1}`}
              className={cx('h-12 w-16 shrink-0 overflow-hidden rounded-md transition', n === i ? 'opacity-100 ring-1 ring-paper ring-offset-2 ring-offset-forest' : 'opacity-40 hover:opacity-80')}
            >
              <img src={p} alt="" loading="lazy" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>,
    document.body,
  )
}

// ── Gestión (formulario de edición) ─────────────────────────────────────────

// Reduce las fotos grandes a JPEG de MAX_SIDE px antes de subirlas (las del móvil pesan 5-10 MB)
async function prepare(file: File): Promise<Blob> {
  if (file.type === 'image/gif' || (file.size <= 2_000_000 && /^image\/(jpeg|webp)$/.test(file.type))) return file
  try {
    const bmp = await createImageBitmap(file) // respeta la orientación EXIF
    const scale = Math.min(1, MAX_SIDE / Math.max(bmp.width, bmp.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(bmp.width * scale)
    canvas.height = Math.round(bmp.height * scale)
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = '#fff' // fondo para PNG con transparencia
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(bmp, 0, 0, canvas.width, canvas.height)
    bmp.close()
    return (await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/jpeg', 0.86))) ?? file
  } catch {
    return file // el navegador no sabe leerla (p. ej. HEIC fuera de Safari): se manda tal cual
  }
}

const usePutCar = () => {
  const qc = useQueryClient()
  return (car: Car) => qc.setQueryData<Car[]>(carsQuery.queryKey, (cars) => cars?.map((c) => (c.id === car.id ? car : c)))
}

export function PhotoManager({ car }: { car: Car }) {
  const photos = car.photos ?? []
  const putCar = usePutCar()
  const input = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState<{ previews: string[]; done: number } | null>(null)
  const [uploadError, setUploadError] = useState<unknown>(null)
  const [dragOver, setDragOver] = useState(false)
  const free = MAX_PHOTOS - photos.length

  const reorder = useMutation({
    mutationFn: (next: string[]) => api<{ car: Car }>(`/cars/${car.id}/photos`, { method: 'PUT', body: { photos: next } }),
    onSuccess: ({ car }) => putCar(car),
  })
  const busy = !!uploading || reorder.isPending

  async function upload(list: FileList | File[]) {
    const files = [...list].filter((f) => f.type.startsWith('image/') || /\.(heic|heif)$/i.test(f.name)).slice(0, free)
    if (!files.length) return
    setUploadError(null)
    const previews = files.map((f) => URL.createObjectURL(f))
    setUploading({ previews, done: 0 })
    // De una en una: cada respuesta trae el coche actualizado y la foto aparece en su sitio
    for (const [n, file] of files.entries()) {
      try {
        const blob = await prepare(file)
        if (blob.size > MAX_BYTES) throw new ApiError(413, `«${file.name}» pesa demasiado (máx. 15 MB)`)
        const res = await api<{ car: Car }>(`/cars/${car.id}/photos`, {
          method: 'POST',
          body: blob.type ? blob : new Blob([blob], { type: 'image/heic' }),
        })
        putCar(res.car)
      } catch (err) {
        setUploadError(err)
        // Una foto ilegible o demasiado grande no corta las demás; sin conexión, sesión caducada… sí
        if (!(err instanceof ApiError) || ![400, 413].includes(err.status)) break
      }
      setUploading({ previews, done: n + 1 })
    }
    previews.forEach(URL.revokeObjectURL)
    setUploading(null)
  }

  const move = (from: number, to: number) => {
    const next = [...photos]
    next.splice(to, 0, ...next.splice(from, 1))
    reorder.mutate(next)
  }
  const removeAt = (i: number) => confirm('¿Quitar esta foto de la ficha?') && reorder.mutate(photos.filter((_, n) => n !== i))

  const onDrop = (e: DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    if (!busy && free > 0) upload(e.dataTransfer.files)
  }

  const action = 'text-[10px] font-bold uppercase tracking-[0.2em] text-forest/50 transition hover:text-forest disabled:pointer-events-none disabled:opacity-30'

  return (
    <div className="space-y-4 sm:col-span-2">
      <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 xl:grid-cols-5">
        {photos.map((p, i) => (
          <figure key={p} className={cx('transition', reorder.isPending && 'opacity-60')}>
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-forest/10">
              <img src={p} alt={`Foto ${i + 1}`} loading="lazy" decoding="async" className="h-full w-full object-cover" />
              {i === 0 && (
                <span className="absolute left-3 top-3 rounded-full bg-paper/90 px-3 py-1 text-[9px] font-bold uppercase tracking-[0.2em] text-forest">
                  Portada
                </span>
              )}
              <span className="absolute bottom-2 right-3 font-serif text-sm italic text-paper drop-shadow">{pad(i + 1)}</span>
            </div>
            <figcaption className="mt-2 flex items-center justify-between gap-2">
              <span className="flex gap-3">
                <button type="button" className={action} disabled={busy || i === 0} onClick={() => move(i, i - 1)} aria-label="Mover a la izquierda">←</button>
                <button type="button" className={action} disabled={busy || i === photos.length - 1} onClick={() => move(i, i + 1)} aria-label="Mover a la derecha">→</button>
                {i > 0 && <button type="button" className={action} disabled={busy} onClick={() => move(i, 0)}>Portada</button>}
              </span>
              <button type="button" className={cx(action, 'hover:text-red-800')} disabled={busy} onClick={() => removeAt(i)}>Quitar</button>
            </figcaption>
          </figure>
        ))}

        {uploading?.previews.slice(uploading.done).map((p) => (
          <div key={p} className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-forest/10">
            <img src={p} alt="" className="h-full w-full animate-pulse object-cover opacity-40" />
            <span className="absolute inset-0 flex items-center justify-center font-serif text-lg italic text-forest">Subiendo…</span>
          </div>
        ))}

        {free > 0 && !uploading && (
          <button
            type="button"
            disabled={busy}
            onClick={() => input.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            className={cx(
              'flex aspect-[4/3] flex-col items-center justify-center gap-2 rounded-2xl border border-dashed transition',
              dragOver ? 'border-forest bg-forest/[0.07]' : 'border-forest/30 hover:border-forest/60 hover:bg-forest/[0.04]',
            )}
          >
            <span className="font-serif text-3xl italic leading-none text-forest/60">+</span>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-forest/60">Añadir fotos</span>
            <span className="text-[10px] text-forest/40">o arrástralas aquí</span>
          </button>
        )}
      </div>

      <input
        ref={input}
        type="file"
        accept="image/*,.heic,.heif"
        multiple
        hidden
        onChange={(e) => {
          if (e.target.files) upload(e.target.files)
          e.target.value = ''
        }}
      />

      <p className="text-xs text-forest/45">
        {uploading
          ? `Subiendo ${Math.min(uploading.done + 1, uploading.previews.length)} de ${uploading.previews.length}…`
          : `${photos.length}/${MAX_PHOTOS} fotos · La primera es la portada · Los cambios en las fotos se guardan al momento`}
      </p>
      <ErrorMessage error={uploadError ?? reorder.error} />
    </div>
  )
}
