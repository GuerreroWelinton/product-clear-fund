# F18 - Cierre y distribución de rendimientos

## Estado

Propuesta para revisión.

## Fase

Fase 3

## Dependencias

F08, F09, F17, F20.

## Propósito

Calcular intereses cobrados menos gastos, déficit y ajustes, y repartir por número participante.

## Historias y requisitos funcionales

- **FR-F18-001:** Como tesorero quiero previsualizar un cierre antes de confirmarlo.
- **FR-F18-002:** Como tesorero quiero repartir el neto por número participante.
- **FR-F18-003:** Como sistema quiero arrastrar déficit y remanentes.

## Reglas de negocio

- **BR-F18-001:** Solo se consideran intereses cobrados.
- **BR-F18-002:** Todos los gastos confirmados se restan.
- **BR-F18-003:** Si el resultado es negativo no hay reparto y el déficit se arrastra.
- **BR-F18-004:** Los centavos sobrantes se arrastran como remanente.
- **BR-F18-005:** El reparto es por número, no por persona.
- **BR-F18-006:** Se usan subperiodos de participación para entradas y retiros.
- **BR-F18-007:** Los números activos participan aunque estén atrasados o en riesgo.
- **BR-F18-008:** Un retirado recibe rendimiento hasta su fecha de retiro.
- **BR-F18-009:** Al confirmar, se considera entregado y genera salida; no aumenta ahorro.
- **BR-F18-010:** El cierre confirmado queda congelado.
- **BR-F18-011:** Pagos, gastos o reversas tardíos se aplican al periodo abierto siguiente.

## Entidades relacionadas

AnnualClosing, ParticipationPeriod, DistributionAllocation, CashMovement

## Fuera de alcance

- Funcionalidades no mencionadas expresamente en esta especificación.
- Automatizaciones o integraciones externas no incluidas en el MVP.
- Edición destructiva de registros financieros.

## Casos límite

- Gastos mayores a intereses.
- Centavos no divisibles.
- Número incorporado a mitad de periodo.
- Operación tardía.

## Criterio de salida

La feature se considera especificada cuando el responsable funcional confirma que todos los requisitos y reglas representan la operación real.
