/**
 * Catálogo de referencia para dos funciones PENDIENTES. Nada de esto se
 * renderiza hoy.
 *
 * Se usaba como si fuera dato real: la ficha pintaba las mismas 16
 * características y las mismas promesas ("revisión de 150 puntos") para todos
 * los autos de todos los dealers. Se dejó de mostrar porque afirmaba cosas
 * falsas sobre la mercancía, en nombre del dealer.
 *
 * SPEC_CATEGORIES sirve como catálogo de opciones para cuando el equipamiento
 * sea un campo de `cars` con casillas en el formulario de autos. CAR_FAQ, para
 * cuando la FAQ sea editable por dealer.
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
