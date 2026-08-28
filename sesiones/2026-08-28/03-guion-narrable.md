# Guion narrable — sesión 2026-08-28 — Proyecto sales 7/24

Versión en primera persona, lista para leer o parafrasear como voz en off en Loom.

---

## Apertura

Hoy tocó una sesión de mantenimiento y expansión del sistema de ventas 24/7. Empezamos revisando dos agentes que ya están en producción — Luis, que hace reparación de crédito, y Jack, que vende trailers para TraiMax — y terminamos construyendo la primera pieza de un sistema nuevo: detección automática de leads fríos, para retargeting.

## Parte 1 — El bug de Luis

Un cliente me escribió pidiendo ayuda con un préstamo de $3000 y nunca le llegó respuesta. Cuando revisé las ejecuciones de n8n, encontré que la API de Claude había respondido con un error 503 — "estoy sobrecargado, intenta de nuevo" — y el nodo que llama a esa API no tenía activado el reintento automático. Un fallo completamente transitorio, de segundos, terminó dejando a un cliente real sin respuesta.

La solución fue simple: activar reintentos automáticos, tres intentos con tres segundos de espera entre cada uno. Con eso, un error pasajero de la API ya no se traduce en un cliente ignorado.

De paso, aproveché para mejorar el guion de Luis: ahora, si el cliente dice algo como "para hoy" o "ahorita" sin especificar que habla de su crédito, el agente lo interpreta como que quiere agendar la llamada — no como parte de la conversación sobre su reporte crediticio. Antes esa señal se perdía.

## Parte 2 — El bug de Jack, más grave

Este fue más delicado. Una clienta, Gracia, ya había avanzado toda la conversación con Jack — dio la cotización, el correo, recibió el link para agendar su llamada. Le escribió una duda de seguimiento y no le llegó nada. Insistió con un "Ey", tampoco. Terminó escribiendo "Eres fraude", frustrada.

Investigando encontré que el nodo que manda el mensaje de reafirmación después del lead listo tenía conectada una credencial de GHL que estaba vencida — una distinta a la que usan todos los demás nodos del mismo workflow, probablemente quedó así por un copy-paste antiguo. Ese fallo de autenticación detenía toda la ejecución antes de que llegara siquiera la notificación para mí, y el código interno ya había marcado a la clienta como "atendida" — así que quedó en silencio total, sin que nadie se enterara.

Corregí la credencial, y agregué reintentos y manejo de error para que un fallo ahí nunca vuelva a bloquear la notificación.

## Parte 3 — Construyendo el detector de retargeting

Con los dos agentes estables, pasamos a construir algo nuevo: un workflow que revisa todos los días, a las 9 de la mañana, el pipeline de ventas de TraiMax en GHL, y clasifica los leads fríos en tres grupos — los que nunca respondieron, los que llegaron al final pero no agendaron su llamada, y los que se quedaron a medias en la cotización sin cerrar.

La primera corrida real encontró 123 leads fríos en total. Un número grande — y eso me llevó a frenar antes de automatizar el envío.

## Parte 4 — Por qué no activamos el envío automático todavía

Aquí es donde vale la pena explicar la lógica de negocio, no solo la técnica: WhatsApp Business tiene una ventana de 24 horas. Pasado ese tiempo sin que el cliente escriba primero, un negocio solo puede mandar mensajes usando plantillas pre-aprobadas por Meta — no texto libre. Y si de golpe le mandas texto libre fuera de esa ventana a 123 personas, es exactamente el patrón que hace que Meta baje la calidad de tu número o lo banee.

Por eso el workflow de hoy solo detecta y me avisa a mí — no le escribe a ningún cliente todavía. Es la base segura sobre la que se construye el envío automático real.

## Parte 5 — Dónde nos quedamos

Confirmamos la plantilla que se va a usar — "traila_seguimiento_general" — ya aprobada por Meta. Pero al intentar conectar el envío automático encontramos un obstáculo técnico real: GHL pide el ID interno de esa plantilla para enviarla por API, y ese ID no está expuesto en ningún endpoint público — lo busqué a fondo.

La solución que encontramos es elegante: en vez de pelear con esa API, construimos un flujo nativo simple dentro de GHL — dos pasos, un disparador cualquiera y la acción de enviar la plantilla, elegida directamente del menú desplegable. Ahí GHL resuelve el ID internamente. Y desde n8n, en vez de intentar mandar el mensaje directo, simplemente inscribo al contacto en ese flujo usando una función de la API que sí existe.

Ese flujo de GHL todavía no está armado — es exactamente donde retomamos la próxima sesión.

## Cierre

Quedó resuelto: dos bugs reales que estaban dejando clientes sin respuesta, con casos concretos y verificables. Quedó construido: el detector de retargeting, activo y funcionando, con 123 leads ya identificados. Y quedó claro el siguiente paso técnico exacto para activar el envío automático de forma segura, sin arriesgar el número de WhatsApp del negocio.
