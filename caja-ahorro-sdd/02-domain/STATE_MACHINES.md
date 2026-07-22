# Máquinas de estado

## Caja

`DRAFT -> ACTIVE <-> INACTIVE`

La cuota fija puede editarse solo antes de activar o registrar el primer número.

## Membresía

`PENDING_ONBOARDING -> ACTIVE -> WITHDRAWN`

`WITHDRAWN` es terminal.

## Plantilla de préstamo

`DRAFT -> ACTIVE <-> INACTIVE`

Nunca vuelve a `DRAFT` después de la primera activación.

## Ronda

`DRAFT -> ACTIVE -> CLOSED`

Solo una activa por caja.

## Turno

`AVAILABLE -> POSTPONED`
`AVAILABLE -> RESERVED -> ATTENDED`
`RESERVED -> AVAILABLE` si se cancela el desembolso.
`AVAILABLE -> INELIGIBLE` cuando corresponda.

## Préstamo

`DISBURSEMENT_IN_PROGRESS -> ACTIVE -> PAID`
`ACTIVE -> PAID_EARLY`
`DISBURSEMENT_IN_PROGRESS -> CANCELLED`

## Operaciones financieras

`CONFIRMED -> PARTIALLY_REVERSED -> REVERSED`
