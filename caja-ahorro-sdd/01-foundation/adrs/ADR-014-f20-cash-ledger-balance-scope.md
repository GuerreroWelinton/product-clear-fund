# ADR-014 - Alcance de F20 (libro de caja y saldos)

## Estado
Aceptado.

## Contexto
F20 define el ledger inmutable y los tres saldos, pero sus casos de uso en `plan.md` son
solo de lectura (`getCashFundBalance`, `listCashMovements`). Ninguna operación que produzca
un `CashMovement` existe todavía: los aportes son F06/F08, el desembolso F14 y los gastos F17.

Además `plan.md` ubica el módulo en `src/modules/cash-ledger-balance`, mientras
`ARCHITECTURE.md` lo declara como `ledger`.

## Decisión

### 1. Carpeta del módulo
El módulo vive en `src/modules/ledger`, siguiendo ARCHITECTURE.md. Igual que en ADR-007,
`cash-ledger-balance` queda como nombre de feature, no de carpeta.

### 2. F20 entrega el registro y la derivación, no los productores
F20 implementa la tabla `CashMovement` con inmutabilidad en base de datos, la derivación de
saldo contable, comprometido y libre, la regla de suficiencia, y el libro cronológico.
Las escrituras las cablean las features dueñas de cada operación.

### 3. Escenarios de aceptación diferidos
Misma costura que ADR-013 §8: la regla pura se implementa y se prueba unitariamente ahora;
el escenario de integración lo implementa la feature habilitante.

| Escenario | Estado en F20 | Motivo |
|---|---|---|
| AC-F20-001 (saldo recalculado coincide) | **Implementado** | Se prueba completo en integración. |
| AC-F20-002 (préstamo en proceso reduce saldo libre, no contable) | **Diferido a F13** | No existe préstamo en proceso. `getCashFundBalance` devuelve comprometido derivado de una fuente que hoy no aporta filas. |
| AC-F20-003 (saldo insuficiente rechaza desembolso) | **Diferido a F14** | No existe desembolso. `assertSufficientBalance` se prueba unitariamente. |

`BR-F20-004` y `BR-F20-008` quedan satisfechos estructuralmente por esas costuras.

### 4. Sin ajustes manuales
Por `BR-F20-006` y ADR-004, el módulo no expone ningún caso de uso de creación ni corrección
manual de movimientos. La única corrección es la reversa, y la implementa F09.

## Consecuencias
- El código respeta la lista de módulos de ARCHITECTURE.md.
- F13 hereda poblar el saldo comprometido; F14, la validación de suficiencia en el desembolso.
- F20 salda la deuda de ADR-013 §8 en la parte que le toca: `CashMovement` nace con
  `relatedEventId` y `correlationId` para enlazar movimiento y evento de auditoría.
- El libro se entrega vacío hasta que F06/F08 escriban el primer movimiento.
