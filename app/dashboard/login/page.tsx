import { LoginView } from 'views/dashboard/login'

export const metadata = { title: 'Iniciar sesión — Panel' }

/** Login del panel (fuera del layout con sidebar). */
export default function Page () {
  return <LoginView />
}
