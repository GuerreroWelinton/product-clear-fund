# Plan de esquema Prisma

## Orden recomendado de entidades

1. User y modelos de Better Auth.
2. CashFund y CashFundUser.
3. Person, MembershipOnboarding y Membership.
4. SavingsObligation.
5. CashMovement.
6. Payment y PaymentAllocation.
7. RiskEvent.
8. LoanTemplate y LoanTemplateCapitalSegment.
9. LoanRound y LoanTurn.
10. Loan y LoanInstallment.
11. Expense.
12. AnnualClosing, ParticipationPeriod y DistributionAllocation.
13. MembershipWithdrawal.
14. AuditEvent.
15. MigrationBatch y JobExecution.

## Índices críticos

- Document number global.
- Member number por caja.
- Obligación por número y periodo.
- Estado y caja en obligaciones.
- Estado y persona en préstamos.
- Caja, fecha y tipo en movimientos.
- Caja y periodo en cierres.
- Caja y timestamp en auditoría.

## SQL específico

Preparar migraciones SQL para:

- Índice único parcial de préstamo bloqueante por persona y caja.
- Índice único parcial de ronda activa por caja.
- Checks de montos y días.
