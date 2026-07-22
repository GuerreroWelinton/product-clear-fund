# Criterios de aceptación - F08 Pagos agrupados y asignaciones

## Escenarios obligatorios

### AC-F08-001

**Escenario:** Dado un pago con tres obligaciones, cuando se confirma, entonces se crean tres allocations y una entrada de caja.

- Tipo sugerido: integración y E2E.
- Debe verificar datos persistidos, movimientos y auditoría cuando aplique.
### AC-F08-002

**Escenario:** Dada una fecha futura, cuando se confirma, entonces se rechaza.

- Tipo sugerido: integración.
- Debe verificar datos persistidos, movimientos y auditoría cuando aplique.
### AC-F08-003

**Escenario:** Dada una obligación pagada concurrentemente, entonces solo una operación se confirma.

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
