/**
 * Publicaciones del blog.
 *
 * El contenido sale del material que AvalTrust ya publica en el sitio
 * (servicio, afianzados y preguntas frecuentes), reorganizado como
 * articulos. El primero vivia dentro de js/blog.js del sitio anterior,
 * donde solo aparecia en un modal y ningun buscador lo alcanzaba.
 */
export interface Post {
  slug: string;
  titulo: string;
  resumen: string;
  /** ISO, para ordenar y para la etiqueta <time>. */
  fecha: string;
  /** Como se muestra en pantalla. */
  fechaTexto: string;
  autor: string;
  etiquetas: readonly string[];
  /** Nombre base de la portada en public/img, sin ancho ni extension. */
  imagen: string;
  alt: string;
  /** HTML del cuerpo; se pinta con [innerHTML], que Angular sanea. */
  contenido: string;
}

export const POSTS: readonly Post[] = [
  {
    slug: 'fianzas-en-la-ley',
    titulo: 'Fianzas en la ley',
    resumen:
      'En AvalTrust aplicamos el principio legal de la fianza para respaldar obligaciones crediticias con avales digitales. Actuamos como fiadores profesionales bajo normas claras, cubriendo pagos incumplidos y activando un fondo de cobertura para su recuperación legal.',
    fecha: '2025-06-06',
    fechaTexto: '6 Junio 2025',
    autor: 'Ingrid Alcazar',
    etiquetas: ['Fintech', 'Colombia', 'Tendencias'],
    imagen: 'noticia',
    alt: 'Fianzas en la ley',
    contenido: `<p>En AvalTrust aplicamos el principio legal de la fianza para respaldar obligaciones crediticias con avales digitales. Actuamos como fiadores profesionales bajo normas claras, cubriendo pagos incumplidos y activando un fondo de cobertura para su recuperación legal.</p>
<div class="articulo__pregunta">
<h3>¿Qué dice el Código Civil Colombiano sobre la fianza?</h3>
<div class="articulo__respuesta">
<h4>Respuesta AvalTrust:</h4>
<p>Según el <strong>Artículo 2361 del Código Civil Colombiano</strong>, la fianza es una obligación accesoria mediante la cual una persona (natural o jurídica) se compromete a responder por la deuda de otra ante el acreedor, si esta no cumple con su obligación.</p>
<blockquote>
<strong>Texto legal:</strong> "La fianza es una obligación accesoria, en virtud de la cual una o más personas responden de una obligación ajena, comprometiéndose para con el acreedor a cumplirla en todo o parte, si el deudor principal no la cumple."
</blockquote>
<div class="articulo__destacado">
<p><strong>En AvalTrust</strong>, aplicamos este principio jurídico en un entorno moderno y digital. Como entidad afianzadora, respaldamos obligaciones crediticias con avales digitales emitidos bajo condiciones legales claras, sin intervenir directamente en la aprobación del crédito, pero garantizando el cumplimiento en caso de incumplimiento.</p>
</div>
</div>
</div>
<div class="articulo__pregunta">
<h3>¿Puede una empresa dedicarse profesionalmente a ser fiadora?</h3>
<div class="articulo__respuesta">
<h4>Respuesta AvalTrust:</h4>
<p><strong>Sí.</strong> Aunque la fianza es tradicionalmente una figura civil, la Superintendencia Financiera de Colombia ha aclarado que una persona natural o jurídica puede dedicarse profesionalmente a ser fiadora con fines lucrativos.</p>
<div>
<p><strong>Referencia:</strong> Concepto 2006004784-002 del 23 de febrero de 2006 – Superfinanciera</p>
</div>
<p>Cuando una empresa, como AvalTrust, afianza obligaciones de manera habitual y con ánimo de lucro, debe cumplir con los deberes previstos en el <strong>Artículo 19 del Código de Comercio</strong>, entre ellos:</p>
<ul>
<li>Actuar con diligencia</li>
<li>Actuar con buena fe</li>
<li>Brindar información veraz</li>
</ul>
</div>
</div>
<div class="articulo__pregunta">
<h3>¿Qué cubre una fianza en el contexto financiero?</h3>
<div class="articulo__respuesta">
<h4>Respuesta AvalTrust:</h4>
<p>La fianza cubre el pago de las obligaciones incumplidas del deudor, como cuotas vencidas de un crédito o valores pendientes en un contrato respaldado.</p>
<div>
<h4>En el modelo AvalTrust:</h4>
<ul>
<li><strong>●</strong> Se cubre la pérdida esperada o inesperada de la cartera.</li>
<li><strong>●</strong> Se activa el fondo de cobertura, alimentado con los pagos del aval hechos por el deudor.</li>
<li><strong>●</strong> Posteriormente, se gestiona la recuperación del crédito mediante un proceso documentado y legal.</li>
</ul>
</div>
</div>
</div>
<h3>Innovación Digital en las Fianzas</h3>
<p>En AvalTrust hemos modernizado este concepto tradicional mediante tecnología de vanguardia:</p>
<ul>
<li><strong>Digitalización completa:</strong> Todo el proceso se realiza online, eliminando trámites presenciales</li>
<li><strong>Fondo de cobertura autosostenible:</strong> Garantizamos la disponibilidad de recursos para cubrir incumplimientos</li>
<li><strong>Transparencia total:</strong> Reportes en tiempo real y seguimiento detallado de cada operación</li>
<li><strong>Integración API:</strong> Conexión directa con plataformas fintech y entidades crediticias</li>
</ul>
<h3>El Futuro de las Fianzas Digitales</h3>
<p>El sector fintech colombiano está en constante evolución, y las fianzas digitales representan una oportunidad única para democratizar el acceso al crédito. Con AvalTrust, estamos construyendo un puente entre la tradición jurídica y la innovación tecnológica.</p>
<p>Nuestro compromiso es seguir desarrollando soluciones que beneficien a todo el ecosistema, manteniendo siempre la seguridad jurídica y la transparencia como pilares fundamentales de nuestro servicio.</p>`,
  },
  {
    slug: 'como-opera-el-modelo-de-cobertura-crediticia',
    titulo: '¿Cómo opera AvalTrust bajo el Modelo de Cobertura Crediticia?',
    resumen:
      'Nuestro modelo está diseñado para respaldar a las entidades financieras y empresas, brindando seguridad en sus operaciones sin intervenir en la evaluación de los clientes finales.',
    fecha: '2026-09-17',
    fechaTexto: '17 Septiembre 2026',
    autor: 'Equipo AvalTrust',
    etiquetas: ['Cobertura', 'Fintech'],
    imagen: 'cobertura',
    alt: 'Modelo de cobertura crediticia',
    contenido: `<p>Nuestro modelo está diseñado para respaldar a las entidades financieras y empresas, brindando seguridad en sus operaciones sin intervenir en la evaluación de los clientes finales. Así funciona:</p>
<h3>1. La entidad financiera otorga el crédito</h3>
<p>La aprobación y condiciones del crédito son responsabilidad exclusiva de la entidad financiera, sin participación directa de AvalTrust en esta evaluación.</p>
<h3>2. AvalTrust define la cobertura</h3>
<p>Junto con la entidad financiera, se acuerdan las condiciones de la fianza y el valor correspondiente, según el monto y riesgo de la operación.</p>
<h3>3. Contribución al fondo a través del respaldo crediticio</h3>
<p>El usuario deudor paga el valor de la plataforma de gestión de riesgo crediticio, el cual incluye una contribución que alimenta el Fondo de Cobertura administrado por AvalTrust. Este fondo se usa para respaldar casos de incumplimiento.</p>
<h3>4. Activación del fondo ante incumplimiento</h3>
<p>Si el deudor no cumple con su obligación, el fondo puede cubrir parte o la totalidad del saldo pendiente, conforme a lo pactado en el contrato de servicio digital de garantía crediticia.</p>
<h3>5. Gestión y recuperación del crédito</h3>
<p>AvalTrust asume el seguimiento, reporte y gestión de la recuperación de la deuda, protegiendo los intereses de la entidad afiliada y del sistema de cobertura.</p>
<div class="articulo__destacado">
<p><strong>No somos una fuente de financiación ni intermediación de crédito.</strong> Somos una capa técnica de protección inteligente para actores que desean operar con mayor seguridad, previsibilidad y transparencia.</p>
</div>`,
  },
  {
    slug: 'que-pasa-si-no-puedo-pagar-mi-credito',
    titulo: '¿Qué pasa si no puedo pagar mi crédito?',
    resumen:
      'No te preocupes. En AvalTrust entendemos que la vida a veces trae desafíos. Por eso hemos diseñado un proceso transparente y humano para acompañarte.',
    fecha: '2026-09-17',
    fechaTexto: '17 Septiembre 2026',
    autor: 'Equipo AvalTrust',
    etiquetas: ['Afianzados', 'Educación financiera'],
    imagen: 'acompanamiento',
    alt: 'Acompañamiento a los afianzados',
    contenido: `<p>No te preocupes. En AvalTrust entendemos que la vida a veces trae desafíos. Por eso hemos diseñado un proceso transparente y humano para acompañarte.</p>
<h3>1. Nosotros te cubrimos</h3>
<p>Cuando tu crédito entra en mora, <strong>AvalTrust se hace cargo inmediatamente</strong>. Pagamos tu deuda al acreedor para que tu historial crediticio no se vea más afectado. Es como tener un hermano mayor que te respalda.</p>
<h3>2. Nos convertimos en tu aliado</h3>
<p>Ahora que pagamos tu deuda, <strong>nos convertimos en tu nuevo interlocutor</strong>. Pero no somos como los cobradores tradicionales. Somos tu socio para encontrar la mejor solución juntos.</p>
<h3>3. Conversamos de corazón</h3>
<p>Te contactamos para <strong>dialogar de manera abierta y constructiva</strong>. No hay prisa, no hay presión. Queremos entender tu situación y construir juntos un plan que funcione para ti.</p>
<h3>4. Todo claro y justo</h3>
<p>Te explicamos exactamente qué debes pagar: <strong>el monto que cubrimos + gastos de gestión proporcionales</strong>. Sin sorpresas, sin letra pequeña. Transparencia total.</p>
<div class="articulo__destacado">
<h4>Nuestro compromiso contigo</h4>
<ul>
<li><strong>Trato digno siempre.</strong> Nunca recibirás llamadas agresivas o amenazas. Creemos en el diálogo respetuoso y la solución colaborativa.</li>
<li><strong>Tiempo necesario.</strong> No te presionamos. Te damos el tiempo que necesitas para recuperarte y encontrar la mejor manera de resolver la situación.</li>
<li><strong>Soluciones a tu medida.</strong> Diseñamos planes de pago que se adapten a tu realidad económica. Cada persona es única, cada solución también.</li>
<li><strong>Privacidad absoluta.</strong> Tu información es confidencial. No compartimos tus datos con terceros ni hacemos públicas tus dificultades.</li>
</ul>
</div>`,
  },
  {
    slug: 'beneficios-de-la-fianza-digital-para-tu-fintech',
    titulo: 'Beneficios clave de nuestras fianzas digitales',
    resumen:
      'Nuestras fianzas digitales están diseñadas para optimizar y simplificar el proceso crediticio, ofreciendo ventajas significativas.',
    fecha: '2026-09-17',
    fechaTexto: '17 Septiembre 2026',
    autor: 'Equipo AvalTrust',
    etiquetas: ['Fintech', 'Avales digitales'],
    imagen: 'soluciones',
    alt: 'Soluciones de respaldo crediticio digital',
    contenido: `<p>Nuestras fianzas digitales están diseñadas para optimizar y simplificar el proceso crediticio, ofreciendo ventajas significativas.</p>
<h3>Integración fluida</h3>
<p>Se incorporan directamente a tu proceso de crédito y métodos de firma electrónica existentes, asegurando una transición sin interrupciones.</p>
<h3>Comunicación digital</h3>
<p>Todas nuestras comunicaciones son digitales, garantizando agilidad y eficiencia en cada interacción con tus clientes.</p>
<h3>Reducción de carga operativa</h3>
<p>Minimizamos tu trabajo administrativo gracias a un proceso automatizado de reportes mensuales a través de nuestra plataforma.</p>
<h3>Adiós al papeleo</h3>
<p>Eliminamos la necesidad de transferir documentos físicos en el proceso de activación de la fianza, agilizando todo el procedimiento.</p>
<h3>Protección integral</h3>
<p>Con AvalTrust, obtienes una solución completa que combina todos estos beneficios en una plataforma segura, eficiente y confiable.</p>
<div class="articulo__destacado">
<h4>Una fianza que evoluciona contigo</h4>
<p>Nuestra fianza digital se distingue por su diseño inherentemente flexible. Nos adaptamos a las características específicas de tu producto crediticio, evolucionando continuamente para satisfacer las necesidades cambiantes del mercado.</p>
<p>Garantizamos total transparencia en la gestión de los recursos, porque tú serás parte activa de este proceso.</p>
</div>`,
  },
  {
    slug: 'preguntas-frecuentes-sobre-fianzas-digitales',
    titulo: 'Preguntas frecuentes sobre fianzas digitales',
    resumen:
      'Las dudas más comunes sobre qué créditos se pueden afianzar, qué papel cumple AvalTrust y qué hace falta para solicitar una fianza.',
    fecha: '2026-09-17',
    fechaTexto: '17 Septiembre 2026',
    autor: 'Equipo AvalTrust',
    etiquetas: ['Avales digitales', 'Educación financiera'],
    imagen: 'preguntas',
    alt: 'Preguntas frecuentes sobre fianzas digitales',
    contenido: `<p>Encuentra respuestas a las dudas más comunes sobre nuestros servicios.</p>
<h3>¿Qué tipos de crédito puedo afianzar?</h3>
<blockquote class="articulo__respuesta">
<p>Ofrecemos fianzas para una amplia gama de productos crediticios incluyendo créditos de libranza, digitales, educativos, de vehículos, arrendamiento y retail.</p>
</blockquote>
<h3>¿AvalTrust es una entidad financiera?</h3>
<blockquote class="articulo__respuesta">
<p>No, AvalTrust no actúa como avalista ni como entidad que otorga créditos.</p>
<p>Nuestra función es respaldar las obligaciones de crédito originadas por entidades financieras, fintech o acreedores, mediante la emisión de fianzas digitales subsidiarias.</p>
<p>Estas fianzas constituyen un respaldo tecnológico y contractual frente al riesgo de impago, sin que AvalTrust asuma el rol de prestamista ni de avalista solidario.</p>
</blockquote>
<h3>¿Qué necesito para solicitar una fianza?</h3>
<blockquote class="articulo__respuesta">
<p>En la mayoría de casos, no necesitas contactarnos directamente. Solo sigue estos pasos:</p>
<ul>
<li><strong>1. Acude a un intermediario financiero</strong> (banco, cooperativa, FinTech, etc.) que trabaje con AvalTrust.</li>
<li><strong>2. Solicita tu crédito</strong> y menciona que deseas el respaldo de Avaltrust.</li>
<li><strong>3. Ellos gestionarán todo</strong> con nosotros, simplificando tu proceso.</li>
</ul>
</blockquote>`,
  },
];

export function buscarPost(slug: string | null): Post | undefined {
  return POSTS.find((post) => post.slug === slug);
}
