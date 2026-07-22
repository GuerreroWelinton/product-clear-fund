# Criterios de aceptación - F05 Alta de números e igualación

## Escenarios obligatorios

### AC-F05-001

**Escenario:** Dadas dos altas concurrentes en una caja, cuando se confirman, entonces reciben números distintos y consecutivos.

- Tipo sugerido: integración y E2E.
- Debe verificar datos persistidos, movimientos y auditoría cuando aplique.
### AC-F05-002

**Escenario:** Dada una igualación incompleta, cuando se intenta activar, entonces no se consume un número.

- Tipo sugerido: integración.
- Debe verificar datos persistidos, movimientos y auditoría cuando aplique.
### AC-F05-003

**Escenario:** Dado un número activado después del job mensual, entonces su primera cuota se genera el mes siguiente.

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
