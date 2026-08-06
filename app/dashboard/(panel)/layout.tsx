import { DashboardLayout } from 'views/dashboard'

/**
 * Layout del panel del dealer. El middleware ya garantizó sesión (DashboardAuthMiddleware);
 * aquí se carga el profile/dealer del usuario y se provee el shell (nav lateral, etc.).
 */
export default function Layout ({ children }: { children: React.ReactNode }) {
  return <DashboardLayout>{children}</DashboardLayout>
}
