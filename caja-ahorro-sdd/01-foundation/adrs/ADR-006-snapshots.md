# ADR-006 - Snapshots para reglas históricas

## Estado
Aceptado.

## Decisión
Guardar en cada obligación o préstamo los valores efectivos al crearse.

## Consecuencias
- Cambios de días o configuraciones no alteran históricos.
- Los cierres confirmados permanecen congelados.
- Se duplica información intencionalmente para conservar trazabilidad.
