# Log técnico — sesión 2026-08-28 — Proyecto sales 7/24

Contexto: sesión de trabajo sobre el sistema de ventas 24/7 (Jack/TraiMax, Luis/Reparación de Crédito), en n8n + GHL + Claude API. Este documento es la fuente de verdad para retomar el trabajo en la próxima sesión.

---

## 🐛 Bug resuelto — Luis: sin reintento ante error transitorio de Claude API

- **Workflow:** n8n "Luis - Reparación de Crédito (GHL)" — id `uMGsH4jUPoc1JAFh`
- **Nodo afectado:** "Claude API Luis"
- **Síntoma:** la API de Anthropic devolvió un 503 `overloaded_error` (transitorio) y el nodo no reintentó, dejando al cliente sin ninguna respuesta.
- **Caso real observado:** clienta Judith T Vidal (contactId `JbH2QTFLtNNSuu98r6Tu`) escribió pidiendo un préstamo personal de $3000 y nunca recibió respuesta. Se le contestó manualmente después de detectar el fallo.
- **Fix aplicado:** `retryOnFail: true`, 3 intentos, 3s de espera entre cada uno.

## Luis — cambios de prompt (no bug, mejora de comportamiento)

- Regla nueva: si el cliente usa frases de urgencia ("para hoy", "ahorita", "ya", "urgente") sin mencionar explícitamente crédito/deuda, el agente lo interpreta como intención de **agendar la llamada**, no como referencia a su situación crediticia. Antes el agente ignoraba esa señal y seguía el guion de calificación normal.
- Regla nueva "SERVICIO — LO QUE NO SOMOS": si el cliente pide un préstamo/dinero directo, el agente aclara de inmediato que no prestan dinero, solo orientan a mejorar el crédito, antes de seguir con cualquier otra pregunta.

---

## 🐛 Bug resuelto — Jack: credencial vencida silenciaba clientes post-LEAD_LISTO

- **Workflow:** n8n "Jack - TraiMax WhatsApp GHL" — id `7LrqZC313XsBiDAB`
- **Nodo afectado:** "Enviar Reafirmacion Post-Lead"
- **Síntoma:** el nodo usaba una credencial GHL distinta y vencida ("Header Auth account") en vez de la credencial correcta ("GHL TRAIMAX", la misma que usan todos los demás nodos del workflow) → error 401 Invalid JWT → la ejecución se detenía por completo, sin llegar a notificar a Jairo, y el contacto quedaba marcado internamente como "ya atendido" para siempre (silencio total en mensajes futuros, por diseño del código).
- **Caso real observado:** clienta Gracia Hernández (contactId `ZsD63sLNld6NhQ03mAuO`), ya calificada con Jack (cotización + link de reserva enviado), escribió dos mensajes de seguimiento sin recibir nada, incluyendo un "Eres fraude" por la frustración. Se le contestó manualmente tras el diagnóstico.
- **Fix aplicado:** credencial corregida a "GHL TRAIMAX", + `retryOnFail` (3 intentos, 3s) + `onError: continueRegularOutput` para que un fallo futuro en este nodo no bloquee la notificación a Jairo.

## Jack — cambio nuevo para habilitar retargeting

- Se agregó un paso en paralelo a "Notificar Lead Listo Jack": cuando se emite LEAD_LISTO por primera vez, el contacto se etiqueta en GHL con el tag **`lead-listo-sin-agendar`**. Esto no existía antes — sin este tag no había forma de distinguir, desde fuera de la memoria interna de n8n, quién llegó al final del embudo pero no agendó.

## Pendiente sin resolver — Jack

- No existe forma de resetear remotamente el estado "postLeadListoReplied" de un contacto específico que quedó atascado/silenciado. El comando `RESET` que ya existe en el código del workflow solo limpia el estado del propio número de Jairo (uso interno de prueba), no el de un cliente arbitrario.
- Mejora futura sugerida (no implementada): agregar un comando tipo `RESET +1XXXXXXXXXX` que Jairo pueda mandar por WhatsApp para desatascar a un cliente específico sin necesitar intervención técnica.

---

## Retargeting Detector — nuevo workflow (construido hoy)

- **Nombre:** "Retargeting Detector - TraiMax (Jack)"
- **id n8n:** `Hay3ONbPmT9I5YHn`
- **Estado:** ACTIVO, publicado
- **Trigger:** Schedule diario, 9:00 AM, timezone `America/Chicago` (Austin, TX)
- **Qué hace:**
  1. Busca oportunidades **abiertas** del pipeline GHL "Traimax Sales Pipeline" (pipeline id `6abJRch3Lg6dQNvjgywT`, location id `T7tpDCH03ollRIXkBx2g`) vía `GET /opportunities/search`, con paginación (usa `nextPageUrl` de la respuesta).
  2. Clasifica cada oportunidad en 3 buckets:
     - **Conversación sin responder:** etapa "New lead" o "contacted", +24h sin actividad (`updatedAt`).
     - **LEAD_LISTO sin agendar:** contacto con tag `lead-listo-sin-agendar`, +24h desde que se marcó.
     - **Cotización sin cerrar:** etapa "Qualified" o "Docs Sent", +72h (3 días) sin avanzar.
     - (Se excluyen "Deposit Received" y "Sold" — ya cerradas.)
  3. Manda un **resumen** por WhatsApp a Jairo (contactId interno `HSbVTjcKHOqCt5hdLt6h`) con conteos y lista parcial de cada bucket.
  4. **NO envía ningún mensaje a clientes todavía.**

### 🐛 Bug resuelto durante la construcción — nombres de query camelCase

