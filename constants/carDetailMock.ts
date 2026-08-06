/**
 * Equipamiento por categoría y FAQ de la ficha (demo). En producción vendrían
 * del auto (campos/checklist por unidad) y de una FAQ por modelo/dealer.
 */

export interface SpecCategory {
  title: string
  items: string[]
}

export const SPEC_CATEGORIES: SpecCategory[] = [
  { title: 'Exterior', items: ['Rines de aleación', 'Faros LED', 'Quemacocos', 'Sensores de reversa'] },
  { title: 'Seguridad', items: ['Frenos ABS', '6 bolsas de aire', 'Control de estabilidad', 'Cámara de reversa'] },
  { title: 'Interior', items: ['Asientos de piel', 'Climatizador automático', 'Volante con controles', 'Encendido por botón'] },
  { title: 'Entretenimiento', items: ['Pantalla táctil', 'Apple CarPlay / Android Auto', 'Bluetooth', 'Bocinas premium'] }
]

export interface Faq { q: string; a: string }

export const CAR_FAQ: Faq[] = [
  { q: '¿El auto tiene garantía?', a: 'Cada unidad pasa por una revisión de 150 puntos. Consúltanos las opciones de garantía disponibles para este modelo.' },
  { q: '¿Puedo agendar una prueba de manejo?', a: 'Sí. Escríbenos por WhatsApp o déjanos tus datos y coordinamos una cita para que lo manejes.' },
  { q: '¿Aceptan mi auto a cuenta?', a: 'Evaluamos autos a cuenta según modelo y estado. Mándanos los datos de tu auto y te damos una estimación.' },
  { q: '¿Manejan financiamiento?', a: 'Te damos una estimación de mensualidad con la calculadora y te acompañamos en el proceso con nuestras opciones.' }
]
