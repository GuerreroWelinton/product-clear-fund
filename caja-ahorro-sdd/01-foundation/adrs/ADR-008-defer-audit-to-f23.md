# ADR-008 - Auditoría de F01 diferida a F23

## Estado
Aceptado.

## Contexto
El `plan.md` y el `acceptance.md` de F01 mencionan auditoría ("conservar actor y fecha"). Sin embargo, el modelo y el módulo `AuditEvent` pertenecen a F23, aún no implementada, y la propia spec de F01 declara "Dependencias: Ninguna".

## Decisión
F01 no crea un modelo ni tabla de auditoría propios. Se apoya en el registro que Better Auth ya provee (`createdAt`/`updatedAt`, estado `banned`/`banReason`). El `AuditEvent` inmutable y completo se implementa en F23, que lo cableará de forma retroactiva a las escrituras sensibles de F01 (incluido deshabilitar usuarios).

## Consecuencias
- F01 permanece sin dependencias, fiel a su spec.
- No se invade el alcance ni el esquema que corresponden a F23.
- Queda pendiente para F23 conectar la auditoría formal a las acciones de F01.
