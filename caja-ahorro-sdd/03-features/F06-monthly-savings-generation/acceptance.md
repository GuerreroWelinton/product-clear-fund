# Criterios de aceptación - F06 Generación mensual de cuotas de ahorro

## Escenarios obligatorios

### AC-F06-001

**Escenario:** Dado un número activo, cuando corre el job del mes, entonces existe exactamente una cuota.

- Tipo sugerido: integración y E2E.
- Debe verificar datos persistidos, movimientos y auditoría cuando aplique.
### AC-F06-002

**Escenario:** Dado el mismo job ejecutado dos veces, entonces no se crean duplicados.

- Tipo sugerido: integración.
- Debe verificar datos persistidos, movimientos y auditoría cuando aplique.
### AC-F06-003

**Escenario:** Dada una fecha configurada en domingo, entonces la fecha efectiva se mueve al lunes.

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
