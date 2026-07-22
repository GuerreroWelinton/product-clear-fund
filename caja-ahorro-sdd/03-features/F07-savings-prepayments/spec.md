# F07 - Adelanto de cuotas de ahorro

## Estado

Propuesta para revisión.

## Fase

Fase 1

## Dependencias

F06, F08.

## Propósito

Permitir pagar meses futuros completos hasta un máximo configurable por caja.

## Historias y requisitos funcionales

- **FR-F07-001:** Como tesorero quiero registrar varios meses futuros en un mismo pago.
- **FR-F07-002:** Como caja quiero limitar cuántos meses puede adelantar cada número.

## Reglas de negocio

- **BR-F07-001:** Primero se cubren periodos anteriores pendientes.
- **BR-F07-002:** Los periodos futuros se pagan completos y en orden.
- **BR-F07-003:** El máximo se configura por caja y puede cambiarse.
- **BR-F07-004:** El nuevo límite afecta solo operaciones futuras.
- **BR-F07-005:** Pagos adelantados existentes no se invalidan.
- **BR-F07-006:** El dinero entra de inmediato al saldo.
- **BR-F07-007:** Si el número se retira, los anticipos forman parte del saldo devuelto.

## Entidades relacionadas

SavingsObligation, PaymentAllocation

## Fuera de alcance

- Funcionalidades no mencionadas expresamente en esta especificación.
- Automatizaciones o integraciones externas no incluidas en el MVP.
- Edición destructiva de registros financieros.

## Casos límite

- Reducción del límite por debajo de anticipos existentes.
- Intento de saltar un mes pendiente.

## Criterio de salida

La feature se considera especificada cuando el responsable funcional confirma que todos los requisitos y reglas representan la operación real.
