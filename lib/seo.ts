/**
 * ¿Este ambiente debe aparecer en buscadores?
 *
 * Solo producción. QA (`test.vendra.com.mx`) y los previews de Vercel sirven el
 * mismo contenido que el sitio real, así que indexarlos crearía duplicados que
 * compiten contra los storefronts de los dealers.
 *
 * El default es NO indexar: la variable se pone a mano y solo en el proyecto de
 * producción. Si se olvida, el ambiente queda cerrado, que es el error barato.
 */
export function isIndexable (): boolean {
  return process.env.ALLOW_INDEXING === 'true'
}
