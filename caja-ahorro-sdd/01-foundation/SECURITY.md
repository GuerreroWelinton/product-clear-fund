# Seguridad

## Autenticación

- Better Auth con correo y contraseña.
- Registro público deshabilitado.
- Usuarios creados por Super Admin.
- Sesiones persistentes y revocables.
- Política de contraseña y bloqueo por intentos configurables.

## Autorización

- `SUPER_ADMIN`: acceso global.
- `TREASURER`: acceso solo a cajas asignadas.
- `MEMBER`: reservado para la fase futura y solo lectura.
- Cada consulta y mutación debe filtrar por caja autorizada.
- La UI puede ocultar acciones, pero la seguridad real se aplica en servidor.

## Protección de datos

- No registrar contraseñas, tokens ni datos sensibles completos en logs.
- Cédula y teléfono deben tener acceso restringido.
- Auditoría de cambios de cédula.
- Archivos opcionales en R2 usando object keys, no URL pública permanente.

## Controles financieros

- Transacciones para operaciones críticas.
- Restricciones únicas en base de datos.
- Reversas en lugar de edición destructiva.
- Protección contra doble envío mediante idempotencia.
