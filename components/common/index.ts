/**
 * Barrel de componentes de dominio compartidos entre vistas (patrón doorvel_next).
 * Reexportar aquí cada componente de components/common/<comp>/.
 */
export { default as Navbar } from './navbar'
export { default as Footer } from './footer'
export { default as PageHeader } from './page-header'
export { default as Testimonials } from './testimonials'
export { default as CarCard } from './carCard'
export { WhatsAppButton, WhatsAppFloat } from './whatsapp-cta'
export { LeadForm } from './lead-form'
export { FinancingCalc } from './financing-calc'

// Previstos (adaptados de doorvel_next):
//   export { default as WhatsAppCTA } from './whatsapp-cta'
//   export { default as GalleryPhotos } from './gallery-photos'
//   export { default as FinancingCalc } from './financing-calc'
