# ADR-012 - F03: alcance, auditoría diferida y costuras heredadas

## Estado
Aceptado.

## Contexto
F03 (asignación de tesoreros) declara como dependencias solo **F01 y F02**. Su `plan.md`
es una plantilla compartida por todas las features y menciona conceptos que no aplican al
acto de asignar/retirar un tesorero:

- **Auditoría (`AuditEvent`).** El modelo y el módulo de auditoría pertenecen a **F23**,
  aún no implementada. F03 no declara a F23 como dependencia.
- **Impacto financiero (`CashMovement`, `Decimal`, transacciones, feature flag).** Asignar
  o retirar un tesorero **no mueve dinero**; no hay montos ni ledger involucrados.
- **Migración Prisma.** La tabla `CashFundUser` (con `@@unique([cashFundId, userId])` e
  índices por `userId` y `cashFundId`) ya fue creada por F02 como costura (ADR-010,
  migración `20260722210458_f02_cash_fund_lifecycle`).

## Decisión
1. **Auditoría diferida a F23 (costura).** Consistente con ADR-008 (F01) y ADR-010 (F02).
   El historial funcional que exige F03 (BR-F03-004 y el NFR "conservar actor y fecha") se
   cubre con *soft-delete*: retirar una asignación marca `CashFundUser.status = REVOKED` y
   **nunca borra la fila**; `createdAt`/`updatedAt` conservan las fechas. El `AuditEvent`
   formal (quién ejecutó cada asignación/revocación) lo cableará F23 de forma retroactiva.
2. **Sin impacto financiero.** F03 no crea `CashMovement` ni usa `Decimal`/transacciones
   monetarias. Las escrituras sobre `CashFundUser` son atómicas por sí mismas.
3. **Sin migración nueva.** F03 reutiliza la tabla `CashFundUser` de F02. La tarea "crear
   migración / constraints e índices de concurrencia" de `tasks.md` ya está satisfecha:
   el `@@unique([cashFundId, userId])` garantiza idempotencia y evita asignaciones
   duplicadas concurrentes.
4. **Módulo `treasurer-assignments`.** Se crea `src/modules/treasurer-assignments` con las
   capas `domain`, `application`, `schemas`, `ui`, siguiendo el patrón de `cash-funds`.
5. **Códigos de error propios `F03_`.** El contrato de errores de F03 no reutiliza los
   códigos `F02_`; expone su propio catálogo estable prefijado por `F03`.

## Consecuencias
- F03 permanece fiel a su spec y a sus dependencias declaradas (F01, F02).
- El *enforcement* "tesorero con asignación activa" ya existe en `cash-funds/authorize.ts`
  (heredado de F02); F03 aporta la **gestión** (asignar / retirar / listar).
- AC-F03-001/002/003 se implementan y prueban completamente en F03 (integración).
- Queda pendiente para F23 conectar la auditoría formal a las acciones de F03.

## Idempotencia (caso límite "asignación duplicada")
- `assignTreasurer`: sin asignación → crear ACTIVE; asignación REVOKED → reactivar a ACTIVE;
  asignación ACTIVE → no-op (idempotente).
- `unassignTreasurer`: asignación ACTIVE → REVOKED; asignación ya REVOKED → no-op
  (idempotente); sin asignación → error `F03_ASSIGNMENT_NOT_FOUND` (referenciar una
  asignación inexistente es un error genuino, no un no-op).
