# Criterios de aceptación - F19 Retiro y liquidación de un número

## Escenarios obligatorios

### AC-F19-001

**Escenario:** Dado un retiro a mitad de mes, entonces solo se exigen cuotas hasta el mes anterior.

- Tipo sugerido: integración y E2E.
- Debe verificar datos persistidos, movimientos y auditoría cuando aplique.
### AC-F19-002

**Escenario:** Dado un neto negativo, entonces no se retira el número.

- Tipo sugerido: integración.
- Debe verificar datos persistidos, movimientos y auditoría cuando aplique.
### AC-F19-003

**Escenario:** Dado un retiro confirmado, entonces el número queda terminalmente WITHDRAWN y no se reutiliza.

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
