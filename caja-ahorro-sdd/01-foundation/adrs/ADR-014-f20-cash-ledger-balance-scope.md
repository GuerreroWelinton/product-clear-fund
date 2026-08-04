# ADR-014 - Alcance de F20 (libro de caja y saldos)

## Estado
Aceptado.

## Contexto
F20 define el ledger inmutable y los tres saldos, pero sus casos de uso en `plan.md` son
solo de lectura (`getCashFundBalance`, `listCashMovements`). Ninguna operación que produzca
un `CashMovement` existe todavía: los aportes son F06/F08, el desembolso F14 y los gastos F17.

Además `plan.md` ubica el módulo en `src/modules/cash-ledger-balance`, mientras
`ARCHITECTURE.md` lo declara como `ledger`.

La validación manual descubrió un tercer punto sin definir: el libro filtra por fecha
calendario sobre una columna que guarda instantes, y nadie había fijado qué zona define el
borde del día.

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

### 5. El borde del día lo define la zona de negocio
`fromDate` y `toDate` reciben una fecha calendario, no un instante, y una fecha calendario
solo existe respecto de una zona. El rango se resuelve en `America/Guayaquil`
(`TECHNICAL_CONVENTIONS.md`), no en UTC ni en la zona del navegador:

- `toDate` es inclusivo: el rango es `[fromDate 00:00, toDate+1día 00:00)` en esa zona.
- Es la misma zona en que se renderiza, así que una fila mostrada como 30/06 20:00 entra en
  un filtro hasta el 30/06 aunque se persista como 01/07 en UTC.
- Se descartó la zona del visitante: el día de un movimiento es un hecho contable único, la
  página es un Server Component que nunca recibe la zona del navegador, y las URLs con
  filtros dejarían de devolver el mismo conjunto para todos.

Las utilidades viven en `src/lib/dates` (`BUSINESS_TIME_ZONE`, `businessDayStart`,
`businessDayEndExclusive`), el hueco que ARCHITECTURE.md reserva para fechas. El offset se
lee con `Intl` en el instante resuelto en lugar de fijarse en `-05:00`, para no depender de
que Ecuador no aplique horario de verano.

## Consecuencias
- El código respeta la lista de módulos de ARCHITECTURE.md.
- Toda feature que filtre o agrupe por fecha — cierres mensuales, intereses, días de mora —
  usa `src/lib/dates` en vez de construir sus propios bordes. Un borde en UTC manda los
  movimientos de la noche del último día del mes al mes siguiente.
- F13 hereda poblar el saldo comprometido; F14, la validación de suficiencia en el desembolso.
- F20 salda la deuda de ADR-013 §8 en la parte que le toca: `CashMovement` nace con
  `relatedEventId` y `correlationId` para enlazar movimiento y evento de auditoría.
- El libro se entrega vacío hasta que F06/F08 escriban el primer movimiento.
