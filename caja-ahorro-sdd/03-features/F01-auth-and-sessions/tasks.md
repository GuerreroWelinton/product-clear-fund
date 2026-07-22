# Tareas - F01 Autenticación y sesiones

> Estado: **Completada** (con salvedades registradas en Verificación).
> Convenciones: `[x]` hecha · `[~]` no aplica a F01 (motivo) · `[ ]` pendiente.

## 1. Preparación

- [x] Revisar `spec.md` y resolver contradicciones. Implementa todos los requisitos `FR-F01-*`.
- [x] Confirmar dependencias: Ninguna.
- [x] Diseñar DTOs y códigos de error. (`src/modules/auth/domain/{dto,errors}.ts`)
- [x] Actualizar la matriz de trazabilidad. (`00-governance/TRACEABILITY.md` → Completada)

## 2. Base de datos

- [x] Agregar o ajustar entidades: User, Session, Account (+ Verification).
- [x] Crear migración Prisma. (`prisma/migrations/20260722171052_init_auth`)
- [x] Agregar constraints e índices de concurrencia. (`@@unique([email])`, índices de sesión)
- [~] Crear factories y fixtures. (Cubierto por el seed y por los helpers de integración: `tests/integration/helpers.ts`)
- [x] Probar migración desde base vacía y desde la versión anterior. (Aplicada desde base vacía; es la primera migración, no hay versión anterior)

## 3. Dominio

- [x] Implementar invariantes y funciones puras. (Catálogo de errores F01, mapeo, DTOs)
- [~] Implementar máquina de estados cuando aplique. (F01 no tiene máquina de estados; el deshabilitado es un flag `banned`)
- [~] Implementar cálculos monetarios con Decimal. (F01 no maneja dinero)
- [x] Añadir pruebas unitarias de reglas y casos límite. (schemas + casos de uso, 19 tests)

## 4. Aplicación

- [x] Implementar casos de uso descritos en `plan.md`. (createTreasurer, disableUser, enableUser, revokeUserSessions)
- [~] Añadir autorización por caja. (F01 usa roles globales; la asignación tesorero↔caja es F03. La autorización de administrador se verifica en servidor vía Better Auth)
- [~] Añadir transacciones. (Sin impacto financiero; deshabilitar+revocar se resuelve con la API admin de Better Auth. Ver ADR-008)
- [~] Integrar CashMovement si existe impacto financiero. (No hay impacto financiero en F01)
- [~] Integrar AuditEvent. (Diferido a F23 — ver ADR-008)
- [x] Añadir idempotencia o protección de concurrencia. (Unicidad de correo `@@unique([email])`; sign-up público deshabilitado)

## 5. Interfaz

- [x] Crear páginas y componentes. (login, dashboard, /users, diálogos y acciones)
- [x] Añadir estados de carga, vacío, error y confirmación. (loading en login, tabla vacía, toasts, AlertDialog de confirmación)
- [x] Validar accesibilidad de formularios. (labels asociados, `aria-invalid`, `role="alert"`, focus)
- [ ] Verificar escritorio y móvil. (Validación manual de escritorio hecha por el responsable; falta una revisión responsive formal registrada)

## 6. Verificación

- [x] Implementar todos los escenarios de `acceptance.md`. (AC-F01-001/002/003, integración, 3/3)
- [x] Ejecutar lint, typecheck y pruebas. (lint + typecheck + 19 unit + 3 integración, en verde)
- [ ] Ejecutar E2E del flujo principal. (Diferido: Playwright no configurado aún; se hará cuando se establezca la suite E2E)
- [x] Realizar prueba manual con datos representativos. (Login y gestión probados contra la caja de prueba en Neon)
- [x] Actualizar documentación y marcar la feature como completada. (ADR-007/008/009, matriz de trazabilidad, esta lista)
