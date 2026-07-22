# F24 - Procesos automáticos e idempotencia

## Estado

Propuesta para revisión.

## Fase

Fase 3

## Dependencias

F02, F06, F10.

## Propósito

Ejecutar generación mensual, recuperación y actualizaciones automáticas de forma segura.

## Historias y requisitos funcionales

- **FR-F24-001:** Como sistema quiero generar cuotas al inicio de mes.
- **FR-F24-002:** Como operador quiero reintentar un job fallido sin duplicados.
- **FR-F24-003:** Como tesorero quiero ver el resultado de cada ejecución.

## Reglas de negocio

- **BR-F24-001:** Los jobs son idempotentes.
- **BR-F24-002:** Cada ejecución registra clave, inicio, fin, resultado y errores.
- **BR-F24-003:** Generar cuotas solo para cajas activas en ejecución ordinaria.
- **BR-F24-004:** El backfill de reactivación crea periodos faltantes.
- **BR-F24-005:** El riesgo puede recalcularse desde obligaciones y pagos sin duplicar eventos.
- **BR-F24-006:** El job no debe ejecutar dos veces el mismo periodo y caja en paralelo.

## Entidades relacionadas

JobExecution

## Fuera de alcance

- Funcionalidades no mencionadas expresamente en esta especificación.
- Automatizaciones o integraciones externas no incluidas en el MVP.
- Edición destructiva de registros financieros.

## Casos límite

- Ejecución concurrente.
- Fallo parcial.
- Reintento.

## Criterio de salida

La feature se considera especificada cuando el responsable funcional confirma que todos los requisitos y reglas representan la operación real.
