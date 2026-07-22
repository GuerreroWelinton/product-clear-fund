# Criterios de aceptación - F23 Auditoría transversal

## Escenarios obligatorios

### AC-F23-001

**Escenario:** Dado un cambio de cédula, entonces la auditoría conserva valor anterior, nuevo, motivo y actor.

- Tipo sugerido: integración y E2E.
- Debe verificar datos persistidos, movimientos y auditoría cuando aplique.
### AC-F23-002

**Escenario:** Dada una reversa, entonces la auditoría enlaza original y reversa.

- Tipo sugerido: integración.
- Debe verificar datos persistidos, movimientos y auditoría cuando aplique.
### AC-F23-003

**Escenario:** Dado un tesorero, entonces solo consulta eventos de sus cajas.

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
