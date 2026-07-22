# Criterios de aceptación - F22 Migración inicial y saldos de apertura

## Escenarios obligatorios

### AC-F22-001

**Escenario:** Dado un lote con duplicados, entonces la ejecución se bloquea antes de escribir.

- Tipo sugerido: integración y E2E.
- Debe verificar datos persistidos, movimientos y auditoría cuando aplique.
### AC-F22-002

**Escenario:** Dada una cuota importada vencida, entonces aparece en morosidad y no crea RiskEvent.

- Tipo sugerido: integración.
- Debe verificar datos persistidos, movimientos y auditoría cuando aplique.
### AC-F22-003

**Escenario:** Dado un lote válido, entonces puede ejecutarse en prueba y producir el mismo resultado al repetir desde una base limpia.

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
