# ADR-003 - Better Auth

## Estado
Aceptado.

## Contexto
No se compararon alternativas. Dos restricciones definieron la elección:

- No depender de un servicio externo de pago para autenticar.
- Por regla de negocio inicial, los usuarios no se registran solos: en una primera instancia solo el Super Admin los crea.

Al no haber evaluación comparativa, esta decisión no descarta ninguna otra librería: un reemplazo posterior solo necesita cumplir esas dos restricciones.

## Decisión
Usar Better Auth con correo y contraseña, sesiones persistentes y registro público deshabilitado.

## Consecuencias
- Usuarios creados por Super Admin.
- Roles y asignaciones de caja gestionados en el dominio.
- Preparar recuperación de contraseña mediante proveedor de correo.
