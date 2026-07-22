# F19 - Retiro y liquidación de un número

## Estado

Propuesta para revisión.

## Fase

Fase 3

## Dependencias

F05, F09, F16, F18, F20.

## Propósito

Retirar permanentemente un número, saldar deudas y devolver el neto en una transacción.

## Historias y requisitos funcionales

- **FR-F19-001:** Como tesorero quiero calcular la liquidación de un número.
- **FR-F19-002:** Como sistema quiero bloquear retiros con resultado negativo.
- **FR-F19-003:** Como socio quiero recuperar ahorros adelantados y rendimiento acumulado.

## Reglas de negocio

- **BR-F19-001:** El retiro es por número, independiente y permanente.
- **BR-F19-002:** Se exigen ahorros solo hasta el mes anterior.
- **BR-F19-003:** La cuota del mes actual se cancela por retiro.
- **BR-F19-004:** Los anticipos se devuelven íntegros.
- **BR-F19-005:** Las deudas se descuentan de la liquidación.
- **BR-F19-006:** Con préstamo activo se aplica liquidación anticipada.
- **BR-F19-007:** Se incluye rendimiento hasta la fecha.
- **BR-F19-008:** Si el neto es negativo se bloquea hasta pagar la diferencia.
- **BR-F19-009:** Liquidación, cancelaciones, salida, retiro y remoción de rondas ocurren en una transacción.
- **BR-F19-010:** El número nunca se reutiliza.

## Entidades relacionadas

MembershipWithdrawal, Membership, CashMovement

## Fuera de alcance

- Funcionalidades no mencionadas expresamente en esta especificación.
- Automatizaciones o integraciones externas no incluidas en el MVP.
- Edición destructiva de registros financieros.

## Casos límite

- Cuota actual ya pagada.
- Ahorros futuros.
- Préstamo activo.
- Neto negativo.

## Criterio de salida

La feature se considera especificada cuando el responsable funcional confirma que todos los requisitos y reglas representan la operación real.