- El endpoint `GET /opportunities/search` de GHL rechazó la primera versión del query (`locationId`, `pipelineId` en camelCase) con 422: `"property locationId should not exist"`, `"location_id must be a string"`. La API exige **snake_case** (`location_id`, `pipeline_id`). Corregido y verificado con datos reales.

### Resultado de la última corrida real (28-ago-2026)

- 86 leads en "conversación sin responder"
- 37 leads en "cotización sin cerrar"
- 0 leads en "LEAD_LISTO sin agendar" (esperado — el tag se agregó hoy mismo, este bucket se irá llenando con leads nuevos a partir de ahora)
- **Total: 123 leads fríos** en el pipeline en este momento.

---

## Plantilla de WhatsApp confirmada para el retargeting

- **Nombre exacto:** `traila_seguimiento_general`
- **Estado en Meta:** APPROVED
- **Categoría:** Marketing
- **Ubicación en GHL:** Configuración → WhatsApp → Plantillas (cuenta TraiMax)
- **Texto completo** (usa el merge field `{{contact.name}}`, GHL lo resuelve automáticamente — no hace falta mandar placeholders manuales):

  > Hola {{contact.name}} 👋
  >
  > ¿Sigues interesado en el trailer que estabas buscando?
  >
  > Tenemos disponibilidad limitada y opciones para todos:
  > ⚡ Sin revisar crédito
  > ✅ Aprobación el mismo día
  >
  > Cada día que esperas es dinero que estás dejando en la mesa. 💪
  >
  > ¿Le entramos hoy?

- **Decisión tomada:** se usa ESTA misma plantilla para los 3 buckets de retargeting (no se crearon plantillas distintas por bucket).
- Existen otras 3 plantillas activas en la misma cuenta (`traila_seguimiento_1`, `trailer_followup_1` en inglés, `reenganche_trailers`) que no se están usando por ahora.

---

## 🚧 BLOQUEO ACTUAL — punto exacto donde retomar la próxima sesión

**Objetivo pendiente:** conectar el envío automático real de `traila_seguimiento_general` a los 123 leads fríos (repartidos en el tiempo, no todos de golpe — riesgo de baneo de WhatsApp por volumen).

**Por qué está bloqueado:**
- El endpoint `POST /conversations/messages` de GHL acepta un campo `templateId`, pero **exige el ID interno de GHL de la plantilla, no su nombre**. Se probó pasando `"traila_seguimiento_general"` como `templateId` y GHL devolvió 422: `"Template not found for id:traila_seguimiento_general"`.
- Se buscó exhaustivamente en el catálogo de operaciones públicas de GHL un endpoint para listar plantillas de WhatsApp y **no existe** (el endpoint genérico `/locations/{locationId}/templates?type=whatsapp` devuelve vacío — esas plantillas viven en un sistema interno de GHL/Meta que no está expuesto por API).
- El ID tampoco es visible fácilmente desde la UI de GHL (no aparece en la URL de forma clara en las capturas revisadas).

**Plan acordado para resolverlo (aprobado por Jairo, aún no ejecutado):**
1. Jairo arma un **flujo nativo de GHL** de 2 pasos:
   - Trigger: cualquiera simple (no importa cuál — el trigger real no se usa, la inscripción va a ser por API)
   - Acción: "Enviar plantilla de WhatsApp" → seleccionar `traila_seguimiento_general` **desde el dropdown de la UI** (ahí GHL resuelve el ID internamente, sin que haga falta conocerlo)
   - Publicar el flujo
2. Claude conecta el n8n "Retargeting Detector" para que, en vez de (o además de) solo notificar a Jairo, **inscriba automáticamente** a cada lead frío calificado en ese flujo de GHL, usando la operación `add-contact-to-workflow` de la API pública de GHL (`POST /contacts/{contactId}/workflow/{workflowId}`) — esta operación SÍ existe y no requiere el ID de la plantilla, solo el ID del workflow de GHL.
3. Agregar lógica de control: repartir el envío (ej. 15-20/día en vez de los 123 de golpe) y evitar reinscribir al mismo contacto más de una vez (tag de control tipo `retargeted-<bucket>` tras la inscripción).

**Estado a la fecha de hoy:** el flujo de GHL descrito en el paso 1 **todavía NO existe** — se verificó por API (`GET /workflows/`) y solo aparecen los 4 workflows de siempre: "Jack WhatsApp Agent" (publicado), "Joe experto en lead" (borrador), "New Workflow : 1784231900114" (borrador vacío), "leads form de facebook" (borrador). Ninguno es de retargeting.

**Próximo paso concreto:** confirmar con Jairo si ya armó ese flujo de 2 pasos; si sí, pedir el `workflowId` (visible en la URL de GHL al abrir el flujo) y conectar el paso 2 en n8n.

---

## Hallazgo aparte (fuera de alcance de retargeting, NO tocar)

- El número de llamadas/SMS de TraiMax (+14323007432, "Jairo's number 3") tiene el registro **A2P 10DLC incompleto/erróneo** en GHL (Configuración → Sistema telefónico → Centro de confianza). Esto causa que **todos** los SMS automáticos de "te devolvemos la llamada" (missed call text-back nativo de GHL) fallen con error Twilio 30034 (`Number not A2P compliant`).
- No hay API pública para gestionar esto — es un trámite de cumplimiento legal (EIN, razón social) que solo se hace desde la UI de GHL.
- **Jairo pidió explícitamente NO seguir intentando resolver esto** — no tocar en próximas sesiones salvo que él lo pida de nuevo directamente.
