# Criterios de aceptación - F17 Registro y reversa de gastos

## Escenarios obligatorios

### AC-F17-001

**Escenario:** Dado un gasto confirmado, entonces el saldo disminuye y queda disponible para el cierre.

- Tipo sugerido: integración y E2E.
- Debe verificar datos persistidos, movimientos y auditoría cuando aplique.
### AC-F17-002

**Escenario:** Dado un gasto de periodo cerrado, entonces el cierre previo no cambia y se descuenta del siguiente.

- Tipo sugerido: integración.
- Debe verificar datos persistidos, movimientos y auditoría cuando aplique.
### AC-F17-003

**Escenario:** Dado un gasto reversado, entonces deja de descontarse y se crea movimiento contrario.

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
