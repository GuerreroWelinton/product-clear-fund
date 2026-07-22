# Modelo de dominio

## Entidades principales

| Entidad | Responsabilidad |
|---|---|
| User | Identidad de acceso administrativo o futura cuenta de socio |
| CashFund | Caja y configuración operativa |
| CashFundUser | Asignación de tesoreros a cajas |
| Person | Identidad global única por cédula |
| Membership | Número de socio dentro de una caja |
| MembershipOnboarding | Alta pendiente antes de asignar número |
| SavingsObligation | Cuota mensual o futura de ahorro |
| Payment | Cabecera de un pago agrupado |
| PaymentAllocation | Asignación exacta a una obligación |
| LoanTemplate | Condiciones inmutables tras activación |
| LoanTemplateCapitalSegment | Tramos manuales de capital |
| LoanRound | Ronda de préstamos |
| LoanTurn | Estado del número dentro de la ronda |
| Loan | Préstamo asignado a una persona y número |
| LoanInstallment | Cuota completa de capital e interés |
| Expense | Gasto confirmado o reversado |
| CashMovement | Ledger inmutable de entradas y salidas |
| RiskEvent | Evento rojo por número y mes |
| AnnualClosing | Cierre congelado |
| DistributionAllocation | Rendimiento por número y subperiodo |
| MembershipWithdrawal | Liquidación y retiro de un número |
| AuditEvent | Bitácora de cambios |
| MigrationBatch | Lote de migración y conciliación |

## Relaciones críticas

- Person 1:N Membership.
- CashFund 1:N Membership.
- User N:M CashFund mediante CashFundUser.
- Membership 1:N SavingsObligation.
- Payment 1:N PaymentAllocation.
- LoanTemplate 1:N Loan.
- Loan 1:N LoanInstallment.
- LoanRound 1:N LoanTurn.
- Toda operación financiera confirmada genera CashMovement.
