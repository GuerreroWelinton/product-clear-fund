# F11 - Plantillas de préstamo

## Estado

Propuesta para revisión.

## Fase

Fase 2

## Dependencias

F02, F23.

## Propósito

Definir préstamos de monto exacto, interés fijo y tramos manuales de capital.

## Historias y requisitos funcionales

- **FR-F11-001:** Como tesorero quiero crear una plantilla en borrador.
- **FR-F11-002:** Como tesorero quiero activar una plantilla válida y volverla inmutable.
- **FR-F11-003:** Como tesorero quiero desactivar y reactivar una plantilla sin cambiar condiciones.

## Reglas de negocio

- **BR-F11-001:** Cada caja puede tener varias plantillas.
- **BR-F11-002:** El monto entregado es exacto.
- **BR-F11-003:** El interés mensual es valor fijo en dólares.
- **BR-F11-004:** El tesorero define tramos por rangos de cuotas.
- **BR-F11-005:** Los tramos cubren todas las cuotas, no se cruzan y suman exactamente el principal.
- **BR-F11-006:** Solo DRAFT es editable.
- **BR-F11-007:** Al activar nunca vuelve a borrador.
- **BR-F11-008:** ACTIVE e INACTIVE pueden alternarse sin cambios.
- **BR-F11-009:** Para nuevas condiciones se duplica a un nuevo borrador.
- **BR-F11-010:** El plazo máximo de desembolso forma parte de la plantilla.

## Entidades relacionadas

LoanTemplate, LoanTemplateCapitalSegment

## Fuera de alcance

- Funcionalidades no mencionadas expresamente en esta especificación.
- Automatizaciones o integraciones externas no incluidas en el MVP.
- Edición destructiva de registros financieros.

## Casos límite

- Suma de capital incorrecta.
- Huecos o cruces.
- Intento de editar activa.

## Criterio de salida

La feature se considera especificada cuando el responsable funcional confirma que todos los requisitos y reglas representan la operación real.
