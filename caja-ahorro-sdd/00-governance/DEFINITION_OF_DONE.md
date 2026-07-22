# Definición de Terminado

Una feature se considera completada cuando:

- Todos los requisitos funcionales están implementados.
- Todos los criterios de aceptación pasan.
- Las pruebas unitarias, de integración y E2E definidas pasan.
- Las acciones sensibles verifican autorización en servidor.
- Las operaciones críticas usan transacciones.
- No existen rutas que permitan saltarse reglas del dominio.
- Los eventos de auditoría requeridos se generan.
- La documentación y contratos fueron actualizados.
- Se ejecutó una revisión visual en resoluciones de escritorio y móvil.
- Prisma migrations se probaron desde una base vacía y desde la versión anterior.
- No hay errores críticos de lint, tipos o seguridad.
- El comportamiento fue validado con datos de una caja de prueba.
