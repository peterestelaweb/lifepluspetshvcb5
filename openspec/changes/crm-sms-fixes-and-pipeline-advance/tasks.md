## 1. SMS Launch — bugs críticos

- [x] 1.1 Quitar `encodeURIComponent` del número de teléfono en `buildSmsUrl`
- [x] 1.2 Reemplazar `window.location.href` por `<a>.click()` con `position:fixed`
- [x] 1.3 Verificar que Messages.app recibe número correcto y mensaje pre-rellenado

## 2. Template SMS — persistencia y contenido

- [x] 2.1 Añadir constante `SMS_TEMPLATE_KEY = "pets_crm_sms_template_v2"`
- [x] 2.2 Cargar template desde localStorage al iniciar (fallback a `DEFAULT_SMS_TEMPLATE`)
- [x] 2.3 Guardar en localStorage en cada edición del campo de plantilla
- [x] 2.4 Definir template oficial (≤ 149 chars GSM-7 con nombre largo): "Hola {nombre_corto}, somos Peter y Maika de LifePlus. Hemos visto tu ficha, creemos que nuestra nueva linea Pets te puede interesar. Te paso info?"
- [x] 2.5 Actualizar placeholder del input en index.html

## 3. UX — indicadores visuales y manual

- [x] 3.0a Mostrar dots ●/●●/●●● en botón SMS según intentos totales por contacto (verde/ámbar/rojo)
- [x] 3.0b Preservar scroll al re-renderizar la tabla (no más salto al inicio al pulsar SMS)
- [x] 3.0c Fusionar datos servidor+local por updated_at para evitar pérdida de interacciones al recargar
- [x] 3.0d Crear manual de usuario en crm/manual.html con enlace desde cabecera del CRM

## 4. Pipeline auto-advance — nueva funcionalidad

- [x] 4.1 Implementar `checkAndAutoAdvancePipeline()` en `app.js`
- [x] 4.2 Definir etapas que pueden avanzar automáticamente (nuevo, intento_1_enviado, intento_2_enviado)
- [x] 4.3 Lógica: última outbound ≥ 2 días + sin inbound posterior → avanzar etapa
- [x] 4.4 Añadir nota automática en historial con días transcurridos
- [x] 4.5 Llamar a `checkAndAutoAdvancePipeline()` después de `hydrateFromServer`
- [x] 4.6 Verificar que contactos con respuesta registrada NO avanzan
- [x] 4.7 Verificar que contactos en ganado/perdido/en_nurture NO avanzan

## 5. Mejoras UX propuestas — implementación parcial

- [x] 5.1 Banner de respuesta rápida al volver de Messages.app (`visibilitychange` → banner con "Sí / No / Más tarde")
- [ ] 5.2 Filas overdue en rojo — highlight rojo en tabla si `next_step_due` < hoy
- [ ] 5.3 Botón WhatsApp — abre `wa.me/34XXXXXXXXX?text=...` con la misma plantilla SMS
- [ ] 5.4 Filtro por responsable — dropdown Mónica / Belén junto a los filtros existentes
- [ ] 5.5 Estadísticas de respuesta — % respuesta por etapa del pipeline (panel debajo de la tabla)

### Notas para implementación futura

**5.2 — Filas overdue:**
En `renderTable()`, añadir clase `overdue` al `<tr>` si `item.next_step_due < today()`.
En CSS: `.overdue td { background: #fef2f2; }` o similar.

**5.3 — Botón WhatsApp:**
Similar a `sendSmsForContact()` pero con URL `https://wa.me/${phone}?text=${encodeURIComponent(message)}`.
Añadir botón "WA" junto al botón SMS en la columna Acciones.
También debería registrar outbound en historial y activar el banner de respuesta.

**5.4 — Filtro por responsable:**
En `index.html`, añadir `<select id="ownerFilter">` junto a `statusFilter`.
En `getFilteredContacts()`, añadir `.filter((item) => owner ? item.owner === owner : true)`.
Los valores son "Monica", "Belen" y "" (todos).

**5.5 — Estadísticas:**
Calcular por etapa: total contactos + % con al menos 1 inbound.
Mostrar como tabla o pills debajo del pipeline. Bajo prioridad.
