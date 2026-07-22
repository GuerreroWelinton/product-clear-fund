# Criterios de aceptación - F14 Desembolso y saldo comprometido

## Escenarios obligatorios

### AC-F14-001

**Escenario:** Dado saldo libre insuficiente, cuando se intenta comprometer, entonces se bloquea.

- Tipo sugerido: integración y E2E.
- Debe verificar datos persistidos, movimientos y auditoría cuando aplique.
### AC-F14-002

**Escenario:** Dados dos compromisos concurrentes, entonces la suma confirmada nunca supera el saldo.

- Tipo sugerido: integración.
- Debe verificar datos persistidos, movimientos y auditoría cuando aplique.
### AC-F14-003

**Escenario:** Dado un desembolso cancelado, entonces el turno vuelve disponible y se libera el compromiso.

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
