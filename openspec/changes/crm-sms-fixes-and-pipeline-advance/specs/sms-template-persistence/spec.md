## ADDED Requirements

### Requirement: Template SMS persiste entre sesiones
El sistema SHALL guardar el texto del template SMS en `localStorage` (clave `pets_crm_sms_template_v2`) cada vez que el usuario lo edite, y cargarlo automáticamente al abrir el CRM.

#### Scenario: Usuario edita el template y recarga la página
- **WHEN** el usuario escribe un texto personalizado en el campo de plantilla y recarga el CRM
- **THEN** el campo muestra el texto guardado, no el template por defecto

#### Scenario: Primera carga sin template guardado
- **WHEN** no existe `pets_crm_sms_template_v2` en localStorage
- **THEN** el campo muestra el template oficial por defecto

### Requirement: Template por defecto es 1 SMS GSM-7
El template por defecto SHALL caber en un único SMS de codificación GSM-7 (≤ 160 caracteres) con cualquier nombre corto esperado (máx. 20 caracteres), sin usar caracteres fuera del alfabeto GSM-7 (sin á, é, í, ó, ú, ñ, ü).

#### Scenario: Nombre largo
- **WHEN** `{nombre_corto}` se sustituye por `Juan Garcia-Roman` (17 chars)
- **THEN** el mensaje resultante tiene ≤ 160 caracteres y no contiene caracteres UCS-2

#### Scenario: Template aprobado
- **WHEN** se usa el template por defecto sin modificar
- **THEN** el texto es exactamente: "Hola {nombre_corto}, somos Peter y Maika de LifePlus. Hemos visto tu ficha, creemos que nuestra nueva linea Pets te puede interesar. Te paso info?"
