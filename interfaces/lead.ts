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

/** Lead para la UI del panel. */
export interface Lead {
  id: string
  name: string
  phone: string
  email: string | null
  carLabel: string | null
  status: LeadStatus
  notes: string
  createdAt: string // ISO
  /** Del más antiguo al más reciente. */
  history: LeadStatusChange[]
}
