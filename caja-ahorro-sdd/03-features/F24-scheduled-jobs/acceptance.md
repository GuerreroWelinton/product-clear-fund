# Criterios de aceptación - F24 Procesos automáticos e idempotencia

## Escenarios obligatorios

### AC-F24-001

**Escenario:** Dadas dos ejecuciones concurrentes del mismo job, entonces solo una crea registros.

- Tipo sugerido: integración y E2E.
- Debe verificar datos persistidos, movimientos y auditoría cuando aplique.
### AC-F24-002

**Escenario:** Dado un fallo parcial, cuando se reintenta, entonces completa faltantes sin duplicar.

- Tipo sugerido: integración.
- Debe verificar datos persistidos, movimientos y auditoría cuando aplique.
### AC-F24-003

**Escenario:** Dada una caja inactiva, entonces la generación ordinaria la omite.

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
