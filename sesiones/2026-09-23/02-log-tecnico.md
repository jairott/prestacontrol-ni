# Log técnico — 2026-09-23

## 1. Investigación sin resolver — Landing page de Protección Familiar / etiqueta Google Ads

Jairo pegó un mensaje de WhatsApp de Lisbet (Lisbeth) pidiendo instalar una etiqueta de Google Ads (`gtag.js`, `AW-18414473405`) + evento de conversión "Enviar formulario" en una landing page con formulario ("la que hiciste").

**No se encontró la landing page en ningún lugar accesible:**
- No hay registro en la memoria del proyecto (`CLAUDE.md`, `/sesiones/`).
- Los anuncios de Meta de la campaña "Protección Familiar - Calculadora - Leads" (cuenta `1603165764807455`, campaign `120248255144210278`) van **directo a WhatsApp** (Click-to-WhatsApp) — no tienen `link_url` ni landing page. Confirmado revisando las 9 creatividades de la campaña vía Meta Ads MCP.
- Abency (WordPress) está bloqueado: prueba gratuita vencida, sin plan activo.
- No existe ningún repo de GitHub para esa landing (solo existen `leads-CRM`, `prestacontrol-ni`, `Reparacion-de-Credito`, `control-prestamos-pro`).

**Conclusión:** esa landing page con formulario es algo nuevo, no construido en ninguna sesión anterior documentada, o vive en una herramienta no rastreada aquí (posible GHL funnel, o algo hecho fuera de este sistema). **Pendiente:** Jairo va a pedirle el link directo a Lisbet.

## 🐛 Bug resuelto (percepción del usuario) — "La caja no resta los préstamos"

- **Síntoma reportado:** Jairo no veía que los préstamos nuevos restaran de la Caja.
- **Causa real:** no era un bug — el diseño (de una sesión anterior no documentada, ver commits `86e0cdf`, `e1f94c7`) separaba deliberadamente "Caja" (efectivo operativo) de "Capital" (fondo de inversión): los préstamos nuevos solo restaban de `movimientos_capital`, nunca de `movimientos_caja`. Verificado en Supabase: los 5 préstamos ya existentes sí estaban restando correctamente C$23,000 del Capital disponible — pero como nunca se había registrado ningún aporte de capital inicial, "Capital disponible" mostraba **-C$23,000**, lo cual daba la impresión de que nada se estaba restando.
- **Decisión de Jairo:** prefiere que los préstamos también resten de Caja (no solo de Capital) — refleja mejor el efectivo real que sale de la mano.

### Cambios aplicados
- `src/pages/NuevoPrestamo.jsx`: al crear un préstamo, ahora inserta un movimiento tipo `salida` en `movimientos_caja` (además del ya existente en `movimientos_capital`), con el mismo monto/concepto/fecha/`prestamo_id`.
- `src/pages/FlujoCaja.jsx`: se corrigió el texto explicativo de la pestaña Caja, que decía que los préstamos nuevos NO se registraban ahí (ya no es cierto).
- **Backfill en Supabase** (`movimientos_caja`): se insertaron 5 filas `salida` para los préstamos ya existentes que no tenían su movimiento de caja registrado — incluye un movimiento huérfano de C$7,000 (Leonor) con `prestamo_id = null`, de un préstamo que se había borrado y vuelto a crear; se conservó como salida real de efectivo aunque ya no esté ligado a un préstamo vivo.
- Verificado: `npm run build` sin errores antes de cada push a `main`.

### Estado de Caja después del fix
- Entradas: C$59,522.35 (58 movimientos)
- Salidas: C$76,018.51 (26 movimientos, incluye los 5 backfilled)
- Saldo: **-C$16,496.16**

Nota para la próxima sesión: el saldo de Caja queda negativo porque tampoco hay ningún aporte inicial registrado ahí (a diferencia de Capital, Caja no tiene concepto de "aporte" — solo entradas por cobro de cuotas y salidas). Si Jairo empezó con efectivo propio antes de usar la app, probablemente quiera registrar esa entrada inicial manualmente con "Nuevo movimiento" en la pestaña Caja para que el saldo refleje la realidad.
