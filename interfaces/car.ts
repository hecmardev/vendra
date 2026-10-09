export type CarStatus = 'borrador' | 'disponible' | 'vendido' | 'apartado'

/** Condición de la unidad (migración 0009). */
export type CarCondition = 'nuevo' | 'seminuevo' | 'demo'

/**
 * Las condiciones en el orden en que se ofrecen (formulario y filtros).
 * Nuevo primero: es el default de la base y del formulario.
 */
export const CAR_CONDITIONS: CarCondition[] = ['nuevo', 'seminuevo', 'demo']

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
  condition: CarCondition
  description?: string
  /** URL(s) de foto; vacío = placeholder. */
  images: string[]
}
