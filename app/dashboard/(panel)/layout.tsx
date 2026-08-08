import { DashboardLayout } from 'views/dashboard'

// El panel del dealer depende de la sesión/tenant por request; no se prerenderiza.
export const dynamic = 'force-dynamic'

/**
 * Layout del panel del dealer. El middleware ya garantizó sesión (DashboardAuthMiddleware);
 * aquí se carga el profile/dealer del usuario y se provee el shell (nav lateral, etc.).
 */
export default function Layout ({ children }: { children: React.ReactNode }) {
  return <DashboardLayout>{children}</DashboardLayout>
}
