export const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(' ')

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'light'

// También sirve para dar aspecto de botón a enlaces (<a>, <Link>)
export const buttonClass = (variant: ButtonVariant = 'primary', className?: string) =>
  cx(
    'inline-flex items-center justify-center rounded-full px-7 py-3 text-xs font-bold uppercase tracking-widest transition disabled:cursor-not-allowed disabled:opacity-40',
    {
      primary: 'bg-forest text-paper hover:bg-forest/85',
      secondary: 'bg-transparent text-forest ring-1 ring-forest/40 hover:bg-forest/5',
      danger: 'bg-transparent text-red-800 ring-1 ring-red-800/50 hover:bg-red-800 hover:text-paper',
      // Sobre fondo verde
      light: 'bg-paper text-forest hover:bg-paper/85',
    }[variant],
    className,
  )
