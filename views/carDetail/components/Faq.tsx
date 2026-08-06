import { ChevronDown } from 'lucide-react'
import { CAR_FAQ } from '@/constants/carDetailMock'

/** Preguntas frecuentes del modelo (acordeón accesible con <details>). */
export function Faq () {
  return (
    <section className="space-y-4">
      <h2 className="text-lg font-bold tracking-tight">Preguntas frecuentes</h2>
      <div className="divide-y rounded-xl border bg-card">
        {CAR_FAQ.map((f) => (
          <details key={f.q} className="group px-5">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 py-4 font-medium marker:hidden">
              {f.q}
              <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
            </summary>
            <p className="pb-4 text-sm text-muted-foreground">{f.a}</p>
          </details>
        ))}
      </div>
    </section>
  )
}
