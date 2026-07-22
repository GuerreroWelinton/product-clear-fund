# F04 - Registro único de personas

## Estado

Propuesta para revisión.

## Fase

Fase 1

## Dependencias

F02, F03, F23.

## Propósito

Mantener una identidad global única por cédula reutilizable en varias cajas.

## Historias y requisitos funcionales

- **FR-F04-001:** Como tesorero quiero buscar una persona por cédula antes de crearla.
- **FR-F04-002:** Como tesorero quiero corregir una cédula mal digitada con motivo.
- **FR-F04-003:** Como sistema quiero evitar duplicados de identidad.

## Reglas de negocio

- **BR-F04-001:** Cédula única global.
- **BR-F04-002:** Nombres, apellidos, cédula y teléfono obligatorios.
- **BR-F04-003:** Correo y dirección opcionales.
- **BR-F04-004:** Una persona puede pertenecer a varias cajas.
- **BR-F04-005:** La cédula puede corregirse con motivo y auditoría.
- **BR-F04-006:** Si la nueva cédula ya pertenece a otra persona, se bloquea; no existe fusión automática.

## Entidades relacionadas

Person

## Fuera de alcance

- Funcionalidades no mencionadas expresamente en esta especificación.
- Automatizaciones o integraciones externas no incluidas en el MVP.
- Edición destructiva de registros financieros.

## Casos límite

- Cédula duplicada.
- Nueva cédula ocupada.
- Persona existente encontrada desde otra caja.

## Criterio de salida

La feature se considera especificada cuando el responsable funcional confirma que todos los requisitos y reglas representan la operación real.
