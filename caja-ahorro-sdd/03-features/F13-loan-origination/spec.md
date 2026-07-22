# F13 - Asignación de préstamo

## Estado

Propuesta para revisión.

## Fase

Fase 2

## Dependencias

F10, F11, F12.

## Propósito

Asignar una plantilla a un número elegible, validando ahorros, riesgo y exclusividad por persona.

## Historias y requisitos funcionales

- **FR-F13-001:** Como tesorero quiero asignar un préstamo a un número elegible.
- **FR-F13-002:** Como sistema quiero impedir otro préstamo activo o en proceso para la misma persona.
- **FR-F13-003:** Como tesorero quiero continuar con advertencia cuando el número está en riesgo.

## Reglas de negocio

- **BR-F13-001:** Solo un préstamo bloqueante por persona y caja.
- **BR-F13-002:** El préstamo se asocia a un número específico.
- **BR-F13-003:** Todos los números activos de la persona deben estar al día en ahorros antes de asignar.
- **BR-F13-004:** Debe elegirse un turno disponible de la ronda.
- **BR-F13-005:** Un número riesgoso puede continuar solo con override y auditoría.
- **BR-F13-006:** El monto es el exacto de la plantilla.

## Entidades relacionadas

Loan, LoanTurn, RiskOverride

## Fuera de alcance

- Funcionalidades no mencionadas expresamente en esta especificación.
- Automatizaciones o integraciones externas no incluidas en el MVP.
- Edición destructiva de registros financieros.

## Casos límite

- Persona con otro préstamo.
- Un número atrasado entre varios.
- Turno tomado concurrentemente.

## Criterio de salida

La feature se considera especificada cuando el responsable funcional confirma que todos los requisitos y reglas representan la operación real.
