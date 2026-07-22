# F16 - Liquidación anticipada

## Estado

Propuesta para revisión.

## Fase

Fase 2

## Dependencias

F15.

## Propósito

Cerrar un préstamo sin cobrar intereses futuros cuando se pretende pagar todas las cuotas restantes.

## Historias y requisitos funcionales

- **FR-F16-001:** Como tesorero quiero que el sistema use liquidación anticipada automáticamente al seleccionar todo lo restante.
- **FR-F16-002:** Como socio quiero evitar intereses futuros.

## Reglas de negocio

- **BR-F16-001:** Seleccionar todas las cuotas restantes activa liquidación anticipada automáticamente.
- **BR-F16-002:** Se cobra capital pendiente.
- **BR-F16-003:** Se cobran intereses vencidos anteriores.
- **BR-F16-004:** Se cobra el interés fijo completo del mes actual.
- **BR-F16-005:** No se cobran intereses futuros.
- **BR-F16-006:** El interés del mes actual no se prorratea.
- **BR-F16-007:** Aunque la cuota normal del mes ya fue pagada, se cobra el interés del mes corriente según la regla definida.
- **BR-F16-008:** Solo el ahorro del número asociado debe estar al día.
- **BR-F16-009:** El pago de ahorro y la liquidación son operaciones separadas.
- **BR-F16-010:** El préstamo termina PAID_EARLY.

## Entidades relacionadas

LoanSettlement, Loan, LoanInstallment, CashMovement

## Fuera de alcance

- Funcionalidades no mencionadas expresamente en esta especificación.
- Automatizaciones o integraciones externas no incluidas en el MVP.
- Edición destructiva de registros financieros.

## Casos límite

- Liquidación el día 1 o 30.
- Interés del mes con cuota normal ya pagada.
- Cuotas vencidas migradas.

## Criterio de salida

La feature se considera especificada cuando el responsable funcional confirma que todos los requisitos y reglas representan la operación real.
