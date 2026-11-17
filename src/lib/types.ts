export interface User {
  id: string
  email: string
  name: string
  surname?: string
  phone?: string
  createdAt: string
}

export interface Car {
  id: string
  brand: string
  model: string
  year?: number
  plate?: string
  color?: string
  description?: string
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
