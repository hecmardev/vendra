export type CarStatus = 'disponible' | 'vendido' | 'apartado'

/** Modelo de auto para la UI (alineado a la tabla `cars`). */
export interface Car {
  id: string
  slug: string
  brand: string
  model: string
  year: number
  price: number
  mileage: number
  transmission: 'Automática' | 'Manual' | 'CVT'
  fuel: 'Gasolina' | 'Diésel' | 'Híbrido' | 'Eléctrico'
  color: string
  bodyType: 'SUV' | 'Sedán' | 'Pickup' | 'Hatchback' | 'Coupé'
  location: string
  status: CarStatus
  description?: string
  /** URL(s) de foto; vacío = placeholder. */
  images: string[]
}
