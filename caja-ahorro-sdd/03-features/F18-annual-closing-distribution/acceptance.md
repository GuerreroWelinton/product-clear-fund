# Criterios de aceptación - F18 Cierre y distribución de rendimientos

## Escenarios obligatorios

### AC-F18-001

**Escenario:** Dado resultado negativo, cuando se confirma el cierre, entonces no hay distribución y se guarda déficit.

- Tipo sugerido: integración y E2E.
- Debe verificar datos persistidos, movimientos y auditoría cuando aplique.
### AC-F18-002

**Escenario:** Dado un reparto con centavos sobrantes, entonces el remanente se arrastra.

- Tipo sugerido: integración.
- Debe verificar datos persistidos, movimientos y auditoría cuando aplique.
### AC-F18-003

**Escenario:** Dado un número incorporado después del inicio, entonces no recibe intereses anteriores a su participación.

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
