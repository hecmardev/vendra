/**
 * Notificaciones al dealer. Hoy: email (Resend vía REST, sin dependencia).
 * Diseñado para sumar canales (WhatsApp) sin rehacer el llamador: agrega otro
 * notifier en `notifyNewLead`.
 *
 * TODO(fase 2): sendLeadWhatsApp(n) con WhatsApp Business API.
 *
 * Todo es a prueba de fallos: si falta la API key o el envío falla, se registra
 * y se continúa — nunca debe romper la captura del lead.
 */

export interface LeadNotice {
  to: string | null | undefined
  dealerName: string
  lead: { name: string; phone: string; email?: string | null; message?: string | null; source: string }
  carLabel?: string
  leadsUrl: string
}

/** Notifica al dealer de un lead nuevo por todos los canales configurados. */
export async function notifyNewLead (n: LeadNotice): Promise<void> {
  await Promise.allSettled([
    sendLeadEmail(n)
    // Futuro: sendLeadWhatsApp(n)
  ])
}

function escapeHtml (s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string))
}

async function sendLeadEmail (n: LeadNotice): Promise<void> {
  const key = process.env.RESEND_API_KEY
  if (!key) { console.warn('[notify] RESEND_API_KEY ausente: se omite el email del lead.'); return }
  if (!n.to) { console.warn('[notify] El dealer no tiene correo configurado: se omite el email.'); return }

  const from = process.env.RESEND_FROM || 'Vendra <onboarding@resend.dev>'
  const sourceLabel = n.lead.source === 'apartado' ? 'Apartar / agendar visita' : 'Formulario de contacto'

  const rows: Array<[string, string]> = [
    ['Nombre', n.lead.name],
    ['Teléfono', n.lead.phone],
    ...(n.lead.email ? [['Correo', n.lead.email] as [string, string]] : []),
    ...(n.carLabel ? [['Auto', n.carLabel] as [string, string]] : []),
    ['Origen', sourceLabel],
    ...(n.lead.message ? [['Mensaje', n.lead.message] as [string, string]] : [])
  ]

  const html = `
    <div style="font-family:system-ui,-apple-system,sans-serif;max-width:520px;margin:0 auto;color:#0f172a">
      <h2 style="margin:0 0 4px">Nuevo lead en ${escapeHtml(n.dealerName)}</h2>
      <p style="margin:0 0 16px;color:#64748b">Alguien te contactó desde tu sitio.</p>
      <table style="width:100%;border-collapse:collapse;font-size:14px">
        ${rows.map(([k, v]) => `
          <tr>
            <td style="padding:8px 12px;border:1px solid #e2e8f0;background:#f8fafc;font-weight:600;white-space:nowrap">${escapeHtml(k)}</td>
            <td style="padding:8px 12px;border:1px solid #e2e8f0">${escapeHtml(v)}</td>
          </tr>`).join('')}
      </table>
      <p style="margin:20px 0 0">
        <a href="${n.leadsUrl}" style="display:inline-block;background:#dc2626;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;font-weight:600">Ver en tu panel</a>
      </p>
    </div>`

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        from,
        to: [n.to],
        subject: `Nuevo lead: ${n.lead.name}${n.carLabel ? ` — ${n.carLabel}` : ''}`,
        html
      })
    })
    if (!res.ok) console.error('[notify] Resend respondió', res.status, await res.text().catch(() => ''))
  } catch (e) {
    console.error('[notify] Error enviando el email del lead:', e)
  }
}
