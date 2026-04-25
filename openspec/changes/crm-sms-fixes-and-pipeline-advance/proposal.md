## Why

El CRM de PETS Outreach tenía varios bugs críticos en el flujo SMS (número incorrecto en Messages.app, mensaje vacío, página que saltaba al inicio) y el template no persistía entre sesiones. Además, el equipo necesita que el pipeline avance automáticamente cuando un contacto no responde después de 2 días.

## What Changes

- Corregir la codificación del número de teléfono en la URL `sms:` (eliminando `encodeURIComponent` del número)
- Reemplazar `window.location.href` por `<a>.click()` con posición fija para evitar navegación y scroll
- Persistir el template SMS en `localStorage` para que sobreviva al refresco de página
- Definir y fijar el template SMS oficial (1 SMS GSM-7, máx. 149 chars con nombre largo)
- Añadir auto-avance de pipeline: tras 2 días sin respuesta inbound, el contacto avanza de etapa automáticamente con nota en historial

## Capabilities

### New Capabilities
- `sms-launch`: Flujo corregido de apertura de SMS desde CRM — número correcto, mensaje pre-rellenado, sin scroll, sin navegación
- `sms-template-persistence`: Template SMS guardado en localStorage y configurable por el usuario desde la UI
- `pipeline-auto-advance`: Avance automático de etapa de pipeline cuando no hay respuesta tras 2 días

### Modified Capabilities
- `crm`: El flujo de interacción SMS y el modelo de pipeline cambian de comportamiento

## Impact

- `crm/app.js`: lógica de SMS, template, auto-avance
- `crm/index.html`: placeholder del campo de template
- `localStorage`: nueva clave `pets_crm_sms_template_v2`
- Sin cambios en `api.php` ni en el esquema de datos del servidor
