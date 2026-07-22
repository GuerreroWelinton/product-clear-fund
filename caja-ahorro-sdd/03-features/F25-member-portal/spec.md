# F25 - Portal futuro del socio

## Estado

Propuesta para revisión.

## Fase

Fase futura

## Dependencias

F04, F05, F06, F08, F15, F18, F19, F21.

## Propósito

Permitir al socio consultar en modo de solo lectura su información.

## Historias y requisitos funcionales

- **FR-F25-001:** Como socio quiero ver mis números y saldos.
- **FR-F25-002:** Como socio quiero consultar cuotas y préstamos.
- **FR-F25-003:** Como socio quiero descargar mi estado de cuenta.

## Reglas de negocio

- **BR-F25-001:** Solo lectura.
- **BR-F25-002:** El usuario se vincula a una Person.
- **BR-F25-003:** Solo puede consultar cajas y números propios.
- **BR-F25-004:** No registra pagos ni cambia datos financieros.
- **BR-F25-005:** Las consultas reutilizan proyecciones de F21.
- **BR-F25-006:** Debe prepararse autorización por persona, caja y membresía.

## Entidades relacionadas

UserPersonLink

## Fuera de alcance

- Funcionalidades no mencionadas expresamente en esta especificación.
- Automatizaciones o integraciones externas no incluidas en el MVP.
- Edición destructiva de registros financieros.

## Casos límite

- Persona con varias cajas.
- Usuario desvinculado.
- Número retirado.

## Criterio de salida

La feature se considera especificada cuando el responsable funcional confirma que todos los requisitos y reglas representan la operación real.
