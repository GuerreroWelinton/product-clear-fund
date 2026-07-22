# F14 - Desembolso y saldo comprometido

## Estado

Propuesta para revisión.

## Fase

Fase 2

## Dependencias

F13, F20.

## Propósito

Controlar fondos durante el periodo entre asignación y entrega real del préstamo.

## Historias y requisitos funcionales

- **FR-F14-001:** Como tesorero quiero pasar un préstamo a desembolso en proceso solo si existe saldo libre.
- **FR-F14-002:** Como caja quiero evitar comprometer el mismo dinero dos veces.
- **FR-F14-003:** Como tesorero quiero confirmar o cancelar la entrega.

## Reglas de negocio

- **BR-F14-001:** Para entrar a DISBURSEMENT_IN_PROGRESS debe existir saldo libre.
- **BR-F14-002:** El saldo contable no se descuenta todavía.
- **BR-F14-003:** El monto pasa a saldo comprometido.
- **BR-F14-004:** La suma comprometida no puede superar el saldo contable.
- **BR-F14-005:** Al confirmar se valida nuevamente, se registra salida y pasa a ACTIVE.
- **BR-F14-006:** Al cancelar se libera compromiso y el turno vuelve a AVAILABLE.
- **BR-F14-007:** El tiempo máximo produce alerta, no cancelación automática.
- **BR-F14-008:** No se permite extensión manual del límite.

## Entidades relacionadas

Loan, CashMovement, LoanTurn

## Fuera de alcance

- Funcionalidades no mencionadas expresamente en esta especificación.
- Automatizaciones o integraciones externas no incluidas en el MVP.
- Edición destructiva de registros financieros.

## Casos límite

- Dos compromisos simultáneos.
- Saldo reducido antes de confirmar.
- Tiempo excedido.

## Criterio de salida

La feature se considera especificada cuando el responsable funcional confirma que todos los requisitos y reglas representan la operación real.
