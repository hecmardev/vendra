import { PageTransition } from '@/components/motion/PageTransition'

/**
 * template.tsx se re-monta en cada navegación (a diferencia de layout.tsx),
 * así que envuelve cada página con la animación de entrada.
 */
export default function Template ({ children }: { children: React.ReactNode }) {
  return <PageTransition>{children}</PageTransition>
}
