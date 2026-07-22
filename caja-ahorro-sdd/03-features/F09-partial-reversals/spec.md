# F09 - Reversas parciales

## Estado

Propuesta para revisión.

## Fase

Fase 1

## Dependencias

F08, F20, F23.

## Propósito

Corregir un detalle específico de un pago o gasto sin borrar la operación original.

## Historias y requisitos funcionales

- **FR-F09-001:** Como tesorero quiero reversar solo una allocation incorrecta.
- **FR-F09-002:** Como auditor quiero ver la operación original, motivo y responsable de la reversa.

## Reglas de negocio

- **BR-F09-001:** Un tesorero asignado puede reversar operaciones de cualquier tesorero de la misma caja.
- **BR-F09-002:** El motivo es obligatorio.
- **BR-F09-003:** La operación original permanece visible.
- **BR-F09-004:** Se crea movimiento contrario.
- **BR-F09-005:** La obligación afectada vuelve a pendiente.
- **BR-F09-006:** Las demás allocations continúan confirmadas.
- **BR-F09-007:** Una reversa de periodo cerrado genera ajuste en el siguiente periodo.

## Entidades relacionadas

PaymentAllocationReversal, CashMovement, AuditEvent

## Fuera de alcance

- Funcionalidades no mencionadas expresamente en esta especificación.
- Automatizaciones o integraciones externas no incluidas en el MVP.
- Edición destructiva de registros financieros.

## Casos límite

- Reversar dos veces el mismo detalle.
- Reversa que deja un cierre afectado.
- Usuario sin asignación.

## Criterio de salida

La feature se considera especificada cuando el responsable funcional confirma que todos los requisitos y reglas representan la operación real.
