# Criterios de aceptación - F11 Plantillas de préstamo

## Escenarios obligatorios

### AC-F11-001

**Escenario:** Dada una plantilla cuyos tramos no suman el principal, cuando se activa, entonces se rechaza.

- Tipo sugerido: integración y E2E.
- Debe verificar datos persistidos, movimientos y auditoría cuando aplique.
### AC-F11-002

**Escenario:** Dada una plantilla activa, cuando se intenta editar, entonces se rechaza.

- Tipo sugerido: integración.
- Debe verificar datos persistidos, movimientos y auditoría cuando aplique.
### AC-F11-003

**Escenario:** Dada una plantilla inactiva, cuando se reactiva, entonces conserva exactamente sus condiciones.

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
