# F01 - Autenticación y sesiones

## Estado

Propuesta para revisión.

## Fase

Fase 0

## Dependencias

Ninguna.

## Propósito

Permitir acceso seguro a usuarios administrativos creados por un Super Admin, con sesiones persistentes y revocables.

## Historias y requisitos funcionales

- **FR-F01-001:** Como Super Admin quiero crear cuentas de tesorero para controlar quién puede operar.
- **FR-F01-002:** Como usuario quiero iniciar y cerrar sesión de forma segura.
- **FR-F01-003:** Como Super Admin quiero deshabilitar una cuenta sin borrar su historial.

## Reglas de negocio

- **BR-F01-001:** El registro público está deshabilitado.
- **BR-F01-002:** El primer Super Admin se crea mediante seed o comando administrativo controlado.
- **BR-F01-003:** Las contraseñas se almacenan mediante Better Auth.
- **BR-F01-004:** Una cuenta deshabilitada no puede iniciar sesión y sus sesiones activas deben revocarse.
- **BR-F01-005:** Los roles globales iniciales son SUPER_ADMIN y TREASURER; MEMBER queda reservado.

## Entidades relacionadas

User, Session, Account

## Fuera de alcance

- Funcionalidades no mencionadas expresamente en esta especificación.
- Automatizaciones o integraciones externas no incluidas en el MVP.
- Edición destructiva de registros financieros.

## Casos límite

- Credenciales incorrectas.
- Usuario deshabilitado con sesión existente.
- Doble creación del mismo correo.

## Criterio de salida

La feature se considera especificada cuando el responsable funcional confirma que todos los requisitos y reglas representan la operación real.
