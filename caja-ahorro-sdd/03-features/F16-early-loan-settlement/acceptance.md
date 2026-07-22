# Criterios de aceptación - F16 Liquidación anticipada

## Escenarios obligatorios

### AC-F16-001

**Escenario:** Dado un préstamo con cuotas futuras, cuando se liquidan todas, entonces no se cobran intereses futuros.

- Tipo sugerido: integración y E2E.
- Debe verificar datos persistidos, movimientos y auditoría cuando aplique.
### AC-F16-002

**Escenario:** Dada una liquidación en cualquier día del mes, entonces se cobra el interés mensual completo.

- Tipo sugerido: integración.
- Debe verificar datos persistidos, movimientos y auditoría cuando aplique.
### AC-F16-003

**Escenario:** Dado ahorro del número asociado pendiente, entonces la liquidación se bloquea.

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
