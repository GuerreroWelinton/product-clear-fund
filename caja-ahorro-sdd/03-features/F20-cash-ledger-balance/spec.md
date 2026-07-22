# F20 - Libro de caja y saldos

## Estado

Propuesta para revisión.

## Fase

Fase 0

## Dependencias

F02, F23.

## Propósito

Mantener un ledger inmutable del que se derivan saldo contable, comprometido y libre.

## Historias y requisitos funcionales

- **FR-F20-001:** Como tesorero quiero consultar el saldo real de la caja.
- **FR-F20-002:** Como auditor quiero rastrear cada movimiento hasta su operación origen.
- **FR-F20-003:** Como sistema quiero evitar saldo negativo.

## Reglas de negocio

- **BR-F20-001:** La caja maneja un único saldo total.
- **BR-F20-002:** No se separan efectivo y bancos.
- **BR-F20-003:** El saldo contable se deriva de movimientos.
- **BR-F20-004:** El saldo comprometido proviene de préstamos en proceso.
- **BR-F20-005:** El saldo libre es contable menos comprometido.
- **BR-F20-006:** No existen ajustes manuales de entrada o salida.
- **BR-F20-007:** Cada movimiento tiene referencia, responsable y posible reversa.
- **BR-F20-008:** El desembolso no puede dejar saldo negativo.

## Entidades relacionadas

CashMovement

## Fuera de alcance

- Funcionalidades no mencionadas expresamente en esta especificación.
- Automatizaciones o integraciones externas no incluidas en el MVP.
- Edición destructiva de registros financieros.

## Casos límite

- Reversa.
- Movimiento de periodo cerrado.
- Consulta concurrente con desembolso.

## Criterio de salida

La feature se considera especificada cuando el responsable funcional confirma que todos los requisitos y reglas representan la operación real.
