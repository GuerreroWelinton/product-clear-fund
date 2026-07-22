# Especificaciones SDD - Caja de Ahorro

Este paquete convierte el plan funcional del proyecto en un conjunto de especificaciones pequeñas, trazables y desarrollables por feature.

## Cómo usar este repositorio

La implementación sigue **Spec-Driven Development (SDD)**:

1. Leer y aprobar `spec.md`: define qué debe hacer la feature y por qué.
2. Revisar `plan.md`: define cómo se implementará sin alterar los requisitos.
3. Ejecutar `tasks.md` en orden, marcando cada tarea terminada.
4. Verificar `acceptance.md` antes de considerar la feature completada.
5. Actualizar la matriz de trazabilidad y registrar cualquier cambio de decisión mediante un ADR.

No se debe comenzar una feature si incumple la Definición de Preparado ubicada en `00-governance/DEFINITION_OF_READY.md`.

## Orden recomendado

Consultar:

- `00-governance/MASTER_ROADMAP.md`
- `00-governance/DEPENDENCY_MAP.md`
- `01-foundation/ARCHITECTURE.md`
- `02-domain/DOMAIN_MODEL.md`
- `03-features/`

## Stack acordado


- Next.js 16 con App Router.
- Node.js 24 LTS.
- TypeScript en modo estricto.
- PostgreSQL en Neon.
- Prisma ORM.
- Better Auth con correo y contraseña; registro público deshabilitado.
- Tailwind CSS 4, Shadcn/ui y tokens inspirados en Material Design 3.
- Recharts para visualizaciones.
- Cloudflare R2 para archivos opcionales.
- Railway Hobby para despliegue.
- Vitest para pruebas unitarias/integración y Playwright para pruebas E2E.
- pnpm como único gestor de paquetes.


## Principios obligatorios

- No usar números de punto flotante para dinero.
- No eliminar operaciones financieras; corregir mediante reversas.
- Ejecutar operaciones financieras críticas dentro de transacciones.
- Separar estrictamente los datos por caja.
- Autorizar en servidor cada lectura y escritura.
- Generar procesos automáticos de forma idempotente.
- Guardar snapshots de reglas históricas en cuotas, préstamos y cierres.
- Usar la zona `America/Guayaquil` para reglas de negocio y UTC para persistencia de timestamps.
