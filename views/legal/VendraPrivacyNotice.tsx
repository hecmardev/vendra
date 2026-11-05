import Link from 'next/link'
import { Car } from 'lucide-react'
import { LEGAL_LAST_UPDATED, type VendraLegal } from '@/lib/vendraLegal'
import { H1, H2, OL, P, Table, UL } from './ui'

/**
 * Aviso de privacidad de Vendra (vendra.com.mx/aviso-de-privacidad). Mismo texto que
 * docs/legal/aviso-privacidad-vendra.md: si cambia uno, cambia el otro y también
 * LEGAL_LAST_UPDATED.
 */
export function VendraPrivacyNotice ({ legal }: { legal: VendraLegal }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b">
        <div className="container py-4">
          <Link href="/" className="flex items-center gap-2 font-bold">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground"><Car className="h-4 w-4" /></span>
            Vendra
          </Link>
        </div>
      </header>
      <main className="container max-w-3xl flex-1 space-y-4 py-12">
        <H1>Aviso de privacidad de Vendra</H1>
        <P>Última actualización: {LEGAL_LAST_UPDATED}</P>

        <H2>1. Quién es responsable de tus datos</H2>
        <P><strong>{legal.responsible}</strong>, con nombre comercial Vendra (&quot;Vendra&quot;, &quot;nosotros&quot;), con domicilio en {legal.address}, es responsable del tratamiento de los datos personales descritos en este aviso.</P>
        <P>Para cualquier tema de privacidad: <strong>{legal.email}</strong>.</P>

        <H2>2. A quién aplica este aviso</H2>
        <UL>
          <li><strong>Dealers y sus usuarios:</strong> las personas y negocios (vendedores independientes, asesores, agencias o lotes) que contratan Vendra para publicar su sitio y administrar su inventario y sus clientes, y las personas que entran a su panel.</li>
          <li><strong>Visitantes de vendra.com.mx:</strong> quien visita nuestro sitio o nos escribe.</li>
        </UL>
        <P><strong>Si eres cliente de un dealer</strong> (dejaste tus datos en el sitio de un vendedor o agencia que usa Vendra), el responsable de tus datos es <strong>ese dealer</strong>, y su aviso de privacidad está en su propio sitio, en /aviso-de-privacidad. Vendra trata esos datos solo como su proveedor tecnológico (sección 7).</P>

        <H2>3. Qué datos recabamos</H2>
        <P><strong>De los dealers y sus usuarios:</strong></P>
        <UL>
          <li>Nombre o razón social, y nombre comercial. Si el dealer es una persona física, estos son datos personales suyos.</li>
          <li>Domicilio, correo y teléfono para el aviso de privacidad de su sitio.</li>
          <li>Nombre y correo electrónico de la persona que entra al panel.</li>
          <li>Contraseña de acceso. Se guarda cifrada: nadie en Vendra puede verla.</li>
          <li>Datos de contacto que se publican en su sitio: teléfono, WhatsApp, correo, domicilio y horario.</li>
          <li>Dominio del sitio, contenido, imágenes, colores y configuración.</li>
          <li>Identificadores y claves de sus cuentas de publicidad: Pixel de Meta, verificación del dominio y token de Conversions API. El token se guarda cifrado y no se vuelve a mostrar en el panel.</li>
          <li>Registro de la actividad en el panel necesaria para operarlo y protegerlo (por ejemplo, los cambios de estatus de un lead y cuándo ocurrieron).</li>
          <li>Datos de facturación, cuando el servicio se cobre.</li>
          <li>La aceptación de los términos del servicio.</li>
        </UL>
        <P><strong>De los visitantes de vendra.com.mx:</strong></P>
        <UL>
          <li>Si nos escribes, tu nombre, correo y lo que nos cuentes.</li>
          <li>Datos técnicos que generan los servidores al visitar el sitio (dirección IP, tipo de navegador, páginas solicitadas), que guarda nuestro proveedor de hosting para operar y proteger el sitio.</li>
        </UL>
        <P><strong>No recabamos datos personales sensibles.</strong></P>

        <H2>4. Para qué usamos tus datos</H2>
        <P><strong>Finalidades necesarias</strong> (primarias):</P>
        <OL>
          <li>Crear y administrar la cuenta del dealer y dar acceso a su panel.</li>
          <li>Publicar y operar el sitio del dealer, incluido su aviso de privacidad.</li>
          <li>Avisarle por correo cuando recibe un lead.</li>
          <li>Reportar a Meta los eventos que el dealer configure con sus propias cuentas.</li>
          <li>Dar soporte técnico y restablecer el acceso.</li>
          <li>Proteger la plataforma: detectar accesos indebidos y fallas.</li>
          <li>Facturar y cobrar el servicio, cuando aplique.</li>
          <li>Responder a quien nos escribe desde vendra.com.mx.</li>
        </OL>
        <P><strong>Finalidades adicionales</strong> (secundarias), que <strong>puedes rechazar</strong>:</P>
        <OL start={9}>
          <li>Enviarte novedades de Vendra, nuevas funciones y ofertas.</li>
          <li>Generar estadísticas de uso de la plataforma, sin datos que identifiquen a las personas, para mejorarla.</li>
        </OL>
        <P>Para rechazarlas, escribe a {legal.email}. Los correos de novedades incluirán además una forma de darte de baja.</P>

        <H2>5. Con quién compartimos tus datos</H2>
        <P><strong>No vendemos ni rentamos datos.</strong></P>
        <P>Nos apoyamos en proveedores que los tratan por nuestra cuenta (encargados):</P>
        <Table
          headers={['Proveedor', 'Para qué', 'Dónde están sus servidores']}
          rows={[
            ['Supabase', 'Base de datos, inicio de sesión, almacenamiento de imágenes y resguardo cifrado de tokens', 'Canadá'],
            ['Vercel', 'Servidores de la plataforma y de los sitios', 'Estados Unidos'],
            ['Resend', 'Envío de correos (avisos de leads)', 'Estados Unidos']
          ]}
        />
        <P>Los datos de contacto y del aviso de privacidad que el dealer captura para su sitio (nombre, teléfono, WhatsApp, correo, domicilio) <strong>se publican</strong> en ese sitio: esa es su finalidad. Por eso, quien sea persona física puede usar un domicilio y datos de contacto de trabajo.</P>
        <P>Fuera de lo anterior, solo compartiremos datos cuando una autoridad competente lo requiera conforme a la ley.</P>

        <H2>6. Cookies</H2>
        <P><strong>En vendra.com.mx</strong> no usamos cookies de publicidad ni de medición.</P>
        <P><strong>En el panel</strong> (de dealers y de administración) usamos cookies de sesión, necesarias para mantenerte conectado. Sin ellas el panel no funciona.</P>
        <P>Las cookies de los <strong>sitios de los dealers</strong> están descritas en el aviso de cada dealer.</P>

        <H2>7. Vendra como proveedor de los dealers (encargado)</H2>
        <P>Cuando una persona deja sus datos en el sitio de un dealer, o lo visita, Vendra guarda y procesa esa información <strong>por cuenta del dealer</strong>, que es el responsable. Esto incluye, si el dealer lo configura, enviarle a Meta los eventos de sus clientes con las cuentas del propio dealer. Si el dealer contrata a Vendra para administrar sus campañas, ese trabajo también es por su cuenta. En ese papel, Vendra:</P>
        <UL>
          <li>Usa esos datos <strong>solo</strong> para prestarle el servicio al dealer.</li>
          <li><strong>No</strong> los vende, no los comparte con otros dealers y no los usa para sus propios fines.</li>
          <li>Mantiene separados los datos de cada dealer: ninguno puede ver los de otro.</li>
          <li>Aplica medidas de seguridad técnicas y administrativas.</li>
          <li>Ayuda al dealer a atender las solicitudes de acceso, rectificación, cancelación y oposición de sus clientes.</li>
          <li>Al terminar la relación con el dealer, le devuelve o elimina esos datos, según lo acuerden.</li>
        </UL>
        <P><strong>Estadísticas agregadas.</strong> Con autorización de los dealers en sus términos del servicio, Vendra puede generar estadísticas del mercado a partir de la información de varios dealers (por ejemplo, qué autos se venden más en un estado, a qué precio promedio o en cuánto tiempo). Estas estadísticas <strong>no contienen datos personales</strong> ni permiten identificar a ninguna persona ni a ningún dealer: solo se publican cuando agrupan información de varios dealers y unidades.</P>
        <P><strong>Contenido de los sitios.</strong> Los autos, precios, promociones, textos e imágenes de cada sitio los publica el dealer, que responde por ellos. Vendra no los revisa antes de publicarse y no participa en las ventas.</P>

        <H2>8. Tus derechos (ARCO) y cómo ejercerlos</H2>
        <P>Tienes derecho a <strong>acceder</strong> a tus datos, <strong>rectificarlos</strong>, <strong>cancelarlos</strong> y <strong>oponerte</strong> a su uso para fines específicos, así como a <strong>revocar</strong> tu consentimiento y <strong>limitar</strong> su uso.</P>
        <P>Escribe a <strong>{legal.email}</strong> con tu nombre, un medio para responderte, copia de una identificación oficial (o el documento que acredite a tu representante), el derecho que quieres ejercer y sobre qué datos.</P>
        <P>Te responderemos en los plazos que establece la ley.</P>
        <P><strong>Si eres cliente de un dealer</strong>, dirige tu solicitud al dealer (los datos de contacto están en su aviso de privacidad). Si nos la mandas a nosotros, se la haremos llegar.</P>

        <H2>9. Cuánto tiempo guardamos los datos</H2>
        <UL>
          <li>Datos de la cuenta del dealer: mientras la cuenta esté activa y, después, lo que exijan las leyes fiscales y comerciales.</li>
          <li>Mensajes de visitantes de vendra.com.mx: hasta 2 años.</li>
          <li>Registros técnicos del hosting: el plazo que fija el proveedor.</li>
        </UL>

        <H2>10. Cambios a este aviso</H2>
        <P>Publicaremos cualquier cambio en vendra.com.mx/aviso-de-privacidad, con su fecha de actualización. Si el cambio afecta a los dealers, también se lo avisaremos por correo.</P>

        <H2>11. Autoridad</H2>
        <P>Si consideras que tus derechos no fueron atendidos, puedes acudir a la autoridad en materia de protección de datos personales: la <strong>Secretaría Anticorrupción y Buen Gobierno</strong>.</P>
      </main>
    </div>
  )
}
