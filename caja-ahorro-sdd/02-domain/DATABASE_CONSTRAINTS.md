# Restricciones de base de datos

## Unicidad

- `Person.documentNumber` único global.
- `Membership(cashFundId, memberNumber)` único.
- `SavingsObligation(membershipId, period)` único.
- `LoanInstallment(loanId, installmentNumber)` único.
- Una ronda activa por caja.
- Un turno por número y ronda.
- Un préstamo bloqueante por persona y caja en estados `DISBURSEMENT_IN_PROGRESS` o `ACTIVE`.
- Un evento de riesgo por número y periodo.

## Checks

- Montos mayores que cero.
- Días de pago entre 1 y 31.
- Día recomendado menor o igual al máximo.
- Máximo de anticipos igual o mayor que cero.
- Suma de segmentos de capital igual al monto de plantilla antes de activar.
- Segmentos sin huecos ni cruces.
- Fechas de pago no futuras.
- Saldo libre suficiente antes de comprometer y desembolsar.

## Inmutabilidad lógica

- Plantillas activadas no se editan.
- Cuotas y préstamos conservan snapshots.
- Cierres confirmados no se recalculan.
- CashMovement no se elimina ni reescribe.
