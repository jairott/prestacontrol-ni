# Log técnico — 2026-09-20
## Sesión: Jack detecta el tipo de traila desde el anuncio de Meta (TraiMax)

Nota: el cambio real fue en n8n (workflow "Jack - TraiMax WhatsApp GHL"), no en el código de `prestacontrol-ni`. Se documenta aquí porque este repo es la base de proyecto de Claude Code para "sales 7/24" en general.

## Pedido de Jairo
Cuando un cliente llega escribiendo por WhatsApp desde un anuncio de Meta (Click-to-WhatsApp), Jack no debería preguntarle qué tipo de traila busca — el anuncio que clickeó ya lo indica (cada anuncio muestra una foto de un tipo de traila específico).

## 🐛 Bug resuelto — la info del anuncio llegaba y se descartaba sin usarse
- GHL pega, dentro del texto del primer mensaje, un bloque tipo `*Headline:* Chatea con nosotros` / `*Source URL:* https://fb.me/...` cuando el contacto viene de un anuncio.
- El nodo "Procesar Mensaje GHL" ya tenía una regex que **detectaba y borraba** ese bloque (para que el cliente no viera esa basura en el chat) — pero nunca se guardaba esa información para nada más. Efecto real: Jack trataba todo inicio de conversación desde anuncio como genérico y siempre preguntaba el tipo de traila, aunque el dato ya estaba disponible.

## Investigación — de dónde sacar el tipo de traila de forma confiable
- El "Headline"/"Source URL" embebidos en el texto no alcanzan para identificar el tipo de traila (el headline es genérico: "Chatea con nosotros", igual en varios anuncios).
- Se revisó el nodo "Preparar Hash Telefono CAPI Jack" (usado para el evento de conversión a Meta CAPI) y su comentario ya documentaba: `ctwaClid` siempre llega `null` desde la integración GHL↔Meta para esta cuenta, pero **`adId` y `adName` sí llegan**, leídos de `contact.attributionSource` (vía la llamada que el nodo "Obtener Nombre Contacto GHL" ya hace a `GET /contacts/{contactId}` de GHL — esa llamada corre en TODOS los mensajes, no solo en la rama de CAPI).
- Se consultó la cuenta de Meta Ads "TraiMax Trailers" (`979529424788262`) vía Meta Ads MCP: 3 campañas activas, cada una para un tipo de traila —
  - `Jack | Dump Trailer | Conversaciones GHL 577` (campaign `52542505059569`)
  - `Jack | Enclosed Trailer | Conversaciones GHL 577` (campaign `52542505189969`)
  - `Jack | Gooseneck 40ft | Conversaciones GHL 577` (campaign `52542505225369`)
  — con 11 anuncios activos en total repartidos entre las tres.
- Se armó la tabla `ad_id → tipo de traila` cruzando `ads_get_ad_entities` (level=ad) de cada campaña.

## Verificación del pipeline antes de tocar código
- Se trazó el flujo completo en n8n: `Webhook GHL Jack → Procesar Mensaje GHL → ... → Consolidar Mensajes → Obtener Nombre Contacto GHL → Merge Nombre → Detectar Ciudad Cliente → (Hay Ciudad Detectada? sí/no) → ... → Build Claude Body Jack → Claude API Jack`.
- Se confirmó revisando ejecuciones reales (`search_workflow_executions` / `get_workflow_execution`) que el webhook de GHL solo manda `contactName, contactId, conversationId, phone, from, message_body` — el Headline/Source URL viajan como texto plano dentro de `message_body`, no como campos separados.
- Se confirmó que ambas ramas de "Hay Ciudad Detectada?" (con y sin ciudad) convergen en "Build Claude Body Jack", y que los nodos intermedios (`Detectar Ciudad Cliente`, `Calcular Tienda Mas Cercana`) hacen spread completo del item (`{...item, ...}`), así que un campo nuevo agregado en "Merge Nombre" sobrevive el recorrido completo sin perderse.
- Se detectó (y se dejó sin tocar, fuera de alcance) un campo huérfano `parameters.parameters` dentro del nodo "Build Claude Body Jack" con una versión vieja/no usada del prompt (persona "Jairo Torres" en vez de "Jack"). Se confirmó contra una ejecución real (`Claude API Jack` output) que el código que **sí** corre es el `parameters.jsCode` de nivel superior — el que se editó.

## Cambios aplicados (n8n MCP: `update_workflow` → diff → `publish_workflow`)
Workflow: `Jack - TraiMax WhatsApp GHL` (id `7LrqZC313XsBiDAB`). Nueva versión: "Detectar tipo de trailer desde el anuncio (adId de GHL)".

1. **Nodo "Merge Nombre"**: además de armar el nombre del contacto (como ya hacía), ahora lee `contactData.contact.attributionSource.adId` y lo mapea contra una tabla estática de los 11 `ad_id` activos hoy → `'Dump' | 'Enclosed' | 'Gooseneck 40ft'`. Devuelve el resultado como `tipoTrailerAnuncio` (o `null` si no hay match o no vino de un anuncio).
2. **Nodo "Build Claude Body Jack"**: si `item.tipoTrailerAnuncio` existe, se agrega un bloque de sistema adicional (mismo patrón que el `storeFact` de tienda más cercana): `DATO VERIFICADO POR SISTEMA: el cliente llegó escribiendo desde un anuncio del trailer tipo "X". Da el tipo de trailer por confirmado... NO le preguntes...`.
3. Se ajustaron dos secciones del prompt base para que no contradigan esta excepción:
   - `## INICIO DESDE ANUNCIO`: se agregó la excepción de saludar confirmando el tipo (sin preguntarlo) cuando hay dato verificado.
   - `## REGLA DE MODELO — NUNCA ASUMAS`: se agregó la excepción de que el dato verificado por sistema SÍ cuenta como si el cliente lo hubiera dicho.

## Validación antes de publicar
- Se simuló localmente en Node.js la lógica de ambos nodos con un contacto de prueba (`attributionSource.adId` de una de las campañas Dump) — confirmado: `tipoTrailerAnuncio: "Dump"` y el bloque de sistema se arma correctamente; con un contacto sin `adId`, `tipoTrailerAnuncio` sale `null` y no se agrega ningún bloque extra (sin cambio de comportamiento para conversaciones orgánicas).
- Se comparó el diff de versión (`get_workflow_versions_diff` contra la versión activa anterior) para confirmar que **solo** se modificaron esos 2 nodos, sin tocar conexiones ni otros nodos.
- Publicado con `publish_workflow`. Versión activa: `94651392-be3e-48eb-a097-56fea15cf844`.

## Limitación conocida / pendiente de mantenimiento
- La tabla `ad_id → tipo de traila` es **estática**, con los 11 `ad_id` de las 3 campañas activas hoy (Dump, Enclosed, Gooseneck 40ft).
- Cuando Jairo lance una campaña nueva para otro tipo de traila (Car Hauler, Flatbed, Equipment, Utility, Roll-Off — los otros productos que Jack ya sabe vender según el prompt), hay que agregar el/los `ad_id` nuevos a esa tabla en el nodo "Merge Nombre". Si no se agrega, no se rompe nada — Jack simplemente vuelve al comportamiento anterior (pregunta el tipo) para esos anuncios nuevos.
- Pendiente: confirmar con una conversación real (cliente entrando desde un anuncio activo) que Jack efectivamente saluda mencionando el tipo correcto y no pregunta.
