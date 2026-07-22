# F17 - Registro y reversa de gastos

## Estado

Propuesta para revisión.

## Fase

Fase 3

## Dependencias

F20, F23.

## Propósito

Registrar gastos reales que reducen el saldo y el rendimiento distribuible.

## Historias y requisitos funcionales

- **FR-F17-001:** Como tesorero quiero registrar un gasto confirmado.
- **FR-F17-002:** Como tesorero quiero reversar un gasto incorrecto.
- **FR-F17-003:** Como responsable del cierre quiero considerar todos los gastos.

## Reglas de negocio

- **BR-F17-001:** Todos los gastos confirmados reducen inmediatamente el saldo.
- **BR-F17-002:** Todos se descuentan de intereses antes del reparto.
- **BR-F17-003:** No se eliminan; se reversan.
- **BR-F17-004:** Se permite registrar un gasto con fecha de un periodo cerrado.
- **BR-F17-005:** Un gasto tardío afecta el periodo abierto siguiente.
- **BR-F17-006:** No existen ajustes manuales genéricos de saldo.

## Entidades relacionadas

Expense, CashMovement

## Fuera de alcance

- Funcionalidades no mencionadas expresamente en esta especificación.
- Automatizaciones o integraciones externas no incluidas en el MVP.
- Edición destructiva de registros financieros.

## Casos límite

- Fecha futura.
- Gasto de periodo cerrado.
- Reversa posterior al cierre.

## Criterio de salida

La feature se considera especificada cuando el responsable funcional confirma que todos los requisitos y reglas representan la operación real.
