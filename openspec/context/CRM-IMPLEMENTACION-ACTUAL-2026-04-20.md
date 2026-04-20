# CRM Implementacion Actual (2026-04-20)

## Objetivo

Dejar documentado el estado real del CRM de LIFEPLUS PETS para que el proyecto pueda continuar en nuevas sesiones sin perder decisiones tecnicas.

## Resumen de arquitectura

- Web publica: `index.html` y `guia.html`.
- CRM publicado: carpeta `crm/` en la raiz del proyecto.
- Acceso discreto al CRM desde la home:
  - Mantener pulsado 2 segundos el logo superior (`.nav-logo`) redirige a `/crm/`.
- Persistencia:
  - Primario: servidor via `crm/api.php` (archivo `crm/data/contacts.json`).
  - Fallback: `localStorage` en cliente.

## Archivos clave

- `crm/index.html`
- `crm/app.js`
- `crm/styles.css`
- `crm/import/monica-normalized.csv`
- `crm/import/belen-normalized.csv`
- `crm/api.php`
- `crm/data/contacts.json`
- `.github/workflows/deploy-banahosting.yml`

## Funcionalidad implementada

### 1) Gestion de contactos

- Alta, edicion y borrado de contactos.
- Pipeline y estado de respuesta.
- Proximo paso y fecha.
- Responsable / upline visible en tabla.

### 2) Historial por contacto

Cada contacto puede registrar interacciones con:

- fecha/hora
- canal (`sms`, `whatsapp`, `phone_call`, etc.)
- tipo (`outbound`, `inbound`, `note`)
- si respondio
- resumen de accion
- que dijo
- resultado
- proximo paso / fecha
- responsable

Tambien se puede exportar historial completo a CSV.

### 3) Importaciones por upline

Botones en CRM:

- `Importar Monica` -> `./import/monica-normalized.csv`
- `Importar Belen` -> `./import/belen-normalized.csv`

Comportamiento:

- Asigna `owner` automaticamente (`Monica` o `Belen`).
- Deduplicacion basica por telefono o nombre.
- Guarda trazabilidad en `source` (incluyendo PIN y ultimo mes cuando existe).

### 4) Persistencia en servidor

API simple en `crm/api.php`:

- `GET` -> devuelve `contacts`.
- `POST` -> guarda `{ "contacts": [...] }` en `crm/data/contacts.json`.

La app CRM en `crm/app.js`:

- intenta cargar desde API al iniciar.
- guarda en API en cada cambio.
- mantiene `localStorage` como respaldo de resiliencia.

## Deploy

Workflow: `.github/workflows/deploy-banahosting.yml`

Cambios aplicados:

- ahora incluye trigger por `crm/**`.
- copia `crm/` tanto en version principal como en neutra.

Sin este ajuste, el CRM no se subia al servidor aunque existiera en Git.

## Notas operativas

- Si `crm/api.php` responde error de escritura, revisar permisos de `crm/data/` en hosting.
- Para continuidad entre sesiones: mantener rutina `recall` al inicio y `wrapup` al cierre.

## Pendientes sugeridos

- Filtro rapido por `owner` y por tareas vencidas.
- Login real (backend) si se requiere seguridad fuerte.
- Migracion futura de `contacts.json` a base de datos (MySQL/PostgreSQL) si aumenta el volumen.

