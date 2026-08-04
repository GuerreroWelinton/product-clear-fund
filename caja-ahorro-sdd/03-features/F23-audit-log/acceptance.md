# Criterios de aceptación - F23 Auditoría transversal

## Escenarios obligatorios

### AC-F23-001

**Escenario:** Dado un cambio de cédula, entonces la auditoría conserva valor anterior, nuevo, motivo y actor.

- Tipo sugerido: integración y E2E.
- Debe verificar datos persistidos, movimientos y auditoría cuando aplique.
- Requisitos que verifica: `FR-F23-003`, `BR-F23-002`. **Adaptado** (ADR-013 §8): la cédula pertenece a F04, así que el mecanismo exigido —valor anterior, nuevo, motivo y actor— se prueba con `USER_DISABLED` (motivo real: `banReason`) y `CASH_FUND_CONFIG_CHANGED`. F04 hereda cablear `PERSON_DOCUMENT_CHANGED`.

### AC-F23-002

**Escenario:** Dada una reversa, entonces la auditoría enlaza original y reversa.

- Tipo sugerido: integración.
- Debe verificar datos persistidos, movimientos y auditoría cuando aplique.
- Requisitos que verifica: `BR-F23-005`. Diferido a F09 (ADR-013): no existe reversa que enlazar.

### AC-F23-003

**Escenario:** Dado un tesorero, entonces solo consulta eventos de sus cajas.

- Tipo sugerido: integración.
- Debe verificar datos persistidos, movimientos y auditoría cuando aplique.
- Requisitos que verifica: `FR-F23-002`. La regla de visibilidad no se reimplementa: deriva de `FR-F03-002` y `BR-F03-005` vía `listAssignedCashFunds()` (ADR-013 §5).

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
