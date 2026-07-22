# F02 - Ciclo de vida y configuración de cajas

## Estado

Propuesta para revisión.

## Fase

Fase 0

## Dependencias

F01.

## Propósito

Crear cajas independientes con configuración operativa, cuota fija y estados de activación.

## Historias y requisitos funcionales

- **FR-F02-001:** Como Super Admin quiero crear y activar cajas.
- **FR-F02-002:** Como tesorero asignado quiero modificar configuraciones operativas de una caja activa.
- **FR-F02-003:** Como Super Admin quiero desactivar temporalmente una caja sin perder datos.

## Reglas de negocio

- **BR-F02-001:** Cada caja opera en USD y tiene saldo, numeración, préstamos y cierres propios.
- **BR-F02-002:** La cuota mensual es editable solo antes de activar o registrar el primer número; después es inmutable.
- **BR-F02-003:** Para usar otra cuota mensual se crea otra caja.
- **BR-F02-004:** La fecha oficial de inicio queda bloqueada al existir el primer número.
- **BR-F02-005:** Días recomendado y máximo, máximo de anticipos y umbral de riesgo pueden modificarse en una caja activa.
- **BR-F02-006:** Una caja inactiva permite solo lectura y no admite cambios.
- **BR-F02-007:** Al reactivar se generan las cuotas faltantes de los meses inactivos.
- **BR-F02-008:** Si la caja inicia a mitad de mes, ese mes no cuenta para igualación.

## Entidades relacionadas

CashFund

## Fuera de alcance

- Funcionalidades no mencionadas expresamente en esta especificación.
- Automatizaciones o integraciones externas no incluidas en el MVP.
- Edición destructiva de registros financieros.

## Casos límite

- Día recomendado mayor al máximo.
- Intento de cambiar cuota fija después de activación.
- Reactivación tras varios meses.

## Criterio de salida

La feature se considera especificada cuando el responsable funcional confirma que todos los requisitos y reglas representan la operación real.
