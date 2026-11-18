import { useMemo } from 'react'
import { hash } from '../lib/hash'

// MOCK: dibuja un patrón con aspecto de QR (versión 3, 29×29) a partir del código,
// pero NO es escaneable. Cuando la entrada sea real, sustituir por un QR de verdad
// (p. ej. la librería `qrcode`, o la imagen que venga de la tabla de entradas).
const N = 29

function modules(value: string) {
  const grid: (boolean | null)[][] = Array.from({ length: N }, () => Array(N).fill(null))
  const set = (r: number, c: number, v: boolean) => {
    if (r >= 0 && r < N && c >= 0 && c < N) grid[r][c] = v
  }

  // Patrones de posición (esquinas) con su margen blanco
  const finder = (r0: number, c0: number) => {
    for (let r = -1; r <= 7; r++)
      for (let c = -1; c <= 7; c++) {
        const inside = r >= 0 && r <= 6 && c >= 0 && c <= 6
        const ring = r === 0 || r === 6 || c === 0 || c === 6
        const eye = r >= 2 && r <= 4 && c >= 2 && c <= 4
        set(r0 + r, c0 + c, inside && (ring || eye))
      }
  }
  finder(0, 0)
  finder(0, N - 7)
  finder(N - 7, 0)

  // Líneas de sincronización
  for (let i = 8; i < N - 8; i++) {
    set(6, i, i % 2 === 0)
    set(i, 6, i % 2 === 0)
  }

  // Patrón de alineación
  for (let r = -2; r <= 2; r++) for (let c = -2; c <= 2; c++) set(22 + r, 22 + c, Math.max(Math.abs(r), Math.abs(c)) !== 1)
  set(N - 8, 8, true)

  // Resto: pseudoaleatorio pero estable (mulberry32 sembrado con el código)
  let seed = hash(value)
  const rand = () => {
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }

  let d = ''
  for (let r = 0; r < N; r++)
    for (let c = 0; c < N; c++) {
      if (grid[r][c] === null) grid[r][c] = rand() < 0.5
      if (grid[r][c]) d += `M${c} ${r}h1v1h-1z`
    }
  return d
}

export function QrCode({ value, className }: { value: string; className?: string }) {
  const d = useMemo(() => modules(value), [value])
  return (
    <svg viewBox={`0 0 ${N} ${N}`} className={className} role="img" aria-label={`Código QR de la entrada ${value}`} shapeRendering="crispEdges">
      <path d={d} fill="currentColor" />
    </svg>
  )
}
