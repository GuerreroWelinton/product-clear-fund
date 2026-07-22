# Criterios de aceptación - F21 Reportes, estados de cuenta y exportaciones

## Escenarios obligatorios

### AC-F21-001

**Escenario:** Dado un filtro aplicado, cuando se exporta, entonces el archivo contiene los mismos registros.

- Tipo sugerido: integración y E2E.
- Debe verificar datos persistidos, movimientos y auditoría cuando aplique.
### AC-F21-002

**Escenario:** Dado un tesorero no asignado, entonces no puede consultar ni exportar la caja.

- Tipo sugerido: integración.
- Debe verificar datos persistidos, movimientos y auditoría cuando aplique.
### AC-F21-003

**Escenario:** Dado un número con saldo migrado, entonces el estado de cuenta distingue el movimiento inicial.

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
