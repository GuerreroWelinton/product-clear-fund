# ADR-002 - PostgreSQL y Prisma

## Estado
Aceptado.

## Contexto
Se requieren transacciones, constraints, índices parciales, decimales exactos y relaciones claras. Prisma ofrece productividad suficiente para el tamaño del proyecto.

## Decisión
Usar PostgreSQL en Neon y Prisma ORM.

## Consecuencias
- Migrations versionadas.
- Uso de SQL específico cuando Prisma no cubra constraints avanzadas.
- Pruebas de integración sobre PostgreSQL real.
