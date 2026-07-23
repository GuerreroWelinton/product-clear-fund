# Tareas - F02 Ciclo de vida y configuración de cajas

> Estado: implementada en `feature/F02-cash-fund-lifecycle`. Decisiones de costura y
> diferimiento registradas en `01-foundation/adrs/ADR-010-f02-cross-feature-seams.md`.
> Convención: `[x]` hecho, `[~]` parcial/diferido con nota, `[ ]` pendiente.

## 1. Preparación

- [x] Revisar `spec.md` y resolver contradicciones. Implementa todos los requisitos `FR-F02-*`.
- [x] Confirmar dependencias: F01.
- [x] Diseñar DTOs y códigos de error. (`CashFundDto`, `F02_ERROR_CODES` alineados a `ERROR_CATALOG.md`.)
- [x] Actualizar la matriz de trazabilidad. (F02 → "Completada".)

## 2. Base de datos

- [x] Agregar o ajustar entidades: CashFund. (+ `CashFundUser`, tabla creada en F02; gestión en F03, ver ADR-010.)
- [x] Crear migración Prisma. (`20260722210458_f02_cash_fund_lifecycle`.)
- [x] Agregar constraints e índices de concurrencia. (CHECK de montos/días vía SQL; unique `(cashFundId,userId)`; índice por status.)
- [~] Crear factories y fixtures. (Helpers de integración: `seedSuperAdmin`, `assignTreasurer`; sin librería de factories dedicada.)
- [x] Probar migración desde base vacía y desde la versión anterior. (Aplicada con `migrate dev` sobre dev y `migrate deploy` sobre la rama de test, ambas desde `init_auth`.)

## 3. Dominio

- [x] Implementar invariantes y funciones puras. (`rules.ts`.)
- [x] Implementar máquina de estados cuando aplique. (`canTransition` DRAFT/ACTIVE/INACTIVE.)
- [x] Implementar cálculos monetarios con Decimal. (`validatePositiveAmount` con `decimal.js`; dinero como string en el borde.)
- [x] Añadir pruebas unitarias de reglas y casos límite. (Día recomendado > máximo, cuota bloqueada, etc.)

## 4. Aplicación

- [x] Implementar casos de uso descritos en `plan.md`. (create/updateDraft/activate/deactivate/updateOperationalConfig.)
- [x] Añadir autorización por caja. (SUPER_ADMIN global; tesorero con asignación `CashFundUser` activa para config operativa.)
- [~] Añadir transacciones. (N/A en F02: cada caso de uso es una sola escritura de fila; no hay operación financiera compuesta. Ver ADR-010.)
- [~] Integrar CashMovement si existe impacto financiero. (N/A: crear/configurar caja no mueve dinero; ledger es F20, ADR-010.)
- [~] Integrar AuditEvent. (Diferido a F23, ADR-008/ADR-010.)
- [~] Añadir idempotencia o protección de concurrencia. (Defensa por unique + CHECK a nivel DB; idempotency key no aplica a estas operaciones.)

## 5. Interfaz

- [x] Crear páginas y componentes. (`/cash-funds` + diálogos crear/editar/config + acciones de fila. Formularios crear/editar-borrador alineados: en borrador se editan los 4 campos de config + fecha de inicio.)
- [x] Añadir estados de carga, vacío, error y confirmación. (`useTransition`, empty state, toasts de error, `AlertDialog` para activar/desactivar.)
- [x] Validar accesibilidad de formularios. (`htmlFor` en todos los labels; ayuda contextual por clic/tap (Popover) accesible por teclado en campos complejos vía `FieldLabel` — ADR-011.)
- [x] Verificar escritorio y móvil. (Tabla con `overflow-x-auto`; validada manualmente por el responsable en escritorio y móvil.)

## 6. Verificación

- [~] Implementar todos los escenarios de `acceptance.md`. (AC-F02-001 y AC-F02-002 en integración; **AC-F02-003 diferido a F06**, `it.todo`, ADR-010.)
- [x] Ejecutar lint, typecheck y pruebas. (100 unit + 8 integración verdes; lint/typecheck/build limpios.)
- [~] Ejecutar E2E del flujo principal. (Diferido: sin runner Playwright configurado; el flujo principal está cubierto por tests de integración con sesiones reales.)
- [x] Realizar prueba manual con datos representativos. (Validada manualmente por el responsable.)
- [x] Actualizar documentación y marcar la feature como completada. (ADR-010 + trazabilidad + este archivo; cerrada tras validación manual.)
