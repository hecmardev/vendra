import type { Car } from '@/interfaces/car'

/**
 * Datos mock para maquetación (mientras se conecta Supabase). No usar en prod:
 * el catálogo real vendrá de services/cars.ts filtrado por dealer_id.
 *
 * Fotos de demo: set curado de Unsplash (autos, HD, recorte 4:3). Placeholder
 * de maquetación — se reemplazan por Supabase Storage al conectar datos reales.
 */
const carPhoto = (id: string) =>
  `https://images.unsplash.com/photo-${id}?w=640&h=480&fit=crop&q=80`

export const MOCK_CARS: Car[] = [
  {
    id: '1', slug: 'mazda-cx5-2022', brand: 'Mazda', model: 'CX-5 Grand Touring',
    year: 2022, price: 449900, mileage: 38000, transmission: 'Automática',
    fuel: 'Gasolina', color: 'Gris Meteoro', bodyType: 'SUV',
    location: 'CDMX', status: 'disponible', images: [carPhoto('1552519507-da3b142c6e3d')]
  },
  {
    id: '2', slug: 'toyota-corolla-2021', brand: 'Toyota', model: 'Corolla LE',
    year: 2021, price: 329900, mileage: 52000, transmission: 'CVT',
    fuel: 'Gasolina', color: 'Blanco', bodyType: 'Sedán',
    location: 'CDMX', status: 'disponible', images: [carPhoto('1494976388531-d1058494cdd8')]
  },
  {
    id: '3', slug: 'ford-ranger-2023', brand: 'Ford', model: 'Ranger XLT 4x4',
    year: 2023, price: 689900, mileage: 21000, transmission: 'Automática',
    fuel: 'Diésel', color: 'Azul', bodyType: 'Pickup',
    location: 'Estado de México', status: 'disponible', images: [carPhoto('1533473359331-0135ef1b58bf')]
  },
  {
    id: '4', slug: 'honda-civic-2020', brand: 'Honda', model: 'Civic Turbo',
    year: 2020, price: 358000, mileage: 61000, transmission: 'Automática',
    fuel: 'Gasolina', color: 'Rojo', bodyType: 'Sedán',
    location: 'CDMX', status: 'apartado', images: [carPhoto('1550355291-bbee04a92027')]
  },
  {
    id: '5', slug: 'nissan-kicks-2022', brand: 'Nissan', model: 'Kicks Advance',
    year: 2022, price: 379900, mileage: 29000, transmission: 'CVT',
    fuel: 'Gasolina', color: 'Naranja', bodyType: 'SUV',
    location: 'CDMX', status: 'disponible', images: [carPhoto('1502877338535-766e1452684a')]
  },
  {
    id: '6', slug: 'volkswagen-jetta-2021', brand: 'Volkswagen', model: 'Jetta Highline',
    year: 2021, price: 399000, mileage: 44000, transmission: 'Automática',
    fuel: 'Gasolina', color: 'Plata', bodyType: 'Sedán',
    location: 'Puebla', status: 'disponible', images: [carPhoto('1503376780353-7e6692767b70')]
  }
]

/** Galería de demo: varias fotos para la ficha (mientras no hay Storage real). */
export const MOCK_GALLERY: string[] = [
  carPhoto('1552519507-da3b142c6e3d'),
  carPhoto('1503376780353-7e6692767b70'),
  carPhoto('1502877338535-766e1452684a'),
  carPhoto('1494976388531-d1058494cdd8')
]

export function getMockCarBySlug (slug: string): Car | undefined {
  return MOCK_CARS.find((c) => c.slug === slug)
}

/** Autos similares (mismo tipo, distinto id). */
export function getSimilarCars (car: Car, limit = 3): Car[] {
  return MOCK_CARS.filter((c) => c.id !== car.id && c.bodyType === car.bodyType)
    .concat(MOCK_CARS.filter((c) => c.id !== car.id && c.bodyType !== car.bodyType))
    .slice(0, limit)
}
