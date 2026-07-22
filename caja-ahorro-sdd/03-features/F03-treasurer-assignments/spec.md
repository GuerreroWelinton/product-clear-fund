# F03 - Asignación de tesoreros

## Estado

Propuesta para revisión.

## Fase

Fase 0

## Dependencias

F01, F02.

## Propósito

Asignar uno o varios tesoreros a cada caja y limitar su acceso a las cajas autorizadas.

## Historias y requisitos funcionales

- **FR-F03-001:** Como Super Admin quiero asignar varios tesoreros a una caja.
- **FR-F03-002:** Como tesorero quiero ver únicamente mis cajas asignadas.
- **FR-F03-003:** Como Super Admin quiero retirar una asignación sin borrar el historial del tesorero.

## Reglas de negocio

- **BR-F03-001:** Solo el Super Admin administra asignaciones.
- **BR-F03-002:** Una caja puede tener varios tesoreros.
- **BR-F03-003:** Un tesorero puede administrar varias cajas.
- **BR-F03-004:** Retirar una asignación no cambia operaciones históricas.
- **BR-F03-005:** Todas las consultas y mutaciones de tesorero deben filtrar por asignación activa.

## Entidades relacionadas

CashFundUser

## Fuera de alcance

- Funcionalidades no mencionadas expresamente en esta especificación.
- Automatizaciones o integraciones externas no incluidas en el MVP.
- Edición destructiva de registros financieros.

## Casos límite

- Asignación duplicada.
- Intento de operar una caja no asignada.
- Retiro de acceso durante una sesión activa.

## Criterio de salida

La feature se considera especificada cuando el responsable funcional confirma que todos los requisitos y reglas representan la operación real.
