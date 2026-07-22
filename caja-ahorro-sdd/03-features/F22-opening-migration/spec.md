# F22 - Migración inicial y saldos de apertura

## Estado

Propuesta para revisión.

## Fase

Fase 3

## Dependencias

F02, F04, F05, F15, F20.

## Propósito

Migrar saldos actuales, préstamos activos, atrasos y saldo inicial sin reconstruir todo el historial.

## Historias y requisitos funcionales

- **FR-F22-001:** Como administrador quiero importar saldos actuales por número.
- **FR-F22-002:** Como tesorero quiero continuar préstamos activos con cuotas pendientes.
- **FR-F22-003:** Como responsable quiero conciliar el saldo inicial antes de operar.

## Reglas de negocio

- **BR-F22-001:** No se reconstruyen pagos históricos.
- **BR-F22-002:** Se registra fecha de corte.
- **BR-F22-003:** Cada número recibe movimiento SALDO_INICIAL_MIGRADO.
- **BR-F22-004:** Se cargan capital pendiente, cuotas vencidas y futuras de préstamos activos.
- **BR-F22-005:** Las cuotas vencidas importadas aparecen en morosidad pero no cuentan riesgo.
- **BR-F22-006:** Se registra un SALDO_INICIAL_CAJA único.
- **BR-F22-007:** No se divide efectivo y bancos.
- **BR-F22-008:** El conteo de riesgo inicia en la puesta en marcha.
- **BR-F22-009:** Las cargas se hacen por lotes reproducibles; no mediante parches manuales.
- **BR-F22-010:** Se requiere reporte de conciliación.

## Entidades relacionadas

MigrationBatch, MigrationError, CashMovement

## Fuera de alcance

- Funcionalidades no mencionadas expresamente en esta especificación.
- Automatizaciones o integraciones externas no incluidas en el MVP.
- Edición destructiva de registros financieros.

## Casos límite

- Cédulas duplicadas.
- Números repetidos.
- Capital inconsistente.
- Saldo de caja no conciliado.

## Criterio de salida

La feature se considera especificada cuando el responsable funcional confirma que todos los requisitos y reglas representan la operación real.
