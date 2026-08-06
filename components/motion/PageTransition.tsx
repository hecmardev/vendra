'use client'

import { motion, useReducedMotion } from 'framer-motion'

/**
 * Animación de entrada por ruta. Se usa desde app/template.tsx, que Next.js
 * re-monta en cada navegación, disparando la transición. Respeta
 * prefers-reduced-motion.
 */
export function PageTransition ({ children }: { children: React.ReactNode }) {
  const reduce = useReducedMotion()
  if (reduce) return <>{children}</>

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  )
}
