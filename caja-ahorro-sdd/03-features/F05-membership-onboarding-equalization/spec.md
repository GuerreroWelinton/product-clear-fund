# F05 - Alta de números e igualación

## Estado

Propuesta para revisión.

## Fase

Fase 1

## Dependencias

F04, F20, F23.

## Propósito

Incorporar números nuevos mediante pago completo de igualación y asignar el consecutivo solo al confirmar.

## Historias y requisitos funcionales

- **FR-F05-001:** Como tesorero quiero calcular la igualación teórica de un nuevo número.
- **FR-F05-002:** Como tesorero quiero activar la membresía solo al recibir el pago completo.
- **FR-F05-003:** Como sistema quiero asignar números consecutivos sin colisiones.

## Reglas de negocio

- **BR-F05-001:** Una persona puede tener varios números en una caja.
- **BR-F05-002:** El número es consecutivo por caja y nunca se reutiliza.
- **BR-F05-003:** La igualación usa meses completos hasta el mes anterior por la cuota fija.
- **BR-F05-004:** El mes inicial de la caja cuenta solo si inició el día 1.
- **BR-F05-005:** Los atrasos de otros números no reducen la igualación.
- **BR-F05-006:** La igualación se registra como una sola operación, no como cuotas históricas.
- **BR-F05-007:** No se permiten pagos parciales.
- **BR-F05-008:** El número se asigna al confirmar pago y activación dentro de una transacción.
- **BR-F05-009:** Si se activa antes de la generación mensual, paga ese mes; si es después, inicia el siguiente.
- **BR-F05-010:** Un número creado durante una ronda activa entra en la siguiente ronda.

## Entidades relacionadas

MembershipOnboarding, Membership, CashMovement

## Fuera de alcance

- Funcionalidades no mencionadas expresamente en esta especificación.
- Automatizaciones o integraciones externas no incluidas en el MVP.
- Edición destructiva de registros financieros.

## Casos límite

- Dos altas simultáneas.
- Caja sin meses completos.
- Pago incompleto.
- Caja inactiva.

## Criterio de salida

La feature se considera especificada cuando el responsable funcional confirma que todos los requisitos y reglas representan la operación real.
