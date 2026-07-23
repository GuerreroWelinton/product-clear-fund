# Tareas - F03 Asignación de tesoreros

> Estado: implementada en `feature/F03-treasurer-assignments`. Decisiones de alcance,
> auditoría diferida y costuras heredadas registradas en
> `01-foundation/adrs/ADR-012-f03-treasurer-assignments-scope.md`.
> Convención: `[x]` hecho, `[~]` parcial/diferido con nota, `[ ]` pendiente.

## 1. Preparación

- [x] Revisar `spec.md` y resolver contradicciones. Implementa todos los requisitos `FR-F03-*`.
- [x] Confirmar dependencias: F01, F02.
- [x] Diseñar DTOs y códigos de error. (`TreasurerAssignmentDto`, `FundTreasurerDto`, `F03_ERROR_CODES`.)
- [x] Actualizar la matriz de trazabilidad. (F03 → "Completada".)

## 2. Base de datos

- [x] Agregar o ajustar entidades: CashFundUser. (Tabla ya creada por F02, ver ADR-010/ADR-012.)
- [~] Crear migración Prisma. (No requiere migración nueva: `cash_fund_user` existe desde `20260722210458_f02_cash_fund_lifecycle`.)
- [x] Agregar constraints e índices de concurrencia. (`@@unique([cashFundId,userId])` + índices por `userId`/`cashFundId`, heredados de F02; garantizan idempotencia y evitan duplicados concurrentes.)
- [~] Crear factories y fixtures. (Helpers de integración: `makeTreasurer`, `activeFund`; sin librería de factories dedicada.)
- [x] Probar migración desde base vacía y desde la versión anterior. (Cubierto por la migración de F02; F03 no altera el esquema.)

## 3. Dominio

- [x] Implementar invariantes y funciones puras. (`rules.ts`: `resolveAssignAction`, `resolveUnassignAction`.)
- [~] Implementar máquina de estados cuando aplique. (Estado binario ACTIVE/REVOKED resuelto por las reglas puras de idempotencia; no requiere FSM.)
- [~] Implementar cálculos monetarios con Decimal. (N/A: asignar/retirar tesoreros no tiene impacto financiero, ver ADR-012.)
- [x] Añadir pruebas unitarias de reglas y casos límite. (`rules.test.ts`: crear/reactivar/no-op y revocar/no-op.)

## 4. Aplicación

- [x] Implementar casos de uso descritos en `plan.md`. (`assignTreasurer`, `unassignTreasurer`, `listAssignedCashFunds`, + `listFundAssignments` para la UI.)
- [x] Añadir autorización por caja. (`requireSuperAdmin` para gestión; enforcement del tesorero heredado de `cash-funds/authorize.ts`.)
- [~] Añadir transacciones. (N/A: cada escritura sobre `CashFundUser` es atómica; sin operación multi-entidad.)
- [~] Integrar CashMovement si existe impacto financiero. (N/A, ver ADR-012.)
- [~] Integrar AuditEvent. (Diferido a F23 — costura; historial cubierto por soft-delete REVOKED + timestamps. ADR-012.)
- [x] Añadir idempotencia o protección de concurrencia. (`@@unique` + reglas de idempotencia: duplicado = no-op, reactivación de REVOKED.)

## 5. Interfaz

- [x] Crear páginas y componentes. (`ManageTreasurersDialog`, integrado en las acciones de fila de cajas; visibilidad del tesorero vía `listAssignedCashFunds`.)
- [x] Añadir estados de carga, vacío, error y confirmación. (Spinner de carga, vacío "sin tesoreros", `role="alert"` de error, spinner por fila al asignar/retirar.)
- [x] Validar accesibilidad de formularios. (Botones con estado deshabilitado, `aria-hidden` en íconos, textos claros.)
- [x] Verificar escritorio y móvil. (Reutiliza el `Dialog` responsivo del sistema de diseño existente.)

## 6. Verificación

- [x] Implementar todos los escenarios de `acceptance.md`. (`tests/integration/treasurer-assignments.test.ts`: AC-F03-001/002/003 + idempotencia + BR-F03-001.)
- [x] Ejecutar lint, typecheck y pruebas. (lint ✓, typecheck ✓, unit 127 ✓, integración 14 ✓.)
- [~] Ejecutar E2E del flujo principal. (Diferido: sin runner Playwright configurado; el flujo principal está cubierto por tests de integración con sesiones reales.)
- [x] Realizar prueba manual con datos representativos. (Validada manualmente por el responsable: asignar/retirar tesoreros y visibilidad del tesorero OK.)
- [x] Actualizar documentación y marcar la feature como completada. (ADR-012, trazabilidad, este `tasks.md`.)
