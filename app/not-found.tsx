import Link from 'next/link'
import { Car, Home, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'

/** 404 estilizado. */
export default function NotFound () {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-primary p-8 text-center text-primary-foreground">
      <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-24 -top-24 h-80 w-80 rounded-full bg-cta/25 blur-3xl" />
      </div>
      <div className="relative flex flex-col items-center gap-4">
        <span className="flex h-14 w-14 items-center justify-center rounded-xl border border-white/20 bg-white/10 backdrop-blur">
          <Car className="h-7 w-7" />
        </span>
        <p className="text-6xl font-extrabold tracking-tight">404</p>
        <h1 className="text-xl font-semibold">Página no encontrada</h1>
        <p className="max-w-sm text-primary-foreground/70">
          La página que buscas no existe o se movió. Regresa al inicio o explora los autos.
        </p>
        <div className="mt-2 flex flex-wrap justify-center gap-3">
          <Button asChild variant="cta"><Link href="/"><Home className="h-4 w-4" /> Inicio</Link></Button>
          <Button asChild variant="outline" className="border-white/30 bg-transparent text-primary-foreground hover:bg-white/10 hover:text-primary-foreground">
            <Link href="/autos"><Search className="h-4 w-4" /> Ver autos</Link>
          </Button>
        </div>
      </div>
    </main>
  )
}
