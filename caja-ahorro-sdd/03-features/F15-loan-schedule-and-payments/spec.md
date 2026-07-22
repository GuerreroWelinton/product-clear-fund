# F15 - Cronograma y pagos de préstamo

## Estado

Propuesta para revisión.

## Fase

Fase 2

## Dependencias

F08, F11, F14.

## Propósito

Generar el cronograma completo al desembolsar y permitir pagos completos y anticipados.

## Historias y requisitos funcionales

- **FR-F15-001:** Como tesorero quiero ver todas las cuotas del préstamo desde el desembolso.
- **FR-F15-002:** Como tesorero quiero pagar varias cuotas futuras sin límite.
- **FR-F15-003:** Como sistema quiero exigir el ahorro del número asociado al día.

## Reglas de negocio

- **BR-F15-001:** El cronograma completo se genera al confirmar desembolso.
- **BR-F15-002:** La primera cuota es del mes siguiente.
- **BR-F15-003:** Cada cuota snapshot guarda capital, interés fijo, total y fechas.
- **BR-F15-004:** No hay mora ni multa.
- **BR-F15-005:** Capital e interés se pagan juntos.
- **BR-F15-006:** Se pueden adelantar cuotas completas sin límite y en orden.
- **BR-F15-007:** Para pagar, el ahorro del número asociado debe estar al día hasta el mes actual.
- **BR-F15-008:** El ahorro pendiente y la cuota pueden estar en el mismo pago agrupado.
- **BR-F15-009:** No se exige prepagar ahorros futuros.

## Entidades relacionadas

LoanInstallment, PaymentAllocation

## Fuera de alcance

- Funcionalidades no mencionadas expresamente en esta especificación.
- Automatizaciones o integraciones externas no incluidas en el MVP.
- Edición destructiva de registros financieros.

## Casos límite

- Tramos con capital variable.
- Pago de cuota futura con una anterior pendiente.
- Pago de última cuota.

## Criterio de salida

La feature se considera especificada cuando el responsable funcional confirma que todos los requisitos y reglas representan la operación real.
