# ADR-004 - Ledger financiero inmutable

## Estado
Aceptado.

## Contexto
Es una decisión de ingeniería, no un requisito planteado por el negocio. Se tomó por tratarse de manejo de dinero, buscando trazabilidad, transparencia y respaldo de todo cambio de saldo.

Como no nace de un requisito externo, tampoco se puede negociar invocando uno. Lo que la sostiene es que un saldo sin el movimiento que lo produjo no se puede explicar ni auditar.

## Decisión
Todo cambio de saldo proviene de movimientos de caja. No existen ajustes manuales genéricos ni eliminación de movimientos.

## Consecuencias
- Correcciones mediante reversa.
- Auditoría completa.
- Saldo recalculable.
- Necesidad de transacciones y referencias entre movimiento original y reversa.
