# ADR-007 - Nombre del módulo de autenticación

## Estado
Aceptado.

## Contexto
El `plan.md` de F01 propone implementar la feature en `src/modules/auth-and-sessions`, pero `01-foundation/ARCHITECTURE.md` define la lista canónica de módulos usando `auth`.

## Decisión
El módulo vive en `src/modules/auth`. `auth-and-sessions` se conserva como nombre de la feature (F01), no de la carpeta.

## Consecuencias
- La estructura del código respeta la lista de módulos de ARCHITECTURE.md.
- Se evita divergencia entre el nombre de feature y el de módulo.
