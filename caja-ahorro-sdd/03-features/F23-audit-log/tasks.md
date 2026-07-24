# Tareas - F23 Auditoría transversal

> Estado: implementada en `feature/F23-audit-log`. Decisiones de alcance, inmutabilidad,
> costuras diferidas y escenarios adaptados registrados en
> `01-foundation/adrs/ADR-013-f23-audit-log-scope.md`.
> Convención: `[x]` hecho, `[~]` parcial/diferido con nota, `[ ]` pendiente.

## 1. Preparación

- [x] Revisar `spec.md` y resolver contradicciones. Implementa todos los requisitos `FR-F23-*`. (Ocho contradicciones resueltas en ADR-013; `FR-F23-001` y `FR-F23-002` vía `listAuditEvents`, `FR-F23-003` vía `getAuditEvent` + detalle con diff antes/después.)
- [x] Confirmar dependencias: F01. (Además paga la deuda que ADR-008/ADR-010/ADR-012 diferieron a F23 sobre F01, F02 y F03.)
- [x] Diseñar DTOs y códigos de error. (`AuditEventDto`, `AuditEventPageDto`, `AuditChangeSet`, `F23_ERROR_CODES`.)
- [x] Actualizar la matriz de trazabilidad. (F23 → "Implementada, pendiente de validación manual". La matriz solo lleva el estado por feature; la deuda que F23 difiere hacia F04/F09/F20 se registra en ADR-013 §8, que es el hogar de las decisiones transversales según `SDD_WORKFLOW.md`.)

## 2. Base de datos

- [x] Agregar o ajustar entidades: AuditEvent. (`prisma/schema.prisma`, sin claves foráneas — snapshot de actor/caja, ADR-013 §10.)
- [x] Crear migración Prisma. (`20260724215929_f23_audit_log`, aplicada.)
- [x] Agregar constraints e índices de concurrencia. (Índices `(cashFundId, occurredAt)`, `(occurredAt)`, `(entityType, entityId)`, `(actorId)`, `(correlationId)` — cubre "caja y timestamp en auditoría" de `PRISMA_SCHEMA_PLAN.md`; más el trigger `BEFORE UPDATE OR DELETE` de inmutabilidad, SQL manual en la migración.)
- [~] Crear factories y fixtures. (`tests/integration/helpers.ts`: `resetDb` extendido a `audit_event`; helpers `makeTreasurer`/`activeFund` en el test. Sin librería de factories dedicada, igual que F02/F03.)
- [x] Probar migración desde base vacía y desde la versión anterior. (**Desde la versión anterior:** `prisma migrate deploy` aplicó sobre dev y sobre la rama de test. **Desde base vacía:** `prisma migrate reset` en la rama de test reaplicó las 3 migraciones desde cero, y tras esa aplicación limpia se verificó la presencia de la función `audit_event_immutable`, los triggers `audit_event_no_update`/`audit_event_no_delete` y los 5 índices; la suite de integración quedó verde sobre esa base. El trigger se probó contra Postgres real: bloquea `UPDATE` y `DELETE`, y permite `TRUNCATE` para fixtures.)

## 3. Dominio

- [x] Implementar invariantes y funciones puras. (`rules.ts`: `isSensitiveField`, `toAuditValue`, `buildChangeSet`, `buildCreationChangeSet`, `normalizeChangeSet`, `resolveAuditScope`, `isEventVisible`, `linkToOriginalEvent`.)
- [~] Implementar máquina de estados cuando aplique. (N/A: un evento de auditoría es inmutable y no tiene estados; no hay transiciones que modelar.)
- [x] Implementar cálculos monetarios con Decimal. (`toAuditValue` normaliza cualquier Decimal a string decimal, nunca `number` — probado con `monthlySavingAmount`.)
- [x] Añadir pruebas unitarias de reglas y casos límite. (`rules.test.ts` + `dto.test.ts` + `schemas.test.ts`: redacción de secretos, diff por valor, evento global oculto al tesorero, tesorero sin asignaciones, acción desconocida de una feature futura, JSON persistido malformado.)

## 4. Aplicación

