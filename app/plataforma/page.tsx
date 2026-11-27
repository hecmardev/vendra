import type { Metadata } from 'next'
import { Landing } from 'views/platform'

export const metadata: Metadata = {
  title: 'Vendra — Tu sitio para vender autos',
  description: 'Plataforma para vendedores de autos: tu propio sitio con tu dominio, tu inventario y tus clientes potenciales en un solo panel.',
  // La URL pública es la raíz del dominio, aunque por dentro sea /plataforma.
  alternates: { canonical: '/' }
}

/**
 * Landing de la plataforma (vendra.com.mx). El middleware reescribe el dominio de
 * plataforma a /plataforma/*; la URL pública sigue siendo la raíz del dominio.
 */
export default function Page () {
  return <Landing />
}
