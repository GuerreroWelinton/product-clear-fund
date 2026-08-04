# ADR-006 - Snapshots para reglas históricas

## Estado
Aceptado.

## Contexto
Parte de la configuración de una caja se modifica mientras está activa: por `BR-F02-005`, los días recomendado y máximo, el máximo de anticipos y el umbral de riesgo son editables en operación. Si una obligación o un préstamo leyeran esos valores en vivo, un cambio de hoy recalcularía el pasado: mover el día máximo alteraría la mora de cuotas emitidas hace meses.

A eso se suma un compromiso con el socio: las condiciones pactadas al tomar un préstamo deben respetarse aunque la caja cambie sus reglas después.

## Decisión
Cada obligación y cada préstamo guardan los valores que tenían efecto en el momento de crearse. Todo cálculo sobre un registro histórico usa esa copia, nunca la configuración vigente de la caja.

## Consecuencias
- Un cambio de configuración afecta solo lo que se cree a partir de ese momento; nunca reescribe registros anteriores.
- Los cierres confirmados quedan congelados y son reproducibles: recalcularlos da el mismo resultado que el día en que se confirmaron.
- El socio conserva las condiciones que pactó, incluso si la caja endurece o relaja sus reglas más adelante.
- La información se duplica a propósito y **no es redundancia**: "el día máximo de la caja" y "el día máximo que se aplicó a esta cuota" son dos hechos distintos que solo coinciden en el instante de creación. Normalizarlos en una sola fuente los confunde y destruye el histórico. No reemplazar la copia por una lectura de la caja.
