// Secciones del área de usuario (menú lateral y tarjetas de inicio comparten numeración)
export const nav = [
  { to: '/', label: 'Inicio', end: true },
  { to: '/entrada', label: 'Mi entrada' },
  { to: '/perfil', label: 'Perfil' },
  { to: '/coches', label: 'Mis coches' },
  { to: '/historial', label: 'Historial' },
  { to: '/ayuda', label: 'Ayuda' },
] as const

export const navNumber = (to: string) => String(nav.findIndex((n) => n.to === to) + 1).padStart(2, '0')
