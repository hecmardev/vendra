export type LeadStatus = 'nuevo' | 'contactado' | 'cerrado'

export interface Lead {
  id: string
  name: string
  phone: string
  email: string | null
  carLabel: string | null
  status: LeadStatus
  createdAt: string // ISO
}

/** Leads mock para maquetación del panel. Se reemplazan por listLeads(dealerId). */
export const MOCK_LEADS: Lead[] = [
  { id: 'l1', name: 'Ana Ramírez', phone: '55 1234 5678', email: 'ana@correo.com', carLabel: 'Mazda CX-5 2022', status: 'nuevo', createdAt: '2026-07-14T18:20:00Z' },
  { id: 'l2', name: 'Carlos Méndez', phone: '55 8765 4321', email: 'carlos@correo.com', carLabel: 'Ford Ranger 2023', status: 'nuevo', createdAt: '2026-07-14T15:05:00Z' },
  { id: 'l3', name: 'Laura Torres', phone: '55 2222 3333', email: null, carLabel: 'Toyota Corolla 2021', status: 'contactado', createdAt: '2026-07-13T11:40:00Z' },
  { id: 'l4', name: 'Diego Salinas', phone: '55 4444 5555', email: 'diego@correo.com', carLabel: null, status: 'contactado', createdAt: '2026-07-12T09:15:00Z' },
  { id: 'l5', name: 'Sofía Herrera', phone: '55 6666 7777', email: 'sofia@correo.com', carLabel: 'Nissan Kicks 2022', status: 'cerrado', createdAt: '2026-07-10T17:50:00Z' }
]
