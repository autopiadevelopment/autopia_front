export interface User {
  id: string
  email: string
  name: string
  surname?: string
  phone?: string
  createdAt: string
}

// Mismas columnas que Vehículos.csv (y que el modelo Car de Mongo)
export interface Car {
  id: string
  vehicleId?: string // ID Vehículo
  brand: string // Marca
  model: string // Modelo
  year?: number // Año
  plate?: string // Matrícula
  color?: string // Color
  displacement?: number // Cilindrada cc
  engine?: string // Motor
  cylinders?: number // Número de cilindros
  power?: number // Potencia CV
  gearbox?: string // Caja de cambios
  bodyType?: string // Tipo de carrocería
  condition?: string // Estado de conservación
  mileage?: number // Kilómetros
  description?: string // Historia personal y emocional
  photos?: string[] // URLs de las fotos (imgbb); la primera es la portada
}

export interface Participation {
  id: string
  year: number
  event?: string
  role: 'participant' | 'visitor'
  car?: Pick<Car, 'id' | 'brand' | 'model' | 'year' | 'plate'> | null
}

// unknown: no está en la BBDD · pending: ya vino a Autopia pero aún no tiene contraseña · active: entra con contraseña
export type AccountStatus = 'unknown' | 'pending' | 'active'

export interface CompleteAccess {
  ticket: string
  password: string
}

export interface AuthResponse {
  user: User
  token: string
}

export interface EventInfo {
  id: string // ID Evento (Eventos.csv)
  name: string
  year: number
  date: string // YYYY-MM-DD (primer día)
  endDate?: string // YYYY-MM-DD (último día, si dura más de uno)
  city: string
  province: string
  venue: string
  summary: string
  schedule: { time: string; title: string; text?: string }[]
  tips: string[]
}

// pending: preinscrito, el equipo aún no ha decidido · accepted: tiene plaza (y QR) · rejected: sin plaza
export type TicketStatus = 'pending' | 'accepted' | 'rejected'

// Prerregistro tal y como lo devuelve GET /users/me/preregistrations (uno por evento)
export interface Preregistration {
  id: string
  eventId?: string // ID Evento (Eventos.csv)
  event?: string
  year: number
  date?: string
  city?: string
  province?: string
  status: 'preregistered'
  createdAt: string
}

// Entrada tal y como la devuelve GET /users/me/tickets (tabla de entradas, una por evento).
// Va con un coche (no es el prerregistro, que no lleva coche); car es null si el usuario lo borró.
export interface TicketRecord {
  id: string
  eventId: string // ID Evento (Eventos.csv)
  event?: string
  year: number
  status: TicketStatus
  reviewedAt?: string
  code?: string
  gate?: string
  doorsOpen?: string
  car: Pick<Car, 'id' | 'brand' | 'model' | 'year' | 'plate'> | null
  createdAt: string
}

// Entrada del evento actual, lista para pintar
export interface Ticket {
  status: TicketStatus
  requestedAt: string // YYYY-MM-DD, cuándo se creó la entrada
  reviewedAt?: string // YYYY-MM-DD, cuándo se aceptó o rechazó
  code?: string // lo que codifica el QR; solo existe si está aceptada
  holder: string
  gate?: string
  doorsOpen?: string
  car: Pick<Car, 'brand' | 'model' | 'year' | 'plate'> | null
  event: EventInfo
}
