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
