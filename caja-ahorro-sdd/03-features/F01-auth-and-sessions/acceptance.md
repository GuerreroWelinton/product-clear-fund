# Criterios de aceptación - F01 Autenticación y sesiones

## Escenarios obligatorios

### AC-F01-001

**Escenario:** Dado un usuario activo con credenciales válidas, cuando inicia sesión, entonces obtiene una sesión persistente.

- Tipo sugerido: integración y E2E.
- Debe verificar datos persistidos, movimientos y auditoría cuando aplique.
### AC-F01-002

**Escenario:** Dado un usuario deshabilitado, cuando intenta iniciar sesión, entonces el acceso es rechazado.

- Tipo sugerido: integración.
- Debe verificar datos persistidos, movimientos y auditoría cuando aplique.
### AC-F01-003

**Escenario:** Dado un tesorero con sesiones activas, cuando el Super Admin lo deshabilita, entonces todas sus sesiones quedan revocadas.

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
