# F10 - Morosidad, semáforo y riesgo

## Estado

Propuesta para revisión.

## Fase

Fase 1

## Dependencias

F06, F08, F09.

## Propósito

Clasificar pagos por fecha, reportar atrasos y contar eventos rojos por número y año.

## Historias y requisitos funcionales

- **FR-F10-001:** Como tesorero quiero identificar cuotas verdes, amarillas y rojas.
- **FR-F10-002:** Como tesorero quiero ver números que alcanzan el umbral de riesgo.
- **FR-F10-003:** Como sistema quiero contar máximo un evento rojo por número y mes.

## Reglas de negocio

- **BR-F10-001:** Verde hasta la fecha recomendada efectiva.
- **BR-F10-002:** Amarillo después de recomendada y hasta máxima.
- **BR-F10-003:** Rojo después de máxima.
- **BR-F10-004:** Si recomendada y máxima coinciden, no hay amarillo.
- **BR-F10-005:** Solo rojo cuenta para riesgo.
- **BR-F10-006:** Máximo un evento de riesgo por número y periodo aunque haya ahorro y préstamo.
- **BR-F10-007:** El conteo se reinicia por año calendario, pero el historial permanece.
- **BR-F10-008:** Obligaciones migradas no cuentan; el conteo inicia con la puesta en marcha.
- **BR-F10-009:** El riesgo no bloquea automáticamente; un préstamo requiere advertencia y override auditado.

## Entidades relacionadas

RiskEvent

## Fuera de alcance

- Funcionalidades no mencionadas expresamente en esta especificación.
- Automatizaciones o integraciones externas no incluidas en el MVP.
- Edición destructiva de registros financieros.

## Casos límite

- Pago retroactivo registrado después.
- Reversa de un pago rojo.
- Dos obligaciones rojas del mismo mes.

## Criterio de salida

La feature se considera especificada cuando el responsable funcional confirma que todos los requisitos y reglas representan la operación real.
