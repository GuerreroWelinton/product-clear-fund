# Clear Fund

Sistema de gestión para cajas de ahorro comunitarias: aportes mensuales de los socios, préstamos por rondas y turnos, y cierre anual con distribución de rendimientos.

Es un proyecto personal en desarrollo activo. Este repositorio contiene la aplicación y, junto a ella, el paquete de especificaciones con el que se construye.

## Estado

**5 de 25 features completadas.** El estado por feature vive en [`caja-ahorro-sdd/00-governance/TRACEABILITY.md`](caja-ahorro-sdd/00-governance/TRACEABILITY.md) y se mantiene al día durante el desarrollo.

| Feature | Qué cubre | Estado |
|---|---|---|
| F01 | Autenticación y sesiones | Completada |
| F02 | Ciclo de vida de cajas | Completada |
| F03 | Asignación de tesoreros | Completada |
| F20 | Libro de caja y saldo | Completada |
| F23 | Auditoría | Completada |
| F04 – F19, F21, F22, F24, F25 | Personas, ahorros, préstamos, gastos, cierre, reportes, portal de socio | Especificadas, sin implementar |

Las features no implementadas ya tienen requisitos, plan técnico, tareas y criterios de aceptación escritos. Sus módulos existen en `clear-fund/src/modules/` con las capas vacías hasta que llega su turno.

## Cómo se construye

El desarrollo sigue **Spec-Driven Development**. Ninguna feature empieza sin cumplir la Definición de Preparado, y el orden es siempre el mismo:

1. `spec.md` define qué debe hacer la feature y por qué.
2. `plan.md` define cómo se implementa, sin alterar los requisitos.
3. `tasks.md` se ejecuta en orden.
4. `acceptance.md` se verifica antes de dar la feature por terminada.
5. Todo cambio de decisión se registra como ADR.

Son 151 archivos Markdown en [`caja-ahorro-sdd/`](caja-ahorro-sdd/), organizados en gobernanza, fundamentos, dominio, features, implementación, migración, calidad, plantillas y referencia.

## Decisiones registradas

Catorce ADRs, cada uno con contexto, decisión y consecuencias. Los seis primeros fijan la arquitectura; el resto acota el alcance de features concretas.

| ADR | Decisión |
|---|---|
| [001](caja-ahorro-sdd/01-foundation/adrs/ADR-001-modular-monolith.md) | Monolito modular |
| [002](caja-ahorro-sdd/01-foundation/adrs/ADR-002-postgresql-prisma.md) | PostgreSQL y Prisma |
| [003](caja-ahorro-sdd/01-foundation/adrs/ADR-003-better-auth.md) | Better Auth |
| [004](caja-ahorro-sdd/01-foundation/adrs/ADR-004-immutable-ledger.md) | Ledger financiero inmutable |
| [005](caja-ahorro-sdd/01-foundation/adrs/ADR-005-no-docker-mvp.md) | Docker no obligatorio en el MVP |
| [006](caja-ahorro-sdd/01-foundation/adrs/ADR-006-snapshots.md) | Snapshots para reglas históricas |
| [007](caja-ahorro-sdd/01-foundation/adrs/ADR-007-auth-module-name.md) – [014](caja-ahorro-sdd/01-foundation/adrs/ADR-014-f20-cash-ledger-balance-scope.md) | Alcance, costuras y diferimientos de F01, F02, F03, F20 y F23 |

El ADR-004 es el que más condiciona el código: todo cambio de saldo nace de un movimiento de caja, no existen ajustes manuales ni borrado de movimientos, y las correcciones se hacen mediante reversas. La razón está escrita ahí: un saldo sin el movimiento que lo produjo no se puede explicar ni auditar.

## Reglas que el código no negocia

- El dinero no usa punto flotante.
- Las operaciones financieras no se eliminan; se corrigen con reversas.
- Las operaciones financieras críticas corren dentro de transacciones.
- Los datos están separados estrictamente por caja.
- Cada lectura y escritura se autoriza en el servidor.
- Los procesos automáticos son idempotentes.
- Cuotas, préstamos y cierres guardan snapshot de las reglas vigentes.
- Las reglas de negocio usan `America/Guayaquil`; los timestamps se persisten en UTC.

## Arquitectura

Monolito modular. Cada módulo guarda sus reglas dentro de sí mismo y no depende de los detalles internos de otro: la comunicación pasa siempre por la capa `application`, nunca por `domain` o `infrastructure` ajenos.

| Capa | Responsabilidad |
|---|---|
| `domain/` | Reglas puras y tipos del negocio, sin Prisma ni Next |
| `application/` | Casos de uso; única puerta de entrada al módulo |
| `infrastructure/` | Prisma, repositorios y adaptadores |
| `schemas/` | Validación de entrada y salida con Zod |
| `ui/` | Componentes del módulo, sin cálculos ni acceso a datos |

Cuatro fronteras se respetan sin excepción: la UI no hace cálculos financieros, los route handlers y server actions no implementan reglas, Prisma no se filtra a los componentes, y toda operación financiera confirma dominio, ledger y auditoría dentro de la misma transacción.

Detalle completo en [`01-foundation/ARCHITECTURE.md`](caja-ahorro-sdd/01-foundation/ARCHITECTURE.md) y en [`clear-fund/src/modules/README.md`](clear-fund/src/modules/README.md).

## Stack

Next.js 16 con App Router · React 19 · TypeScript estricto · PostgreSQL en Neon · Prisma 7 · Better Auth · Zod 4 · Tailwind CSS 4 con shadcn/ui · Recharts · Vitest y Playwright · pnpm · Node.js 24 LTS

## Pruebas

Las pruebas unitarias viven junto al caso de uso que verifican, no en un árbol aparte.

La suite de integración corre contra un PostgreSQL real, no contra mocks, porque hay dos garantías que un mock no puede observar: la inmutabilidad del rastro de auditoría es un trigger de base de datos, y la atomicidad de F02 y F03 depende de una transacción interactiva real. En CI se fija PostgreSQL 18 para igualar la versión mayor que corre en Neon.

`pnpm test:integration` se niega a arrancar si detecta que apunta a la base de datos de desarrollo.

```bash
pnpm test              # unitarias
pnpm test:integration  # integración, requiere una base separada
pnpm typecheck
pnpm lint
```

## Ejecutar en local

Requiere Node.js 24 y pnpm 11. Las versiones están fijadas con Volta en `clear-fund/package.json`.

```bash
cd clear-fund
pnpm install
# Configurar DATABASE_URL apuntando a un PostgreSQL propio
pnpm prisma migrate dev
pnpm seed
pnpm dev
```

## Estructura

```
clear-fund/        Aplicación Next.js
caja-ahorro-sdd/   Especificaciones, ADRs y gobernanza
.github/workflows/ CI: typecheck, lint, unitarias e integración
```

## Licencia

[PolyForm Noncommercial 1.0.0](LICENSE.md). El código es público y se puede leer, estudiar, ejecutar y modificar con cualquier propósito no comercial, incluido el estudio personal y el uso por parte de instituciones educativas, organizaciones sin fines de lucro y organismos públicos.

El uso comercial no está permitido bajo esta licencia. Para ese caso, escribir a <guerrerozamora213@gmail.com>.
