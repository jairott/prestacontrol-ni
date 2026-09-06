# Contexto persistente — Sistema de ventas "sales 7/24" (Jairo)

Este repo (`prestacontrol-ni`) se usa como proyecto base de Claude Code para trabajar en el sistema de ventas 24/7 de Jairo (agentes de WhatsApp con n8n + Claude + GHL/Supabase para distintos negocios: TraiMax, Reparación de Crédito, Seguros/Protección Familiar, real estate). El código del repo en sí no es necesariamente donde vive la lógica — la mayoría del trabajo real ocurre en sistemas externos (n8n, Supabase, Meta Ads, WhatsApp Business).

**Al arrancar una sesión nueva en este proyecto, lee esto primero.** El detalle sesión por sesión vive en `/sesiones/YYYY-MM-DD/`.

## Skill de documentación

Existe la skill `documentar-sales724`: se debe usar por defecto (sin que Jairo la pida explícitamente) cada vez que se construye/prueba/depura algo de este sistema, para dejar rastro convertible en curso/manual. Genera checklist antes de grabar (Modo A) y log técnico + guion narrable después de cada sesión (Modo B), guardados en `/sesiones/YYYY-MM-DD/`.

## Estado del sistema "Liz" — retargeting WhatsApp (Protección Familiar / Seguros de Vida)

Ver detalle completo en `/sesiones/2026-09-05/02-log-tecnico.md`. Resumen vivo:

- **Workflow de retargeting** (`BBjrC6nhMDnVCb02` en n8n, "Liz - Reactivacion Retargeting"): **desactivado** desde 2026-09-05. Dos bugs reales ya corregidos (emparejamiento memoria↔contacto por índice de array; nodo desconectado que nunca movía deals a "No Cerrado (retargeting)").
- **Webhook de estado de entrega real** (`ZUqCBg58PIXpdX90`, "Liz - WhatsApp Status Webhook"): activo, recibe callbacks reales de Meta y actualiza `messages.status` en Supabase por `wa_message_id`.
- **Causa raíz de por qué no se entregan mensajes de marketing**: el número +1 432-924-1307 no tiene suficiente historial de engagement real (Meta exige ~1,000 conversaciones de calidad en 7 días para subir de nivel de confianza; solo había 1). No es un baneo — calidad de cuenta "Alta". Es el filtro de pacing de mensajes de marketing de Meta (error 131049).
- **La campaña de Meta Ads que alimentaba leads nuevos** ("Protección Familiar - Calculadora - Leads", cuenta `1603165764807455`) está **pausada** — de ahí que no haya tráfico nuevo construyendo esa reputación.
- **CRM** (Supabase `glxmakgcvzympuioqvlp`, app `jairott/leads-crm`): se borró por completo (contacts/deals/messages/appointments) el 2026-09-05 a pedido de Jairo para arrancar limpio.
- **Pendiente**: construir campaña de Meta Ads nueva con funnel Click-to-WhatsApp (anuncio → clic a WhatsApp con `ctwa_clid` → Liz responde → cita confirmada marca lead listo en n8n → evento de conversión a Meta vía Conversions API → cita con Lisbeth → póliza emitida). Falta decidir producto y el formato del evento de conversión.

## Reglas de esta memoria

- Nunca escribir valores reales de credenciales/tokens/API keys aquí ni en `/sesiones/` — referirse por nombre.
- Cuando algo de este resumen quede obsoleto (se reactiva el retargeting, se arregla la campaña, etc.), actualízalo en este archivo, no lo dejes desactualizado.
