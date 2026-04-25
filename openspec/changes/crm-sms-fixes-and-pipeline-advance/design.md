## Context

El CRM PETS Outreach es una app HTML/CSS/JS que corre en el servidor de Banahosting. Persiste datos en `localStorage` (cliente) y en `crm/data/contacts.json` vía `api.php` (servidor). El flujo SMS usa el protocolo `sms:` del sistema operativo para abrir Messages.app en Mac, que a su vez reenvía al iPhone del usuario.

El equipo (Peter y Maika) usa el CRM desde Mac para lanzar SMS fríos a contactos del sector veterinario y canino. Los datos de respuesta se anotan manualmente en el historial de interacciones.

## Goals / Non-Goals

**Goals:**
- SMS se abre con número correcto y mensaje pre-rellenado en Messages.app
- La página no salta al inicio al pulsar SMS
- El template SMS persiste entre sesiones de navegador
- El pipeline avanza automáticamente tras 2 días sin respuesta inbound registrada
- El template cabe en 1 SMS GSM-7 (≤ 160 chars sin caracteres UCS-2)

**Non-Goals:**
- Integración con pasarela SMS (Twilio/Vonage) — requiere arquitectura diferente
- Detección automática de respuestas SMS entrantes — imposible sin API de mensajería
- Envío automático sin acción humana — fuera de alcance en esta fase

## Decisions

**D1 — Quitar `encodeURIComponent` del número de teléfono**
El protocolo `sms:` espera el número sin codificar. `encodeURIComponent("+34...")` convierte `+` en `%2B`, corrompiendo el número que recibe Messages.app. El body sí debe ir codificado (`encodeURIComponent` en el mensaje).

**D2 — `<a>.click()` con `position:fixed` en vez de `window.location.href`**
`window.location.href = smsUrl` intenta navegar la pestaña actual, causando un micro-salto y scroll al inicio. Crear un `<a>` invisible con `position:fixed` y hacer `.click()` delega la apertura al OS sin afectar el estado del DOM ni la posición de scroll.

**D3 — `localStorage` con clave versionada (`_v2`) para el template**
Al cambiar el template por defecto, la clave anterior (`_v1`) tenía el texto antiguo cacheado. Versionar la clave fuerza carga limpia del nuevo default sin necesitar borrado manual por el usuario.

**D4 — Template GSM-7 de ≤ 149 chars (nombre largo incluido)**
Caracteres como `í`, `ó`, `á` fuerzan codificación UCS-2 (límite: 70 chars/SMS → 3 SMS). Eliminando esos caracteres y recortando el texto a 149 chars con el nombre más largo esperado, el mensaje cabe en 1 SMS GSM-7 (límite: 160 chars).

Template aprobado:
> "Hola {nombre_corto}, somos Peter y Maika de LifePlus. Hemos visto tu ficha, creemos que nuestra nueva linea Pets te puede interesar. Te paso info?"

**D5 — Auto-avance de pipeline en page load, no en background**
Sin servidor persistente ni cron job disponible, el chequeo se ejecuta cada vez que el usuario abre el CRM (`hydrateFromServer` → `checkAndAutoAdvancePipeline`). Esto es suficiente para el flujo de trabajo del equipo (abren el CRM al menos una vez al día).

Lógica:
- Solo avanza contactos en etapas `nuevo` → `intento_1_enviado` → `intento_2_enviado` → `en_nurture`
- Condición: última interacción outbound ≥ 2 días antes de hoy Y ninguna interacción inbound posterior
- Acción: avanzar etapa + añadir nota automática en historial + guardar en servidor

## Risks / Trade-offs

- **Falso avance si no se registran respuestas** → Si el equipo recibe una respuesta pero no la anota en Historial, el pipeline avanzará igualmente. Mitigación: recordatorio en la UI ("¿Recibiste respuesta? Anótala en Historial").
- **El auto-avance solo ocurre al abrir el CRM** → Si nadie abre el CRM en varios días, los avances se acumulan. Mitigación: aceptable para el volumen actual del equipo.
- **Template fijo no permite personalización por contacto** → El campo de plantilla en la UI permite edición manual antes de enviar, pero no hay variables adicionales por defecto. Mitigación: se pueden añadir variables (`{organizacion}`, `{upline}`) en futuras iteraciones.
