/** Estatus comercial del lead (migración 0010). */
export type LeadStatus = 'nuevo' | 'contactado' | 'cita' | 'vendido' | 'perdido'

/** Los estatus en el orden en que avanza un lead. */
export const LEAD_STATUSES: LeadStatus[] = ['nuevo', 'contactado', 'cita', 'vendido', 'perdido']

/** Un cambio de estatus (tabla `lead_status_history`, migración 0011). */
export interface LeadStatusChange {
  /** null = el lead se acaba de crear. */
  from: LeadStatus | null
  to: LeadStatus
  at: string // ISO
}

/** De dónde llegó el lead (0015). Ver lib/attribution.ts. */
export interface LeadOrigin {
  source: string
  medium: string | null
  campaign: string | null
  content: string | null
  term: string | null
  landing: string | null
  referrer: string | null
}

/** Lead para la UI del panel. */
export interface Lead {
  id: string
  name: string
  phone: string
  email: string | null
  /** Auto por el que preguntó (`leads.car_id`). */
  carId: string | null
  carLabel: string | null
  /** Precio publicado del auto de interés; sugiere el monto al marcar vendido. */
  carPrice: number | null
  status: LeadStatus
  /** Auto que compró (0013). Null con status 'vendido' = uno fuera del inventario. */
  soldCarId: string | null
  soldCarLabel: string | null
  saleAmount: number | null
  notes: string
  /** Formulario por el que entró: web_form, apartado, whatsapp. */
  form: string
  /** Último toque con origen. null = lead sin datos de sitio (anterior a la 0015, o sin cookie). */
  origin: LeadOrigin | null
  /** Primer toque, si fue distinto del último. */
  firstOrigin: (LeadOrigin & { at: string }) | null
  createdAt: string // ISO
  /** Del más antiguo al más reciente. */
  history: LeadStatusChange[]
}
