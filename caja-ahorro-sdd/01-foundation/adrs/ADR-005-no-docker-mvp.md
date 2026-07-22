# ADR-005 - Docker no obligatorio en MVP

## Estado
Aceptado.

## Decisión
El desarrollo local usa Node.js y pnpm directamente. Railway construye la aplicación.

## Consecuencias
- Menos complejidad inicial.
- La configuración debe seguir siendo portable.
- Docker puede agregarse para VPS, CI avanzada o Testcontainers.
