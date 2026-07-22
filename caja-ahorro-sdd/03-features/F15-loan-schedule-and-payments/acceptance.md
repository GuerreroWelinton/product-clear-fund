# Criterios de aceptación - F15 Cronograma y pagos de préstamo

## Escenarios obligatorios

### AC-F15-001

**Escenario:** Dado un préstamo desembolsado, entonces se generan todas las cuotas una sola vez.

- Tipo sugerido: integración y E2E.
- Debe verificar datos persistidos, movimientos y auditoría cuando aplique.
### AC-F15-002

**Escenario:** Dado ahorro actual pendiente y seleccionado en el mismo pago, entonces se permite pagar la cuota.

- Tipo sugerido: integración.
- Debe verificar datos persistidos, movimientos y auditoría cuando aplique.
### AC-F15-003

**Escenario:** Dada una cuota anterior pendiente, entonces no se puede pagar una posterior.

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
