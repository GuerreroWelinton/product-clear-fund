# Criterios de aceptación - F04 Registro único de personas

## Escenarios obligatorios

### AC-F04-001

**Escenario:** Dada una cédula existente, cuando se intenta crear otra persona, entonces se reutiliza o se informa el registro existente.

- Tipo sugerido: integración y E2E.
- Debe verificar datos persistidos, movimientos y auditoría cuando aplique.
### AC-F04-002

**Escenario:** Dada una cédula nueva disponible y un motivo, cuando se corrige, entonces se actualiza y se audita.

- Tipo sugerido: integración.
- Debe verificar datos persistidos, movimientos y auditoría cuando aplique.
### AC-F04-003

**Escenario:** Dada una cédula ocupada por otra persona, cuando se intenta corregir, entonces se bloquea.

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
