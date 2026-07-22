# Flujo Spec-Driven Development

## Estados de una feature

`PROPUESTA -> ESPECIFICADA -> PLANIFICADA -> EN_DESARROLLO -> EN_VALIDACION -> COMPLETADA`

## Artefactos por feature

Cada feature contiene:

- `spec.md`: alcance, historias, requisitos y reglas.
- `plan.md`: diseño técnico, modelo, contratos y seguridad.
- `tasks.md`: trabajo ejecutable en orden.
- `acceptance.md`: escenarios verificables y matriz de pruebas.

## Reglas del proceso

1. Los requisitos reciben identificadores estables `FR-FXX-NNN`.
2. Las reglas de negocio reciben identificadores `BR-FXX-NNN`.
3. Los criterios de aceptación reciben identificadores `AC-FXX-NNN`.
4. Las tareas deben indicar qué requisitos implementan.
5. Las pruebas deben indicar qué criterios verifican.
6. Un cambio funcional aprobado debe actualizar primero la especificación y después el código.
7. Una decisión técnica transversal debe registrarse como ADR.
8. No se acepta una feature con requisitos sin prueba o criterio de aceptación.
9. Las migraciones de base de datos deben ser revisables, reversibles cuando sea posible y probadas con datos representativos.
10. Las operaciones financieras deben incluir pruebas de concurrencia e idempotencia cuando corresponda.

## Revisión sugerida

- Revisión funcional: tesorero o responsable del negocio.
- Revisión técnica: desarrollador responsable.
- Revisión de datos: responsable de migración o base de datos.
- Validación final: criterios de aceptación automatizados y prueba manual dirigida.
