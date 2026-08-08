import { redirect } from 'next/navigation'
import { AdminShell } from 'views/admin/components/AdminShell'
import { getPlatformAdmin } from '@/services/admin'

// El panel se valida por sesión en CADA request; nunca se prerenderiza estático.
export const dynamic = 'force-dynamic'

/**
 * Guard del panel de plataforma. Se valida en el server en CADA request: un
 * dealer con sesión válida pero fuera de PLATFORM_ADMIN_EMAILS no entra.
 */
export default async function Layout ({ children }: { children: React.ReactNode }) {
  const admin = await getPlatformAdmin()
  if (!admin) redirect('/admin/login')

  return <AdminShell email={admin.email}>{children}</AdminShell>
}
