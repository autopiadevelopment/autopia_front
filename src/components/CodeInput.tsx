import { useState } from 'react'

const LENGTH = 6

interface Props {
  value: string
  onChange: (value: string) => void
  onComplete?: (value: string) => void
  invalid?: boolean
  busy?: boolean
  autoFocus?: boolean
}

// Un único input real (pegar, autocompletar desde el SMS/email, borrar…) dibujado como seis casillas
export function CodeInput({ value, onChange, onComplete, invalid, busy, autoFocus }: Props) {
  const [focused, setFocused] = useState(false)
  const current = Math.min(value.length, LENGTH - 1)

  return (
    <div className={`relative ${invalid ? 'motion-safe:animate-shake' : ''}`}>
      <div className="grid grid-cols-6 gap-2 sm:gap-3" aria-hidden>
        {Array.from({ length: LENGTH }, (_, i) => {
          const active = focused && !busy && i === current
          const border = invalid
            ? 'border-red-700'
            : active
              ? 'border-forest'
              : value[i]
                ? 'border-forest/60'
                : 'border-forest/25'
          return (
            <div
              key={i}
              className={`flex h-16 items-end justify-center border-b-2 pb-2 font-serif text-4xl leading-none transition-colors duration-300 ${border} ${busy ? 'text-forest/40' : ''}`}
            >
              {value[i] ?? (active && <span className="mb-1 h-8 w-px animate-pulse bg-forest" />)}
            </div>
          )
        })}
      </div>
      <input
        value={value}
        onChange={(e) => {
          const next = e.target.value.replace(/\D/g, '').slice(0, LENGTH)
          onChange(next)
          if (next.length === LENGTH && next !== value) onComplete?.(next)
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        readOnly={busy}
        autoFocus={autoFocus}
        inputMode="numeric"
        autoComplete="one-time-code"
        spellCheck={false}
        aria-label="Código de verificación de 6 cifras"
        aria-invalid={invalid}
        className="absolute inset-0 h-full w-full cursor-text bg-transparent text-transparent caret-transparent outline-none selection:bg-transparent"
      />
    </div>
  )
}
