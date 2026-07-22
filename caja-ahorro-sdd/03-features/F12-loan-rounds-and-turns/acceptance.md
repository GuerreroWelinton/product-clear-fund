# Criterios de aceptación - F12 Rondas y turnos de préstamo

## Escenarios obligatorios

### AC-F12-001

**Escenario:** Dada una ronda activa, cuando se intenta activar otra, entonces se rechaza.

- Tipo sugerido: integración y E2E.
- Debe verificar datos persistidos, movimientos y auditoría cuando aplique.
### AC-F12-002

**Escenario:** Dado un turno pospuesto, cuando se reactiva, entonces vuelve según su número original.

- Tipo sugerido: integración.
- Debe verificar datos persistidos, movimientos y auditoría cuando aplique.
### AC-F12-003

**Escenario:** Dado un número creado durante la ronda, entonces no aparece hasta la siguiente.

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
