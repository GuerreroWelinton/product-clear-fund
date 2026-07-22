# Criterios de aceptación - F10 Morosidad, semáforo y riesgo

## Escenarios obligatorios

### AC-F10-001

**Escenario:** Dado ahorro y préstamo rojos del mismo número y mes, entonces se registra un solo evento de riesgo.

- Tipo sugerido: integración y E2E.
- Debe verificar datos persistidos, movimientos y auditoría cuando aplique.
### AC-F10-002

**Escenario:** Dada una obligación importada vencida, entonces aparece en morosidad pero no suma riesgo.

- Tipo sugerido: integración.
- Debe verificar datos persistidos, movimientos y auditoría cuando aplique.
### AC-F10-003

**Escenario:** Dada una fecha máxima igual a recomendada, entonces no se produce estado amarillo.

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
