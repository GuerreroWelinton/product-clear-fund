# Criterios de aceptación - F03 Asignación de tesoreros

## Escenarios obligatorios

### AC-F03-001

**Escenario:** Dado un tesorero sin asignación, cuando consulta una caja, entonces recibe acceso denegado.

- Tipo sugerido: integración y E2E.
- Debe verificar datos persistidos, movimientos y auditoría cuando aplique.
### AC-F03-002

**Escenario:** Dada una caja con dos tesoreros, cuando cualquiera opera, entonces la operación registra al responsable correcto.

- Tipo sugerido: integración.
- Debe verificar datos persistidos, movimientos y auditoría cuando aplique.
### AC-F03-003

**Escenario:** Dada una asignación retirada, cuando el tesorero vuelve a consultar, entonces la caja deja de estar disponible.

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
