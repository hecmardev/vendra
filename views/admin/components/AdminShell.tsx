import Link from 'next/link'
import { ShieldCheck, Building2, LogOut } from 'lucide-react'
import { adminLogoutAction } from '@/app/admin/login/actions'

/** Shell del panel de plataforma: cabecera, marca y salida. */
export function AdminShell ({ email, children }: { email: string; children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-secondary/30">
      <header className="border-b bg-primary text-primary-foreground">
        <div className="container flex h-14 items-center justify-between gap-4">
          <Link href="/admin" className="flex items-center gap-2 font-bold">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/20 bg-white/10">
              <ShieldCheck className="h-4 w-4" />
            </span>
            Vendra · Plataforma
          </Link>

          <div className="flex items-center gap-4">
            <Link
              href="/admin"
              className="hidden items-center gap-1.5 text-sm text-primary-foreground/80 transition-colors hover:text-primary-foreground sm:flex"
            >
              <Building2 className="h-4 w-4" /> Dealers
            </Link>
            <span className="hidden text-sm text-primary-foreground/60 md:inline">{email}</span>
            <form action={adminLogoutAction}>
              <button
                type="submit"
                className="flex items-center gap-1.5 rounded-md border border-white/20 px-2.5 py-1.5 text-sm transition-colors hover:bg-white/10"
              >
                <LogOut className="h-4 w-4" /> Salir
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="container py-8">{children}</main>
    </div>
  )
}
