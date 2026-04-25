## ADDED Requirements

### Requirement: Pipeline avanza automáticamente tras 2 días sin respuesta
Al cargar el CRM, el sistema SHALL revisar todos los contactos en etapas activas y avanzar su pipeline si han pasado 2 o más días desde la última interacción outbound sin ninguna interacción inbound posterior.

Flujo de etapas automático:
- `nuevo` → `intento_1_enviado`
- `intento_1_enviado` → `intento_2_enviado`
- `intento_2_enviado` → `en_nurture`

El sistema NO avanzará contactos en etapas: `conversacion_abierta`, `interesado`, `propuesta_enviada`, `en_negociacion`, `ganado`, `perdido`, `en_nurture`.

#### Scenario: Contacto nuevo sin respuesta tras 2 días
- **WHEN** un contacto en etapa `nuevo` tiene una interacción outbound de hace 2 días o más y ninguna interacción inbound posterior
- **THEN** su etapa cambia a `intento_1_enviado` y se añade una nota automática en su historial

#### Scenario: Contacto con respuesta registrada
- **WHEN** un contacto tiene una interacción outbound seguida de una interacción inbound
- **THEN** su pipeline NO avanza automáticamente

#### Scenario: Contacto en etapa ganado o perdido
- **WHEN** un contacto está en etapa `ganado`, `perdido` o `en_nurture`
- **THEN** su pipeline NO avanza automáticamente independientemente del tiempo transcurrido

### Requirement: El avance automático queda registrado en el historial
Cada avance automático de pipeline SHALL generar una interacción de tipo `note` en el historial del contacto con información del motivo y días transcurridos.

#### Scenario: Nota generada por auto-avance
- **WHEN** el sistema avanza automáticamente el pipeline de un contacto
- **THEN** aparece en su historial una nota con texto "Sin respuesta tras X dias — avance automatico" donde X es el número real de días transcurridos
