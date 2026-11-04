import { createAdminClient } from '@/lib/supabase/admin'
import type { ParsedMetaConfig } from '@/lib/metaConfig'

/**
 * Guarda la configuración de Meta de un dealer. Con el service role, y por eso el
 * llamador tiene que haber verificado antes quién es: el admin de plataforma, o
 * el dealer autenticado con SU propio id (nunca un id que venga del navegador).
 *
 * Va por aquí y no con la sesión del dealer por dos razones: el token vive en
 * Supabase Vault y sus funciones solo las ejecuta el service role, y el trigger
 * dealers_meta_guard (0018) sigue rechazando cambios directos con la sesión, así
 * que nadie se salta estas validaciones llamando a la API de Supabase.
 *
 * Recibe la configuración ya validada (parseMetaConfig): validar antes de escribir
 * evita guardados a medias.
 */
export async function saveMetaConfig (dealerId: string, config: ParsedMetaConfig): Promise<void> {
  const supabase = createAdminClient()

  const { error } = await supabase
    .from('dealers')
    .update({ meta_pixel_id: config.pixelId, meta_domain_verification: config.domainVerification })
    .eq('id', dealerId)
  if (error) throw error

  if (config.clearToken) {
    const { error: e } = await supabase.rpc('clear_meta_capi_token', { p_dealer_id: dealerId })
    if (e) throw e
  } else if (config.token) {
    const { error: e } = await supabase.rpc('set_meta_capi_token', { p_dealer_id: dealerId, p_token: config.token })
    if (e) throw e
  }

  const { error: codeError } = await supabase
    .from('dealer_integrations')
    .upsert(
      { dealer_id: dealerId, meta_test_event_code: config.testEventCode, updated_at: new Date().toISOString() },
      { onConflict: 'dealer_id' }
    )
  if (codeError) throw codeError
}

export interface MetaConfigStatus {
  /** Solo si hay token: el token nunca sale de la base hacia una pantalla. */
  tokenConfigured: boolean
  testEventCode: string | null
}

/** Estado para el formulario. A prueba de fallos: sin la 0019, nada configurado. */
export async function getMetaConfigStatus (dealerId: string): Promise<MetaConfigStatus> {
  const { data } = await createAdminClient()
    .from('dealer_integrations')
    .select('meta_capi_token_secret_id, meta_test_event_code')
    .eq('dealer_id', dealerId)
    .maybeSingle()
  return {
    tokenConfigured: Boolean(data?.meta_capi_token_secret_id),
    testEventCode: data?.meta_test_event_code ?? null
  }
}
