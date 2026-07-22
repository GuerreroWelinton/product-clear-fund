# F23 - Auditoría transversal

## Estado

Propuesta para revisión.

## Fase

Fase 0

## Dependencias

F01.

## Propósito

Registrar quién hizo qué, cuándo y sobre qué caja o entidad.

## Historias y requisitos funcionales

- **FR-F23-001:** Como Super Admin quiero consultar la bitácora global.
- **FR-F23-002:** Como tesorero quiero ver auditoría de mis cajas.
- **FR-F23-003:** Como auditor quiero comparar valores anteriores y nuevos.

## Reglas de negocio

- **BR-F23-001:** Auditar cambios de configuración, cédula, asignaciones, estados y operaciones financieras.
- **BR-F23-002:** Guardar actor, fecha, caja, entidad, acción, motivo y cambios.
- **BR-F23-003:** No permitir editar o eliminar auditoría.
- **BR-F23-004:** No guardar secretos ni contraseñas.
- **BR-F23-005:** Los eventos financieros deben enlazar la operación original.

## Entidades relacionadas

AuditEvent

## Fuera de alcance

- Funcionalidades no mencionadas expresamente en esta especificación.
- Automatizaciones o integraciones externas no incluidas en el MVP.
- Edición destructiva de registros financieros.

## Casos límite

- Operación fallida no confirmada.
- Evento sin caja global.
- Datos sensibles.

## Criterio de salida

La feature se considera especificada cuando el responsable funcional confirma que todos los requisitos y reglas representan la operación real.
