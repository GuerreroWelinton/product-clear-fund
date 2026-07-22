# Criterios de aceptación - F07 Adelanto de cuotas de ahorro

## Escenarios obligatorios

### AC-F07-001

**Escenario:** Dado un máximo de seis meses, cuando se selecciona un séptimo mes futuro, entonces se bloquea.

- Tipo sugerido: integración y E2E.
- Debe verificar datos persistidos, movimientos y auditoría cuando aplique.
### AC-F07-002

**Escenario:** Dado un mes anterior pendiente, cuando se intenta pagar un mes posterior, entonces se exige cubrir el anterior.

- Tipo sugerido: integración.
- Debe verificar datos persistidos, movimientos y auditoría cuando aplique.
### AC-F07-003

**Escenario:** Dado un límite reducido, entonces los anticipos ya pagados permanecen válidos.

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
