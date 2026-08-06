import { Landing } from 'views/platform'

/**
 * Landing de la plataforma (vendra.com). El middleware reescribe el dominio de
 * plataforma a /plataforma/*; la URL pública sigue siendo la raíz del dominio.
 */
export default function Page () {
  return <Landing />
}
