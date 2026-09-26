'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { WhatsAppAction, WhatsAppButton } from '@/components/common/whatsapp-cta'
import { Modal } from './Modal'

/**
 * Pide nombre y teléfono antes de mandar al chat. Sin esto, cada contacto por
 * WhatsApp era un lead que el dealer nunca veía en su tablero: la conversación
 * quedaba solo en su celular, sin quedar ligada al auto ni a una fecha.
 *
 * Solo dos campos, no los cuatro de "apartar": correo no aporta teniendo el
 * teléfono, y el mensaje se va en el texto prellenado de WhatsApp.
 *
 * El teléfono SÍ se pide aunque WhatsApp ya lo entregue al conversar, porque
 * abrir el chat no es enviar el mensaje. Cuando el visitante se distrae y nunca
 * lo manda, el teléfono es lo único que deja al dealer con a quién llamar.
 */
export function WhatsAppDialog ({
  carId,
  carLabel,
  phone
}: {
  carId: string
  carLabel: string
  phone: string
}) {
  const [open, setOpen] = useState(false)
  const [nombre, setNombre] = useState('')
  const [tel, setTel] = useState('')
  const [error, setError] = useState('')

  const digitos = tel.replace(/\D/g, '')
  const mensaje = nombre.trim()
    ? `Hola, soy ${nombre.trim()}. Me interesa el ${carLabel}.`
    : `Hola, me interesa el ${carLabel}.`

  /**
   * Corre dentro del clic del enlace. Guarda SIN esperar la respuesta y deja que
   * el navegador abra WhatsApp en el mismo gesto.
   *
   * El orden importa y es al revés de lo intuitivo: si se esperara el guardado
   * para abrir el chat después, el gesto del usuario ya se habría perdido y
   * Safari bloquearía la apertura sin avisar. Se prioriza la conversación sobre
   * el registro — si el guardado falla, al menos el cliente llegó.
   *
   * `keepalive` hace que la petición sobreviva a que la página pase a segundo
   * plano cuando el teléfono cambia a la app de WhatsApp.
   */
  const enviar = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!nombre.trim() || digitos.length < 10) {
      e.preventDefault()
      setError('Necesitamos tu nombre y un teléfono de 10 dígitos.')
      return
    }
    fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      keepalive: true,
      body: JSON.stringify({
        name: nombre.trim(),
        phone: tel.trim(),
        message: mensaje,
        carId,
        source: 'whatsapp'
      })
    }).catch(() => {})
    setOpen(false)
  }

  return (
    <>
      <WhatsAppAction onClick={() => setOpen(true)} className="w-full">
        Preguntar por WhatsApp
      </WhatsAppAction>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Preguntar por WhatsApp"
        description="Déjanos tus datos y abrimos el chat con tu mensaje listo."
      >
        <div className="space-y-4">
          <p className="rounded-md bg-secondary px-3 py-2 text-sm">
            Auto de interés: <span className="font-medium">{carLabel}</span>
          </p>

          <div className="space-y-1.5">
            <label className="text-sm font-medium" htmlFor="wa-nombre">
              Nombre <span className="text-cta">*</span>
            </label>
            <Input
              id="wa-nombre"
              value={nombre}
              onChange={(e) => { setNombre(e.target.value); setError('') }}
              placeholder="Tu nombre"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium" htmlFor="wa-tel">
              Teléfono <span className="text-cta">*</span>
            </label>
            <Input
              id="wa-tel"
              type="tel"
              inputMode="tel"
              value={tel}
              onChange={(e) => { setTel(e.target.value); setError('') }}
              placeholder="55 1234 5678"
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <WhatsAppButton phone={phone} message={mensaje} onClick={enviar} className="w-full">
            Enviar y abrir WhatsApp
          </WhatsAppButton>
        </div>
      </Modal>
    </>
  )
}
