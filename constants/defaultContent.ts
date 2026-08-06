/**
 * Contenido editable del sitio (copy de marca). Estos son los DEFAULTS; el dealer
 * sobreescribe lo que quiera desde su panel (dealers.content jsonb). Los labels de
 * UI (botones, campos) NO viven aquí — se mantienen fijos para no romper la UX.
 */

export interface Stat { value: string; label: string }
export interface Step { title: string; desc: string }
export interface Milestone { year: string; title: string; desc: string }
export interface Value { title: string; desc: string }
export interface Testimonial { name: string; location: string; car: string; rating: number; text: string }

export interface SiteContent {
  brand: {
    tagline: string
    description: string
  }
  hero: {
    badge: string
    title: string
    subtitle: string
  }
  sections: {
    categoriesTitle: string
    featuredTitle: string
    howItWorksTitle: string
    howItWorksSteps: Step[]
  }
  about: {
    heroBadge: string
    heroTitle: string
    heroSubtitle: string
    stats: Stat[]
    storyEyebrow: string
    storyTitle: string
    storyParagraphs: string[]
    commitments: string[]
    timelineEyebrow: string
    timelineTitle: string
    milestones: Milestone[]
    valuesTitle: string
    values: Value[]
    testimonialsTitle: string
    testimonialsSubtitle: string
    testimonials: Testimonial[]
    ctaTitle: string
    ctaSubtitle: string
  }
  contact: {
    title: string
    subtitle: string
    formTitle: string
  }
  footer: {
    description: string
  }
  business: {
    phone: string
    email: string
    address: string
    hours: string
  }
  /** Imagen de fondo de las cabeceras internas (Autos, Contacto). Vacío = solo color. */
  headerImage: string
}

export const DEFAULT_CONTENT: SiteContent = {
  brand: {
    tagline: 'Seminuevos verificados',
    description: 'Autos seminuevos verificados, con precios claros y trato directo. Encuentra tu próximo auto con confianza.'
  },
  hero: {
    badge: 'Seminuevos verificados',
    title: 'Encuentra tu próximo auto',
    subtitle: 'Explora el inventario, compara precios y contacta directo por WhatsApp.'
  },
  sections: {
    categoriesTitle: 'Explora por tipo',
    featuredTitle: 'Destacados',
    howItWorksTitle: 'Cómo funciona',
    howItWorksSteps: [
      { title: 'Explora', desc: 'Filtra los autos por marca, precio, año y tipo hasta encontrar tu auto.' },
      { title: 'Contacta', desc: 'Escríbenos por WhatsApp o deja tus datos y te contactamos.' },
      { title: 'Estrena', desc: 'Agenda una visita, apártalo y estrena tu próximo auto.' }
    ]
  },
  about: {
    heroBadge: 'Sobre nosotros',
    heroTitle: 'Más que vender autos,\nconstruimos confianza',
    heroSubtitle: 'Somos un equipo apasionado por los autos. Cada unidad que publicamos pasa por una revisión rigurosa para que estrenes con total tranquilidad.',
    stats: [
      { value: '+500', label: 'Autos entregados' },
      { value: '10', label: 'Años de experiencia' },
      { value: '4.8', label: 'Calificación promedio' },
      { value: '+480', label: 'Clientes felices' }
    ],
    storyEyebrow: 'Nuestra historia',
    storyTitle: 'Empezamos con una idea simple',
    storyParagraphs: [
      'Comprar un auto seminuevo debería ser fácil, claro y sin sorpresas. Desde entonces hemos acompañado a cientos de familias a estrenar auto con la tranquilidad de saber exactamente lo que compran.',
      'Hoy seguimos con la misma misión: autos revisados, precios transparentes y un trato cercano por WhatsApp o en persona.'
    ],
    commitments: ['Revisión de 150 puntos', 'Historial verificado', 'Prueba de manejo', 'Factura y papeles en regla'],
    timelineEyebrow: 'Trayectoria',
    timelineTitle: 'El camino que nos trajo hasta aquí',
    milestones: [
      { year: '2015', title: 'Nace el negocio', desc: 'Abrimos con una idea simple: vender autos seminuevos sin sorpresas.' },
      { year: '2018', title: 'Primer local propio', desc: 'Estrenamos showroom y ampliamos el inventario a más de 50 unidades.' },
      { year: '2021', title: 'Revisión de 150 puntos', desc: 'Estandarizamos la inspección de cada auto antes de publicarlo.' },
      { year: '2024', title: '+500 autos entregados', desc: 'Superamos las 500 familias que estrenaron auto con nosotros.' }
    ],
    valuesTitle: 'Por qué elegirnos',
    values: [
      { title: 'Confianza', desc: 'Cada auto pasa por una revisión antes de publicarse.' },
      { title: 'Trato directo', desc: 'Sin intermediarios: hablas directo con nosotros.' },
      { title: 'Transparencia', desc: 'Precios claros y el historial real de cada unidad.' },
      { title: 'Rapidez', desc: 'Respondemos y agendamos visitas en el mismo día.' }
    ],
    testimonialsTitle: 'Lo que dicen nuestros clientes',
    testimonialsSubtitle: 'Historias reales de quienes ya estrenaron con nosotros.',
    testimonials: [
      { name: 'Ana R.', location: 'CDMX', car: 'Mazda CX-5', rating: 5, text: 'Todo clarísimo desde el primer mensaje. El auto estaba tal cual las fotos y la revisión.' },
      { name: 'Carlos M.', location: 'Puebla', car: 'Ford Ranger', rating: 5, text: 'Me atendieron por WhatsApp al instante y aparté sin broncas. Súper recomendados.' },
      { name: 'Laura T.', location: 'Edomex', car: 'Toyota Corolla', rating: 5, text: 'La calculadora de mensualidades me ayudó a decidir. Trato honesto y sin presión.' }
    ],
    ctaTitle: '¿Listo para encontrar tu auto?',
    ctaSubtitle: 'Explora nuestro inventario o contáctanos y te ayudamos.'
  },
  contact: {
    title: 'Contacto',
    subtitle: 'Estamos para ayudarte. Escríbenos.',
    formTitle: 'Déjanos tus datos'
  },
  footer: {
    description: 'Autos seminuevos verificados, con precios claros y trato directo. Encuentra tu próximo auto con confianza.'
  },
  business: {
    phone: '55 5555 5555',
    email: 'contacto@vendra.mx',
    address: 'Av. Insurgentes Sur 1234, CDMX',
    hours: 'Lun–Sáb 9:00–19:00'
  },
  headerImage: ''
}
