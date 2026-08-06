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
 * Estimación simple de pago mensual (solo referencia, sin integración bancaria).
 * Enganche 20%, plazo 60 meses, tasa anual fija de referencia.
 */
export function estimateMonthly (
  price: number,
  { downRate = 0.2, months = 60, annualRate = 0.13 } = {}
): number {
  const principal = price * (1 - downRate)
  const r = annualRate / 12
  const payment = (principal * r) / (1 - Math.pow(1 + r, -months))
  return Math.round(payment)
}
