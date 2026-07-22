# ADR-004 - Ledger financiero inmutable

## Estado
Aceptado.

## Decisión
Todo cambio de saldo proviene de movimientos de caja. No existen ajustes manuales genéricos ni eliminación de movimientos.

## Consecuencias
- Correcciones mediante reversa.
- Auditoría completa.
- Saldo recalculable.
- Necesidad de transacciones y referencias entre movimiento original y reversa.
