# Plan técnico - F24 Procesos automáticos e idempotencia

## Diseño propuesto

Implementar la feature dentro de `src/modules/scheduled-jobs` siguiendo las capas `domain`, `application`, `infrastructure`, `schemas` y `ui`.

## Modelo de datos

- JobExecution

Los cambios deben agregarse mediante una migración Prisma revisable. Las restricciones que Prisma no represente directamente deberán añadirse con SQL en la migración.

## Casos de uso

- `runMonthlySavingsJob`
- `runCashFundBackfill`
- `rebuildRiskEvents`

Cada caso de uso debe:

1. Validar entrada.
2. Verificar sesión y autorización por caja.
3. Cargar el estado necesario.
4. Ejecutar reglas de dominio puras.
5. Confirmar cambios en una transacción cuando exista impacto financiero.
6. Registrar auditoría.
7. Devolver DTOs, no modelos Prisma.

## Interfaz

- Panel técnico básico de ejecuciones para Super Admin.

## Contratos

- Entradas validadas con schemas.
- Montos transmitidos como decimal string.
- Errores con códigos estables prefijados por `F24`.
- La UI debe presentar errores funcionales sin exponer detalles internos.

## Seguridad

- Super Admin tiene acceso global.
- Tesorero requiere asignación activa a la caja.
- Toda comprobación se repite en servidor.
- Las consultas deben incluir `cashFundId` o derivarlo desde una entidad ya autorizada.

## Transacciones e idempotencia

- Usar transacción en toda operación que combine estado de dominio, CashMovement y AuditEvent.
- Aplicar índices únicos, locks lógicos o aislamiento apropiado en escenarios concurrentes.
- Las operaciones reintentables deben aceptar o generar una idempotency key.

## Observabilidad

Registrar actor, caja, caso de uso, resultado, duración y código de error, sin datos sensibles.

## Estrategia de entrega

1. Migración y repositorio.
2. Reglas de dominio.
3. Casos de uso.
4. Interfaz.
5. Pruebas.
6. Activación mediante feature flag si el riesgo lo justifica.
