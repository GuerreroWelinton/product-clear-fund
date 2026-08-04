# Criterios de aceptación - F20 Libro de caja y saldos

## Escenarios obligatorios

### AC-F20-001

**Escenario:** Dado un conjunto de movimientos, entonces el saldo recalculado coincide con el mostrado.

- Tipo sugerido: integración y E2E.
- Debe verificar datos persistidos, movimientos y auditoría cuando aplique.
- Requisitos que verifica: `FR-F20-001`, `BR-F20-003`.

### AC-F20-002

**Escenario:** Dado un préstamo en proceso, entonces reduce saldo libre pero no contable.

- Tipo sugerido: integración.
- Debe verificar datos persistidos, movimientos y auditoría cuando aplique.
- Requisitos que verifica: `BR-F20-004`, `BR-F20-005`. Diferido a F13 (ADR-014 §3): no existe préstamo en proceso.

### AC-F20-003

**Escenario:** Dado saldo insuficiente, entonces un desembolso es rechazado.

- Tipo sugerido: integración.
- Debe verificar datos persistidos, movimientos y auditoría cuando aplique.
- Requisitos que verifica: `FR-F20-003`, `BR-F20-008`. Diferido a F14 (ADR-014 §3): la regla pura `assertSufficientBalance` sí se prueba unitariamente.

## Matriz mínima de pruebas

| Nivel | Objetivo |
|---|---|
| Unitario | Reglas de negocio y cálculos |
| Integración | Constraints, transacciones, autorización y persistencia |
| E2E | Flujo administrativo principal |
| Manual | Claridad de interfaz y conciliación |

## Requisitos no funcionales

- La operación no debe permitir acceso entre cajas.
- Los errores funcionales deben ser comprensibles.
- Las operaciones financieras deben ser atómicas.
- Los reintentos no deben duplicar resultados.
- El historial debe conservar actor y fecha.
