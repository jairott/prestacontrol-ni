# Log técnico — 2026-09-05
## Sesión: Auditoría de retargeting WhatsApp "Liz" (Protección Familiar / Seguros de Vida)

## Contexto de arranque
- Jairo pidió auditar el retargeting de "Lisbet" (resultó ser Lisbeth Martínez, agente de reactivación de leads viejos por WhatsApp, no una audiencia de Meta Ads).
- Sistema real: n8n (`traimax2.app.n8n.cloud`) + Supabase (CRM propio "leads-crm") + WhatsApp Cloud API (número +1 432-924-1307).

## Hallazgo 1 — Envío en ráfaga sin control (día anterior)
- Se detectó que un lote de ~140 plantillas se mandó en menos de 3 minutos (sin el nodo de espera de 1 minuto, que se agregó después ese mismo día).
- Meta aceptó las 140 llamadas API sin error — pero "accepted" ≠ "delivered". El sistema no tenía forma de verificar entrega real.

## 🐛 Bug resuelto — Emparejamiento memoria↔contacto por índice de array
- Nodo "Leer Memoria Liz Por Telefono" (data table por-item) devolvía menos resultados de los esperados (1 en vez de 151).
- El código de "Evaluar Si Toca Enviar Hoy" emparejaba `campanaItems[i]` con `memoriaItems[i]` por posición — al desalinearse, la memoria de conversación de un contacto (el número de prueba de Jairo) se le pegaba al contacto en la posición 0.
- Efecto real: el contacto "elivicth diaz" quedaba marcado (incorrectamente) como "ya respondió" cada día, usando el historial de otro número.
- **Fix**: se reescribió la lógica para emparejar por número de teléfono (diccionario/lookup) en vez de por índice de array. Verificado contra datos reales: el contacto sin bug ahora evalúa correctamente a "enviar".

## 🐛 Bug resuelto — Nodo desconectado, deals nunca se movían de etapa
- El nodo "Preparar Marcado Respondido O Agotado" (marca en la tabla de campaña cuando alguien respondió o se agotó su secuencia, y dispara el movimiento del deal a la etapa "No Cerrado (retargeting)" en el CRM) no tenía ninguna conexión entrante desde "Evaluar Si Toca Enviar Hoy".
- Efecto real: confirmado en los datos del CRM — los 150 contactos de la campaña seguían apareciendo en la etapa "Nuevo Lead", indistinguibles de leads nuevos reales. Cero deals llegaron nunca a "No Cerrado (retargeting)".
- **Fix**: se agregó la conexión faltante. La función que filtra por `accion` ya maneja correctamente los tres casos ('enviar' / 'marcar_respondido' / 'marcar_agotado'), así que no hizo falta tocar lógica adicional.

## Nueva pieza de infraestructura — Webhook de estado de entrega real
- Se creó el workflow "Liz - WhatsApp Status Webhook" (nuevo, en n8n) que recibe los callbacks reales de Meta (sent/delivered/read/failed) vía handshake de verificación + endpoint POST.
- Se agregó una función RPC en Supabase (`update_whatsapp_message_status`) para actualizar el estado real del mensaje por `wa_message_id`.
- Se modificó la función de ingestión existente (`ingest_whatsapp_message`) para que guarde el `wa_message_id` real de Meta en cada mensaje saliente (antes no se guardaba, así que no había forma de correlacionar).
- Probado end-to-end con un mensaje de prueba antes de confiar en él con tráfico real.

## Hallazgo crítico — Envío de 20 mensajes, 0% de entrega real
- Se hizo un envío controlado de 20 mensajes (1 por minuto, pacing correcto) a los primeros 20 contactos de la campaña, reseteados a "día 0".
- El workflow de n8n reportó éxito (20/20 "accepted" por la API de Meta) y el CRM los marcó como "sent".
- Al cruzar cada `wa_message_id` contra los eventos reales que llegaron por el nuevo webhook: **los 20 fallaron**, con error 131049 de Meta ("This message was not delivered to maintain healthy ecosystem engagement").
- Se confirmó en WhatsApp Manager: la calidad de la cuenta sigue "Alta" (no es un baneo ni una restricción de cuenta) — es el filtro de pacing de mensajes de marketing de Meta, que bloquea la entrega cuando el número no tiene suficiente historial de engagement probado.
- Dato duro encontrado en "Límites de mensajería" de Meta: solo **1 conversación de calidad iniciada por la empresa en los últimos 7 días**, de las 1,000 que pide Meta para subir de nivel.

## Causa raíz final identificada
- La campaña de Meta Ads que generaba leads nuevos ("Protección Familiar - Calculadora - Leads", cuenta de anuncios `1603165764807455`, campaña `120248255144210278`) está **pausada** — mismos números de gasto/impresiones/clics que hace varios días, cero actividad nueva.
- Sin esa campaña activa, no entra tráfico nuevo real al número, no hay conversaciones iniciadas por clientes, y por lo tanto no hay forma de que Meta "confíe" en el número para entregar mensajes de marketing masivos.
- Mandar manualmente desde un teléfono personal **no ayuda** — la reputación de entrega está atada al número de WhatsApp Business específico (Phone Number ID), no es transferible.

## Decisiones y acciones tomadas
- Se pausó el workflow de retargeting automático (no va a correr el cron diario hasta reactivarlo).
- Se borró por completo el CRM (contactos, deals, mensajes, actividades, citas) a pedido explícito de Jairo, con respaldo temporal previo, para arrancar limpio.
- Se dejaron 20 contactos "activos" en la tabla de campaña (reseteados a día 0) y 131 desactivados temporalmente, para controlar el volumen del próximo lote.

## Pendiente para la siguiente sesión
- Construir una campaña de Meta Ads **nueva desde cero** con funnel tipo "Click-to-WhatsApp":
  `Anuncio en Meta → clic a WhatsApp (con ctwa_clid) → Liz responde → cita confirmada (lead marcado listo en n8n) → evento de conversión a Meta (Conversions API, formato por definir) → cita con Lisbeth → póliza emitida`.
- Decidir producto de la campaña nueva (Protección Familiar / Gastos Finales / ambos).
- Definir cómo se construye el evento de conversión hacia Meta cuando se confirma una cita.
- Confirmar si ya existe la lógica de "marcar lead listo" en algún workflow, o hay que construirla.