- [x] Implementar casos de uso descritos en `plan.md`. (`listAuditEvents`, `getAuditEvent`, más `recordAuditEvent` como lado de escritura que consumen F01/F02/F03.)
- [x] Añadir autorización por caja. (`resolveScopeForCaller` reutiliza `listAssignedCashFunds` de F03 como única fuente de verdad; no duplica la regla.)
- [x] Añadir transacciones. (F02 y F03 escriben el evento dentro del mismo `prisma.$transaction` que el cambio auditado. **F01 no puede**: sus escrituras pasan por Better Auth, que no acepta transacción externa — limitación documentada en ADR-013 §6, con fallo ruidoso en vez de hueco silencioso.)
- [~] Integrar CashMovement si existe impacto financiero. (N/A: registrar un evento de auditoría no mueve dinero. `CashMovement` es F20. ADR-013 §4.)
- [x] Integrar AuditEvent. (Cableado retroactivo completo: F01 → `USER_CREATED`/`USER_DISABLED`/`USER_ENABLED`/`USER_SESSIONS_REVOKED`; F02 → `CASH_FUND_CREATED`/`CASH_FUND_DRAFT_UPDATED`/`CASH_FUND_ACTIVATED`/`CASH_FUND_DEACTIVATED`/`CASH_FUND_CONFIG_CHANGED`; F03 → `TREASURER_ASSIGNED`/`TREASURER_UNASSIGNED`.)
- [~] Añadir idempotencia o protección de concurrencia. (No aplica una idempotency key: la auditoría es append-only y no es una operación de negocio reintentable. Lo que sí se resuelve: las operaciones idempotentes de F03 que resuelven en no-op **no** registran evento, para no inflar la bitácora con cambios inexistentes. ADR-013 §6.)

## 5. Interfaz

- [x] Crear páginas y componentes. (`src/app/(admin)/audit/page.tsx` — bitácora global y por caja con filtros y paginación; `AuditLogFilters`, `AuditEventRowActions`, `AuditEventDetailDialog` con la tabla antes/después. Enlace "Auditoría" añadido a la navegación admin, visible también para tesoreros por `FR-F23-002`.)
- [x] Añadir estados de carga, vacío, error y confirmación. (Spinner al cargar el detalle, vacío "no hay eventos para estos filtros", `role="alert"` para errores funcionales. No hay confirmación destructiva: la feature es de solo lectura.)
- [x] Validar accesibilidad de formularios. (Filtros con `<Label htmlFor>`, `nav aria-label` en la paginación, `scope="row"` en la tabla de cambios, `aria-hidden` en íconos.)
- [x] Verificar escritorio y móvil. (Filtros apilados en móvil y en fila desde `sm`; tabla y diff con `overflow-x-auto` propio, sin scroll horizontal del `body`.)

## 6. Verificación

- [x] Implementar todos los escenarios de `acceptance.md`. (`tests/integration/audit.test.ts`: AC-F23-001 adaptado — dos escenarios, AC-F23-003 — tres escenarios, más inmutabilidad BR-F23-003, redacción BR-F23-004, cobertura BR-F23-001, no-op sin evento, operación fallida sin evento, orden y paginación, y llamante sin sesión. **AC-F23-002 diferido a F09**: no existe ninguna reversa que enlazar; la costura `linkToOriginalEvent` sí está implementada y probada unitariamente. ADR-013 §8.)
- [x] Ejecutar lint, typecheck y pruebas. (lint ✓, typecheck ✓, build ✓, unitarias 204 ✓, integración 27 ✓ + 1 todo — de las cuales 13 son los escenarios de F23; los 14 de F01/F02/F03 siguen verdes tras el cableado retroactivo.)
- [~] Ejecutar E2E del flujo principal. (Diferido: sin runner Playwright configurado, igual que F02/F03. El flujo está cubierto por integración con sesiones reales de Better Auth.)
- [ ] Realizar prueba manual con datos representativos. (Pendiente del responsable funcional, igual que en F01/F02/F03.)
- [~] Actualizar documentación y marcar la feature como completada. (ADR-013, trazabilidad y este `tasks.md` actualizados. La marca "Completada" queda pendiente de los dos únicos puntos del `DEFINITION_OF_DONE.md` que no son autocertificables: la revisión visual en escritorio y móvil, y la validación con datos de una caja de prueba. Todo el resto del DoD está cumplido y verificado.)
