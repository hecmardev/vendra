import { Sidebar } from './components/Sidebar'
import { getCurrentDealer } from '@/services/dealers'

/**
 * Shell del panel del dealer (nav lateral + contenido).
 *
 * El nombre sale de la sesión, no del tenant del dominio: al panel se entra
 * autenticado y es el perfil quien dice de qué dealer es.
 */
export async function DashboardLayout ({ children }: { children: React.ReactNode }) {
  const dealer = await getCurrentDealer()
  return (
    // En desktop: altura fija (h-dvh) y el scroll vive SOLO en <main>, no en el
    // body. Así la barra lateral queda siempre completa. La scrollbar aparece
    // solo cuando el contenido de verdad desborda (sin carril reservado).
    <div className="flex min-h-dvh flex-col bg-background lg:h-dvh lg:flex-row lg:overflow-hidden">
      <Sidebar dealerName={dealer?.name} />
      <main className="flex-1 overflow-x-hidden overflow-y-auto">
        <div className="mx-auto max-w-5xl p-5 md:p-8">{children}</div>
      </main>
    </div>
  )
}
