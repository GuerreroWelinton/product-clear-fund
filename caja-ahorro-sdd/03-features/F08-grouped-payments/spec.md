# F08 - Pagos agrupados y asignaciones

## Estado

Propuesta para revisión.

## Fase

Fase 1

## Dependencias

F06, F20, F23.

## Propósito

Registrar un pago de una persona que cubra obligaciones exactas de varios números y préstamos.

## Historias y requisitos funcionales

- **FR-F08-001:** Como tesorero quiero seleccionar varias obligaciones en un solo pago.
- **FR-F08-002:** Como tesorero quiero registrar la fecha real del pago.
- **FR-F08-003:** Como sistema quiero mantener asignaciones exactas y trazables.

## Reglas de negocio

- **BR-F08-001:** Un pago pertenece a una persona y caja.
- **BR-F08-002:** Puede cubrir varios números y cuotas de préstamo.
- **BR-F08-003:** Cada allocation apunta a una obligación exacta.
- **BR-F08-004:** No hay pagos parciales de cuotas.
- **BR-F08-005:** La fecha se propone con la fecha actual del administrador.
- **BR-F08-006:** Se permite fecha pasada, nunca futura.
- **BR-F08-007:** Se guardan fecha real, fecha de registro y usuario.
- **BR-F08-008:** Las obligaciones se seleccionan en orden cronológico.
- **BR-F08-009:** Pagos tardíos de periodos cerrados se aplican como ajuste del periodo abierto siguiente.

## Entidades relacionadas

Payment, PaymentAllocation, CashMovement

## Fuera de alcance

- Funcionalidades no mencionadas expresamente en esta especificación.
- Automatizaciones o integraciones externas no incluidas en el MVP.
- Edición destructiva de registros financieros.

## Casos límite

- Doble envío.
- Obligación ya pagada por otro usuario.
- Fecha futura.
- Pago de caja no asignada.

## Criterio de salida

La feature se considera especificada cuando el responsable funcional confirma que todos los requisitos y reglas representan la operación real.
