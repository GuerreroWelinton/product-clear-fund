# ADR-010 - F02: costuras (seams) y diferimientos cross-feature

## Estado
Aceptado.

## Contexto
El `spec.md` y `acceptance.md` de F02 (ciclo de vida de cajas) referencian conceptos
cuyos modelos y reglas pertenecen a features posteriores todavía no implementadas:

- **BR-F02-002 / BR-F02-004 / AC-F02-001** mencionan "el primer número". El concepto de
  número de socio (`Membership`) pertenece a **F05**.
- **BR-F02-007 / AC-F02-003** exigen generar las cuotas faltantes al reactivar una caja.
  `SavingsObligation` y su generación mensual pertenecen a **F06**.
- **FR-F02-002** requiere autorizar a un "tesorero asignado". La asignación
  (`CashFundUser`) y su gestión (asignar/revocar) pertenecen a **F03**.
- El `plan.md` menciona `CashMovement` y `AuditEvent` "cuando exista impacto financiero".
  Crear o configurar una caja no genera movimiento financiero; el ledger (`CashMovement`)
  es **F20** y la auditoría (`AuditEvent`) es **F23** (ver ADR-008).

El `DEPENDENCY_MAP.md` ubica F02 en Fase 0, declarando solo `F01` como dependencia; por
tanto F02 no puede depender de F03/F05/F06/F20/F23.

## Decisión
F02 se implementa con **costuras (seams)** explícitas, sin adelantar el alcance de otras
features:

1. **Números (F05):** función de dominio pura `hasFirstNumber(fund)` que en F02 devuelve
   siempre `false`. Los guards de inmutabilidad la consultan; F05 la conectará al conteo
   real de `Membership`. En F02 la cuota queda inmutable al **activar** la caja (condición
   suficiente de BR-F02-002); el lock adicional por "primer número" queda cableado por la
   costura para F05.
2. **Cuotas al reactivar (F06):** `reactivateCashFund` (vía `activateCashFund` desde
   estado `INACTIVE`) expone un punto de extensión vacío para la generación de cuotas
   faltantes. **AC-F02-003 se difiere a F06**, que implementará y probará la recuperación
   idempotente. La transición de estado y el registro de meses inactivos sí se implementan
   en F02.
3. **Asignación de tesoreros (F03):** F02 **crea la tabla `CashFundUser`** (respaldado por
   `PRISMA_SCHEMA_PLAN.md`, que agrupa `CashFund` y `CashFundUser` como los primeros
   modelos no-auth) y el check de autorización "tesorero con asignación activa" en
   `updateOperationalConfig`. La **gestión** de asignaciones (UI y casos de uso para
   asignar/revocar) queda en **F03**.
4. **Ledger y auditoría (F20 / F23):** F02 no crea movimientos ni eventos de auditoría
   propios (crear/configurar una caja no mueve dinero). F20 y F23 los cablearán de forma
   retroactiva si corresponde, igual que en F01 (ADR-008).

## Consecuencias
- F02 permanece fiel a su spec y a su única dependencia declarada (F01).
- AC-F02-001 y AC-F02-002 se implementan y prueban completamente en F02.
- AC-F02-003 queda pendiente de F06; se documenta en `tasks.md` y en la matriz de pruebas.
- F03 hereda la tabla `CashFundUser` ya creada y solo añade su gestión.
- Las costuras (`hasFirstNumber`, punto de extensión de reactivación) son funciones/hooks
  puros y testeados, sin ramas muertas ocultas.

## Nota de implementación
El `plan.md` de F02 nombra el módulo `src/modules/cash-fund-lifecycle`. El repositorio ya
tiene scaffoldeado `src/modules/cash-funds/` (5 capas). Se usa el scaffold existente
`cash-funds` por consistencia con el resto del árbol de módulos; es una diferencia de
nombre, no de alcance.
