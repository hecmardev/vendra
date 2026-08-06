export type LeadStatus = 'nuevo' | 'contactado' | 'cerrado'

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
}
