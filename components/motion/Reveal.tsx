'use client'

import { motion, useReducedMotion } from 'framer-motion'

/**
 * Revela su contenido al entrar en viewport (fade + rise). Respeta
 * prefers-reduced-motion (si está activo, renderiza sin animación).
 * `delay` permite escalonar (stagger) en grillas: delay={i * 0.06}.
 */
export function Reveal ({
  children,
  delay = 0,
  y = 16,
  className
}: {
  children: React.ReactNode
  delay?: number
  y?: number
  className?: string
}) {
  const reduce = useReducedMotion()

  if (reduce) return <div className={className}>{children}</div>

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      // `some` = basta con que asome cualquier parte. Con un umbral por
      // porcentaje (antes 0.2), un bloque más alto que la pantalla no puede
      // cumplirlo nunca y se queda invisible para siempre: le pasó al catálogo
      // con 13 autos, donde el 20% de la grilla superaba el alto del viewport.
      viewport={{ once: true, amount: 'some' }}
      transition={{ duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  )
}
