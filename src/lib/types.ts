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
  role: 'participant' | 'visitor'
  car?: Pick<Car, 'id' | 'brand' | 'model' | 'year' | 'plate'> | null
}

export interface AuthResponse {
  user: User
  token: string
}
