# Criterios de aceptación - F20 Libro de caja y saldos

## Escenarios obligatorios

### AC-F20-001

**Escenario:** Dado un conjunto de movimientos, entonces el saldo recalculado coincide con el mostrado.

- Tipo sugerido: integración y E2E.
- Debe verificar datos persistidos, movimientos y auditoría cuando aplique.
### AC-F20-002

**Escenario:** Dado un préstamo en proceso, entonces reduce saldo libre pero no contable.

- Tipo sugerido: integración.
- Debe verificar datos persistidos, movimientos y auditoría cuando aplique.
### AC-F20-003

**Escenario:** Dado saldo insuficiente, entonces un desembolso es rechazado.

- Tipo sugerido: integración.
- Debe verificar datos persistidos, movimientos y auditoría cuando aplique.


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
