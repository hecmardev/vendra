import { Sidebar } from './components/Sidebar'

/**
 * Shell del panel del dealer (nav lateral + contenido).
 * TODO(impl): cargar profile/dealer del usuario autenticado y pasar su nombre.
 */
export function DashboardLayout ({ children }: { children: React.ReactNode }) {
  return (
    // En desktop: altura fija (h-dvh) y el scroll vive SOLO en <main>, no en el
    // body. Así la barra lateral queda siempre completa. La scrollbar aparece
    // solo cuando el contenido de verdad desborda (sin carril reservado).
    <div className="flex min-h-dvh flex-col bg-background lg:h-dvh lg:flex-row lg:overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-x-hidden overflow-y-auto">
        <div className="mx-auto max-w-5xl p-5 md:p-8">{children}</div>
      </main>
    </div>
  )
}
