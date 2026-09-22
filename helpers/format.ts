/** Formatea un monto en pesos mexicanos sin decimales: $349,900. */
export function formatPrice (amount: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 0
  }).format(amount)
}

/** Formatea kilometraje: 45,000 km. */
export function formatMileage (km: number): string {
  return `${new Intl.NumberFormat('es-MX').format(km)} km`
}

/**
 * Supuestos del financiamiento de referencia. Viven aquí y en un solo lugar:
 * el "Desde $X/mes" de la ficha y la calculadora los comparten, porque si cada
 * uno arranca con su propio plazo el cliente ve dos mensualidades distintas
 * para el mismo auto en la misma página.
 *
 * TODO(producto): deberían ser configurables por dealer — cada lote negocia
 * distinto con su financiera. Ver docs/pendientes.md.
 */
export const FINANCIAMIENTO = {
  /** Enganche, como fracción del precio. */
  downRate: 0.2,
  /** Plazo en meses. */
  months: 60,
  /** Tasa anual, como fracción. */
  annualRate: 0.13
}

/**
 * Estimación simple de pago mensual (solo referencia, sin integración bancaria).
 */
export function estimateMonthly (
  price: number,
  {
    downRate = FINANCIAMIENTO.downRate,
    months = FINANCIAMIENTO.months,
    annualRate = FINANCIAMIENTO.annualRate
  } = {}
): number {
  const principal = price * (1 - downRate)
  const r = annualRate / 12
  const payment = (principal * r) / (1 - Math.pow(1 + r, -months))
  return Math.round(payment)
}
