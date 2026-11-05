import { Navbar, Footer } from '@/components/common'
import type { DealerLegalInfo } from '@/lib/dealerLegal'
import { LEGAL_LAST_UPDATED } from '@/lib/vendraLegal'
import { H1, H2, OL, P, Table, UL } from './ui'

/**
 * Aviso de privacidad del sitio de un dealer. Mismo texto que
 * docs/legal/aviso-privacidad-dealer.md: si cambia uno, cambia el otro y también
 * LEGAL_LAST_UPDATED. El § 5 de ese documento es SimplifiedPrivacyNotice.
 */
export function DealerPrivacyNotice ({ legal, vendraName }: { legal: DealerLegalInfo; vendraName: string | null }) {
  const name = legal.commercialName
  return (
    <div className="flex min-h-dvh flex-col">
      <Navbar dealerName={name} />
      <main className="container max-w-3xl flex-1 space-y-4 py-12">
        <H1>Aviso de privacidad</H1>
        <P><strong>{name}</strong><br />Última actualización: {LEGAL_LAST_UPDATED}</P>

        <H2>1. Quién es responsable de tus datos</H2>
        <P>
          <strong>{legal.responsible}</strong> (&quot;{name}&quot;, &quot;nosotros&quot;), con domicilio en {legal.address}, es responsable del
          tratamiento de los datos personales que nos proporcionas en este sitio ({legal.site}) y de los que se generan cuando lo visitas.
        </P>
        <P>Para cualquier tema de privacidad puedes escribirnos a <strong>{legal.email}</strong> o llamarnos al <strong>{legal.phone}</strong>.</P>
        <P>Este sitio funciona con Vendra, una plataforma tecnológica. Vendra no vende autos ni decide cómo se usan tus datos: los trata por nuestra cuenta (sección 4).</P>

        <H2>2. Qué datos tratamos</H2>
        <P><strong>Los que tú nos das</strong> al llenar un formulario (contacto, apartar un auto o preguntar por WhatsApp):</P>
        <UL>
          <li>Nombre.</li>
          <li>Teléfono.</li>
          <li>Correo electrónico (opcional).</li>
          <li>El mensaje que nos escribas.</li>
          <li>El auto por el que preguntas.</li>
        </UL>
        <P><strong>Los que se generan cuando visitas el sitio:</strong></P>
        <UL>
          <li>Un identificador aleatorio de tu navegador, que no contiene tu nombre.</li>
          <li>De dónde llegaste: si fue por un anuncio, una búsqueda en internet, una red social u otro sitio; la campaña y el anuncio, si el enlace los indica; y la página por la que entraste.</li>
          <li>Qué autos viste en el sitio, cuántas veces y en qué días.</li>
          <li>Si tocaste los botones para escribirnos por WhatsApp, llamarnos, enviarnos un correo o ver cómo llegar.</li>
          <li>Lo que elegiste en el aviso de cookies.</li>
        </UL>
        <P><strong>Los que registramos al atenderte:</strong></P>
        <UL>
          <li>El estado de tu solicitud (por ejemplo, contactado, cita o venta) y sus fechas.</li>
          <li>Las notas de seguimiento de quien te atiende.</li>
          <li>Si compraste: el auto y el monto de la compra.</li>
        </UL>
        <P><strong>Con tu autorización</strong> (solo si aceptas en el aviso de cookies):</P>
        <UL>
          <li>Identificadores de las herramientas de publicidad y medición de Meta (Facebook, Instagram), descritas en la sección 6.</li>
          <li>Si además nos dejas tus datos: la dirección IP y el tipo de navegador con los que nos escribiste.</li>
        </UL>
        <P>
          <strong>No te pedimos datos personales sensibles</strong> (salud, origen étnico, creencias, preferencias sexuales, etc.) en este sitio, ni datos de
          tarjetas, cuentas bancarias o ingresos. La calculadora de financiamiento hace un cálculo en tu pantalla y no guarda lo que escribes.
        </P>

        <H2>3. Para qué usamos tus datos</H2>
        <P><strong>Finalidades necesarias para atenderte</strong> (primarias):</P>
        <OL>
          <li>Responder tu solicitud de información sobre un auto.</li>
          <li>Contactarte por teléfono, WhatsApp o correo para darle seguimiento.</li>
          <li>Agendar una visita, una prueba de manejo o el apartado de un auto.</li>
          <li>Dar seguimiento a la compra y, en su caso, registrarla.</li>
        </OL>
        <P><strong>Finalidades adicionales</strong> (secundarias), que <strong>puedes rechazar</strong> sin que eso afecte la atención que te damos:</P>
        <OL start={5}>
          <li>Saber qué anuncios, campañas y canales funcionan, para invertir mejor en publicidad.</li>
          <li>Generar estadísticas sobre qué autos generan más interés.</li>
          <li>Solo si aceptas en el aviso de cookies: medir y mejorar nuestros anuncios en Meta, mostrarte anuncios de autos que viste e informarle a Meta el resultado de tu solicitud (sección 4).</li>
        </OL>
        <P><strong>Cómo funciona tu decisión:</strong></P>
        <UL>
          <li><strong>Mientras no elijas:</strong> usamos nuestras propias cookies para las finalidades 5 y 6. Las herramientas de Meta no se cargan.</li>
          <li><strong>Si aceptas:</strong> se usan todas, incluida la finalidad 7.</li>
          <li><strong>Si rechazas:</strong> borramos nuestras cookies de medición y dejamos de registrar de dónde llegaste, qué autos ves y qué botones tocas. Meta no se carga. Tu solicitud se atiende igual.</li>
        </UL>
        <P>Puedes cambiar de opinión cuando quieras en &quot;Preferencias de cookies&quot;, al pie de cualquier página, o escribiendo a {legal.email}.</P>

        <H2>4. Con quién compartimos tus datos</H2>
        <P><strong>No vendemos ni rentamos tus datos.</strong></P>
        <P><strong>Proveedores que los tratan por nuestra cuenta</strong> y siguiendo nuestras instrucciones (encargados), sin usarlos para fines propios:</P>
        <Table
          headers={['Proveedor', 'Para qué', 'Dónde están sus servidores']}
          rows={[
            [vendraName ? `Vendra (${vendraName})` : 'Vendra', 'Plataforma con la que funciona este sitio y nuestro panel de clientes', 'Usa los servidores de los proveedores de abajo'],
            ['Supabase', 'Base de datos donde se guardan tus datos', 'Canadá'],
            ['Vercel', 'Servidores que publican este sitio', 'Estados Unidos'],
            ['Resend', 'Envío del correo con el que se nos avisa de tu solicitud', 'Estados Unidos']
          ]}
        />
        <P>Quien administre nuestras campañas de publicidad (Vendra u otra agencia que contratemos) puede ver esa información por nuestra cuenta, solo para ese fin.</P>
        <P>
          <strong>Estadísticas sin datos personales.</strong> Vendra puede usar información de este sitio, <strong>sin datos que te identifiquen</strong>, junto con la de
          otros negocios, para generar estadísticas generales del mercado de autos (por ejemplo, qué modelos se venden más en una región). No incluyen tu nombre,
          teléfono, correo ni ningún dato que permita saber quién eres.
        </P>
        <P><strong>Meta (solo si aceptas en el aviso de cookies).</strong> Meta Platforms, cuyos servidores pueden estar fuera de México, recibe:</P>
        <UL>
          <li><strong>Desde tu navegador:</strong> las páginas que visitas en este sitio, los autos que ves (marca, modelo, año, condición y precio), si nos enviaste una solicitud y si tocaste los botones de contacto o de cómo llegar.</li>
          <li>
            <strong>Desde nuestro servidor, si además nos dejas tus datos:</strong> que nos contactaste y, en su caso, que te contactamos, que agendaste una cita o que compraste,
            con el auto y el monto. Para que Meta pueda relacionarlo con tu cuenta, le enviamos tu teléfono, correo, nombre, país y un identificador interno <strong>transformados
            con una función hash</strong>, que impide leerlos directamente, junto con tu dirección IP, tu tipo de navegador y los identificadores de sus cookies y de clic.
          </li>
        </UL>
        <P>Lo usamos para medir y mejorar nuestros anuncios. Meta trata esa información también conforme a su propio aviso de privacidad. <strong>Si no aceptas, no le enviamos nada de esto.</strong></P>
        <P>Si eliges escribirnos por WhatsApp, esa conversación ocurre en WhatsApp, un servicio de Meta, con sus propias condiciones.</P>
        <P>Fuera de lo anterior, solo compartiremos tus datos cuando una autoridad competente lo requiera conforme a la ley.</P>

        <H2>5. Aviso de privacidad simplificado</H2>
        <P>Debajo de cada formulario de este sitio encontrarás una versión corta de este aviso, con un enlace a esta página.</P>

        <H2>6. Cookies y tecnologías de rastreo</H2>
        <P>Este sitio usa cookies (pequeños archivos que el navegador guarda) para lo siguiente:</P>
        {/* GA4: agregar `_ga`, `_ga_*` al activarlo (docs/pendientes.md § 0). */}
        <Table
          headers={['Cookie', 'De quién', 'Para qué', 'Duración', '¿Puedes rechazarla?']}
          rows={[
            ['vd_vid', 'Nuestra', 'Identificador aleatorio del navegador, para relacionar tus visitas con tu solicitud', '1 año', 'Sí ("Rechazar medición")'],
            ['vd_attr', 'Nuestra', 'De dónde llegaste (anuncio, búsqueda, otro sitio) y por qué página entraste', '90 días', 'Sí ("Rechazar medición")'],
            ['vd_consent', 'Nuestra', 'Recordar lo que elegiste en el aviso de cookies', '1 año', 'No: es necesaria para respetar tu decisión'],
            ['_fbp, _fbc', 'Meta', 'Medir los anuncios de Meta y mostrarte anuncios relacionados', 'Hasta 90 días', 'Solo se usan si aceptas']
          ]}
        />
        <P>Puedes cambiar tu decisión cuando quieras desde &quot;Preferencias de cookies&quot; al pie de la página, o borrar las cookies desde la configuración de tu navegador.</P>

        <H2>7. Tus derechos (ARCO) y cómo ejercerlos</H2>
        <P>Tienes derecho a:</P>
        <UL>
          <li><strong>Acceder</strong> a los datos que tenemos de ti.</li>
          <li><strong>Rectificarlos</strong> si están equivocados o incompletos.</li>
          <li><strong>Cancelarlos</strong>, es decir, pedir que los eliminemos.</li>
          <li><strong>Oponerte</strong> a que los usemos para fines específicos.</li>
        </UL>
        <P>También puedes <strong>revocar</strong> tu consentimiento o <strong>limitar</strong> el uso de tus datos.</P>
        <P><strong>Cómo hacerlo:</strong> escribe a <strong>{legal.email}</strong> con:</P>
        <OL>
          <li>Tu nombre y un medio para responderte.</li>
          <li>Una copia de una identificación oficial (o, si lo haces por medio de un representante, el documento que lo acredite).</li>
          <li>Qué derecho quieres ejercer y sobre qué datos.</li>
          <li>Cualquier dato que nos ayude a encontrarlos (por ejemplo, el teléfono con el que nos escribiste y la fecha aproximada).</li>
        </OL>
        <P>
          Te responderemos en los plazos que establece la ley. Si procede, la cancelación se hace eliminando tus datos de contacto; podemos conservar información sin datos que te
          identifiquen (por ejemplo, que en tal fecha se vendió un auto) con fines estadísticos, y lo que nos obliguen a guardar las leyes fiscales y comerciales.
        </P>
        <P>Dejaremos de enviarle datos tuyos a Meta. Lo que Meta ya haya recibido lo trata conforme a su propio aviso, donde también puedes ejercer tus derechos.</P>

        <H2>8. Cuánto tiempo guardamos tus datos</H2>
        <UL>
          <li>Si no compraste: hasta <strong>2 años</strong> desde el último contacto contigo.</li>
          <li>Si compraste: el tiempo que exijan las leyes fiscales y comerciales.</li>
          <li>Datos de navegación que no están ligados a una solicitud: hasta <strong>13 meses</strong>.</li>
        </UL>
        <P>Pasado ese tiempo, los eliminamos o los dejamos sin datos que te identifiquen.</P>

        <H2>9. Sobre el contenido de este sitio</H2>
        <P>Los autos, precios, promociones, textos e imágenes de este sitio los publica {name}, que responde por ellos. Vendra solo proporciona la tecnología y no participa en la venta. Las marcas mencionadas pertenecen a sus titulares.</P>

        <H2>10. Cambios a este aviso</H2>
        <P>Si cambiamos este aviso, publicaremos la nueva versión en esta misma página, con su fecha de actualización.</P>

        <H2>11. Autoridad</H2>
        <P>Si consideras que tus derechos no fueron atendidos, puedes acudir a la autoridad en materia de protección de datos personales: la <strong>Secretaría Anticorrupción y Buen Gobierno</strong>.</P>
      </main>
      <Footer />
    </div>
  )
}
