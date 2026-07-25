# Tareas - F20 Libro de caja y saldos

> Estado: slice 1 (dominio/schema/migración) y slice 2 (aplicación/UI/integración) completados en
> `feature/F20-cash-ledger-balance`. Alcance y costuras diferidas en
> `01-foundation/adrs/ADR-014-f20-cash-ledger-balance-scope.md`.
> Convención: `[x]` hecho, `[~]` parcial/diferido con nota, `[ ]` pendiente.

## 1. Preparación

- [x] Revisar `spec.md` y resolver contradicciones. Implementa todos los requisitos `FR-F20-*`. (FR-F20-001/002 vía `getCashFundBalance`/`listCashMovements`; FR-F20-003 vía el trigger de inmutabilidad + `assertSufficientBalance`.)
- [x] Confirmar dependencias: F02, F23. (F02 aporta `CashFund`/autorización por caja; F23 el seam `relatedEventId`/`correlationId`.)
- [x] Diseñar DTOs y códigos de error. (`CashMovementDto`, `CashFundBalanceDto`, `F20_ERROR_CODES` — slice 1.)
- [x] Actualizar la matriz de trazabilidad. (F20 → "Implementada, pendiente de validación manual".)

## 2. Base de datos

- [x] Agregar o ajustar entidades: CashMovement. (slice 1, `prisma/schema.prisma`.)
- [x] Crear migración Prisma. (`20260725094512_f20_cash_ledger` — slice 1.)
- [x] Agregar constraints e índices de concurrencia. (check `amount > 0`, índice único parcial en `reversedMovementId`, trigger de inmutabilidad — slice 1.)
- [~] Crear factories y fixtures. (Sin librería dedicada; inserts directos vía `prisma.cashMovement.create` en tests, mismo precedente que F02/F03/F23.)
- [x] Probar migración desde base vacía y desde la versión anterior. (`migrate deploy` aplicado sobre dev y sobre la rama de test.)

## 3. Dominio

- [x] Implementar invariantes y funciones puras. (`balance.ts`: `deriveAccountingBalance`/`deriveCommittedBalance`/`deriveFreeBalance`/`assertSufficientBalance` — slice 1.)
- [~] Implementar máquina de estados cuando aplique. (N/A: `CashMovement` es un hecho inmutable, sin estados que modelar.)
- [x] Implementar cálculos monetarios con Decimal. (`balance.ts`, normaliza a 2 decimales — slice 1.)
- [x] Añadir pruebas unitarias de reglas y casos límite. (`balance.test.ts`, `dto.test.ts`, `movement-types.test.ts`, `schemas.test.ts` — slice 1.)

## 4. Aplicación

- [x] Implementar casos de uso descritos en `plan.md`. (`getCashFundBalance`, `listCashMovements`.)
- [x] Añadir autorización por caja. (`requireSuperAdminOrAssignedTreasurer`.)
- [~] Añadir transacciones. (N/A: ambos casos de uso son de solo lectura, sin escritura que confirmar — BR-F20-006.)
- [~] Integrar CashMovement si existe impacto financiero. (N/A: F20 no escribe movimientos; los cablean F06/F08/F14/F17 — ADR-014 §2.)
- [~] Integrar AuditEvent. (N/A: consultar un saldo no es un cambio auditable.)
- [~] Añadir idempotencia o protección de concurrencia. (N/A: solo lectura; el ledger en sí es append-only e inmutable por trigger de base de datos.)

## 5. Interfaz

- [x] Crear páginas y componentes. (`/cash-funds/[id]/ledger`: tarjetas de saldo, tabla cronológica, `LedgerFilters`; enlace "Ver libro de caja" en `cash-fund-row-actions.tsx`.)
- [x] Añadir estados de carga, vacío, error y confirmación. (Vacío "todavía no registra movimientos", `role="alert"` en error. Sin confirmación: la feature es de solo lectura.)
- [x] Validar accesibilidad de formularios. (`Label htmlFor` en filtros, `nav aria-label` en paginación, anchors planos en paginación — no `Button` anidando `Link`.)
- [~] Verificar escritorio y móvil. (Layout responsive con Tailwind; validación visual la hace el responsable funcional.)

## 6. Verificación

- [x] Implementar todos los escenarios de `acceptance.md`. (AC-F20-001 completo en integración; AC-F20-002 diferido a F13 y AC-F20-003 diferido a F14 — ver ADR-014.)
- [x] Ejecutar lint, typecheck y pruebas. (lint ✓, typecheck ✓, build ✓, unitarias 269 ✓, integración 31 ✓ + 1 todo.)
- [~] Ejecutar E2E del flujo principal. (Diferido: sin runner Playwright configurado, mismo precedente que F01/F02/F03/F23; cubierto por integración.)
- [~] Realizar prueba manual con datos representativos. (Pendiente: la realiza el responsable funcional.)
- [x] Actualizar documentación y marcar la feature como completada. (Este `tasks.md` y `TRACEABILITY.md`.)
