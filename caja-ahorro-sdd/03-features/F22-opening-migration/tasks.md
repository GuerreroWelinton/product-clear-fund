# Tareas - F22 Migración inicial y saldos de apertura

## 1. Preparación

- [ ] Revisar `spec.md` y resolver contradicciones. Implementa todos los requisitos `FR-F22-*`.
- [ ] Confirmar dependencias: F02, F04, F05, F15, F20.
- [ ] Diseñar DTOs y códigos de error.
- [ ] Actualizar la matriz de trazabilidad.

## 2. Base de datos

- [ ] Agregar o ajustar entidades: MigrationBatch, MigrationError, CashMovement.
- [ ] Crear migración Prisma.
- [ ] Agregar constraints e índices de concurrencia.
- [ ] Crear factories y fixtures.
- [ ] Probar migración desde base vacía y desde la versión anterior.

## 3. Dominio

- [ ] Implementar invariantes y funciones puras.
- [ ] Implementar máquina de estados cuando aplique.
- [ ] Implementar cálculos monetarios con Decimal.
- [ ] Añadir pruebas unitarias de reglas y casos límite.

## 4. Aplicación

- [ ] Implementar casos de uso descritos en `plan.md`.
- [ ] Añadir autorización por caja.
- [ ] Añadir transacciones.
- [ ] Integrar CashMovement si existe impacto financiero.
- [ ] Integrar AuditEvent.
- [ ] Añadir idempotencia o protección de concurrencia.

## 5. Interfaz

- [ ] Crear páginas y componentes.
- [ ] Añadir estados de carga, vacío, error y confirmación.
- [ ] Validar accesibilidad de formularios.
- [ ] Verificar escritorio y móvil.

## 6. Verificación

- [ ] Implementar todos los escenarios de `acceptance.md`.
- [ ] Ejecutar lint, typecheck y pruebas.
- [ ] Ejecutar E2E del flujo principal.
- [ ] Realizar prueba manual con datos representativos.
- [ ] Actualizar documentación y marcar la feature como completada.
