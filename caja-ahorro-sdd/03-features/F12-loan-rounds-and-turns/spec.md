# F12 - Rondas y turnos de préstamo

## Estado

Propuesta para revisión.

## Fase

Fase 2

## Dependencias

F05, F10, F11.

## Propósito

Ordenar la entrega de préstamos por número y limitar a un préstamo por ronda.

## Historias y requisitos funcionales

- **FR-F12-001:** Como tesorero quiero ver los siguientes cinco números elegibles.
- **FR-F12-002:** Como tesorero quiero posponer y reactivar un turno conservando su prioridad.
- **FR-F12-003:** Como tesorero quiero cerrar una ronda.

## Reglas de negocio

- **BR-F12-001:** Solo una ronda activa por caja.
- **BR-F12-002:** Cada número recibe máximo un préstamo por ronda.
- **BR-F12-003:** Los candidatos se ordenan por número.
- **BR-F12-004:** Se excluyen retirados, no incorporados, atendidos, reservados y personas con préstamo bloqueante.
- **BR-F12-005:** Un pospuesto conserva prioridad pero se oculta hasta reactivarse.
- **BR-F12-006:** Al reactivarse vuelve a su posición original.
- **BR-F12-007:** La ronda cierra automáticamente sin disponibles o manualmente.
- **BR-F12-008:** En la nueva ronda se reevalúan todos los números activos.
- **BR-F12-009:** La posposición no se arrastra.
- **BR-F12-010:** Un número nuevo durante la ronda espera la siguiente.

## Entidades relacionadas

LoanRound, LoanTurn

## Fuera de alcance

- Funcionalidades no mencionadas expresamente en esta especificación.
- Automatizaciones o integraciones externas no incluidas en el MVP.
- Edición destructiva de registros financieros.

## Casos límite

- Dos intentos de crear ronda activa.
- Persona con varios números.
- Cancelación de desembolso.

## Criterio de salida

La feature se considera especificada cuando el responsable funcional confirma que todos los requisitos y reglas representan la operación real.
