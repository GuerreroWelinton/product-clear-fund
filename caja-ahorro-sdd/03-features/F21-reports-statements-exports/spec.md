# F21 - Reportes, estados de cuenta y exportaciones

## Estado

Propuesta para revisión.

## Fase

Fase 3

## Dependencias

F06, F08, F10, F15, F18, F19, F20.

## Propósito

Proveer vistas administrativas y exportaciones coherentes con filtros y permisos.

## Historias y requisitos funcionales

- **FR-F21-001:** Como tesorero quiero consultar estado de cuenta por número.
- **FR-F21-002:** Como Super Admin quiero reportes globales por caja.
- **FR-F21-003:** Como tesorero quiero exportar PDF y CSV/XLSX.

## Reglas de negocio

- **BR-F21-001:** El resumen de persona muestra saldos; el detalle del número muestra movimientos.
- **BR-F21-002:** Las exportaciones respetan exactamente los filtros visibles.
- **BR-F21-003:** Un tesorero solo exporta cajas asignadas.
- **BR-F21-004:** Los reportes deben diferenciar origen MIGRATION y SYSTEM.
- **BR-F21-005:** Montos y periodos deben ser conciliables con el ledger.

## Entidades relacionadas

Proyecciones de lectura, sin nueva entidad obligatoria.

## Fuera de alcance

- Funcionalidades no mencionadas expresamente en esta especificación.
- Automatizaciones o integraciones externas no incluidas en el MVP.
- Edición destructiva de registros financieros.

## Casos límite

- Grandes rangos de fechas.
- Filtros combinados.
- Caja inactiva.

## Criterio de salida

La feature se considera especificada cuando el responsable funcional confirma que todos los requisitos y reglas representan la operación real.
