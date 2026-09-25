'use client'

import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

/**
 * Buscador del hero. Es un componente de cliente solo para poder omitir el
 * parámetro cuando va vacío: un formulario GET normal siempre manda todos sus
 * campos, así que "Buscar" sin escribir nada llevaba a `/autos?q=`, una URL
 * distinta de `/autos` con exactamente el mismo contenido.
 *
 * Se conserva `action="/autos"` a propósito: si el JavaScript no ha cargado, el
 * formulario sigue funcionando como siempre. Con JS, la URL queda limpia.
 */
export function HeroSearch () {
  const router = useRouter()

  return (
    <form
      action="/autos"
      onSubmit={(e) => {
        e.preventDefault()
        const q = String(new FormData(e.currentTarget).get('q') ?? '').trim()
        router.push(q ? `/autos?q=${encodeURIComponent(q)}` : '/autos')
      }}
      className="flex w-full items-center gap-2 rounded-xl border bg-card p-2 text-foreground shadow-lg shadow-black/20"
    >
      <div className="flex flex-1 items-center gap-2 pl-2">
        <Search className="h-5 w-5 shrink-0 text-muted-foreground" />
        <Input
          name="q"
          placeholder="Marca, modelo o palabra clave…"
          className="border-0 shadow-none focus-visible:ring-0"
        />
      </div>
      <Button type="submit" variant="cta" size="lg">Buscar</Button>
    </form>
  )
}
