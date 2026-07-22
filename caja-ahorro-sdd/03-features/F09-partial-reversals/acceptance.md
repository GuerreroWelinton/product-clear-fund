# Criterios de aceptación - F09 Reversas parciales

## Escenarios obligatorios

### AC-F09-001

**Escenario:** Dado un pago con cuatro allocations, cuando se revierte una, entonces las otras tres permanecen pagadas.

- Tipo sugerido: integración y E2E.
- Debe verificar datos persistidos, movimientos y auditoría cuando aplique.
### AC-F09-002

**Escenario:** Dada una reversa sin motivo, entonces se rechaza.

- Tipo sugerido: integración.
- Debe verificar datos persistidos, movimientos y auditoría cuando aplique.
### AC-F09-003

**Escenario:** Dada una reversa de periodo cerrado, entonces el cierre no cambia y se crea ajuste para el siguiente.

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
