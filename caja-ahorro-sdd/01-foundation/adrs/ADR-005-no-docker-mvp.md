# ADR-005 - Docker no obligatorio en MVP

## Estado
Aceptado.

## Contexto
Evitar complejidad innecesaria. Con un solo desarrollador, Node.js y pnpm alcanzan para levantar el entorno local, y mantener además un entorno containerizado no aportaría nada en esta etapa.

## Decisión
El desarrollo local usa Node.js y pnpm directamente. Railway construye la aplicación.

## Consecuencias
- Menos complejidad inicial.
- La configuración debe seguir siendo portable.
- Docker puede agregarse para VPS, CI avanzada o Testcontainers. **Ya ocurrió en CI**: el job `verify` levanta un service container `postgres:18` para las pruebas de integración. La decisión sigue vigente solo para el entorno local.
