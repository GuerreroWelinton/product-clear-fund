# F06 - Generación mensual de cuotas de ahorro

## Estado

Propuesta para revisión.

## Fase

Fase 1

## Dependencias

F02, F05, F24.

## Propósito

Crear al inicio de cada mes una obligación de ahorro para cada número activo.

## Historias y requisitos funcionales

- **FR-F06-001:** Como tesorero quiero ver las cuotas del mes desde el inicio.
- **FR-F06-002:** Como sistema quiero generar cuotas sin duplicarlas.
- **FR-F06-003:** Como tesorero quiero recuperar cuotas omitidas tras reactivar una caja.

## Reglas de negocio

- **BR-F06-001:** Se genera una cuota por número activo y periodo.
- **BR-F06-002:** El monto es la cuota fija de la caja.
- **BR-F06-003:** Las fechas recomendada y máxima se calculan y guardan como snapshot.
- **BR-F06-004:** Si caen fin de semana se mueven al lunes.
- **BR-F06-005:** Una caja inactiva no ejecuta generación ordinaria.
- **BR-F06-006:** Al reactivar se recuperan periodos faltantes.
- **BR-F06-007:** El proceso es idempotente.

## Entidades relacionadas

SavingsObligation

## Fuera de alcance

- Funcionalidades no mencionadas expresamente en esta especificación.
- Automatizaciones o integraciones externas no incluidas en el MVP.
- Edición destructiva de registros financieros.

## Casos límite

- Ejecución repetida.
- Día 31 en un mes corto.
- Reactivación con configuración cambiada.

## Criterio de salida

La feature se considera especificada cuando el responsable funcional confirma que todos los requisitos y reglas representan la operación real.
