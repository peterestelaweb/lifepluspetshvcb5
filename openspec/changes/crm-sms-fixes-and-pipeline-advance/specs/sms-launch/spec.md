## ADDED Requirements

### Requirement: SMS se abre con número correcto
Al pulsar el botón SMS de un contacto, el sistema SHALL construir la URL `sms:` con el número de teléfono sin codificar (el `+` del prefijo internacional no debe convertirse en `%2B`).

#### Scenario: Contacto con prefijo +34
- **WHEN** el contacto tiene teléfono `+34629609187` y se pulsa SMS
- **THEN** Messages.app se abre con destinatario `+34629609187` (no `%2B34629609187`)

#### Scenario: Contacto sin prefijo de país
- **WHEN** el contacto tiene teléfono `629609187` (sin +34)
- **THEN** Messages.app se abre con el número tal como está almacenado

### Requirement: El mensaje SMS aparece pre-rellenado
Al abrir Messages.app desde el CRM, el sistema SHALL incluir el texto del template en el campo de mensaje, con `{nombre_corto}` sustituido por el nombre real del contacto.

#### Scenario: Nombre en formato "Apellidos, Nombre"
- **WHEN** el contacto tiene nombre `García-Román Ramírez, Juan Carlos`
- **THEN** el mensaje contiene `Juan García-Román` (primer nombre + primer apellido)

#### Scenario: Nombre en formato "Nombre Apellido Apellido"
- **WHEN** el contacto tiene nombre `Lourdes Izquierdo Lujan`
- **THEN** el mensaje contiene `Lourdes Izquierdo`

### Requirement: La página no salta al inicio al pulsar SMS
El sistema SHALL abrir el protocolo `sms:` sin causar scroll ni navegación en la página del CRM.

#### Scenario: Pulsar SMS en contacto a mitad de lista
- **WHEN** el usuario está con la lista scrollada y pulsa SMS
- **THEN** la posición de scroll se mantiene después de que Messages.app se abre
