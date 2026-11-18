import { queryOptions } from '@tanstack/react-query'
import { api } from './api'
import type { Car } from './types'

// Consultas compartidas entre páginas (misma clave = misma caché)
export const carsQuery = queryOptions({
  queryKey: ['cars'],
  queryFn: () => api<{ cars: Car[] }>('/cars').then((r) => r.cars),
})
