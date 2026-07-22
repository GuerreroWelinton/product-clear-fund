# Estrategia de pruebas

## Pirámide

1. Pruebas unitarias de reglas y cálculos.
2. Pruebas de integración con PostgreSQL para restricciones y transacciones.
3. Pruebas E2E de los flujos administrativos principales.
4. Pruebas manuales de conciliación y visuales.

## Casos obligatorios

- Concurrencia al asignar números consecutivos.
- Concurrencia al comprometer y desembolsar saldo.
- Idempotencia de generación mensual.
- Reversas parciales.
- Fechas de fin de semana.
- Pagos retroactivos y bloqueo de fechas futuras.
- Operaciones posteriores a cierres.
- Déficit y remanente.
- Liquidación anticipada.
- Retiro con resultado negativo.
- Migración y conciliación.

## Herramientas

- Vitest para dominio y aplicación.
- Base de datos aislada para integración.
- Playwright para E2E.
- Factories deterministas para cajas, personas, membresías y préstamos.
