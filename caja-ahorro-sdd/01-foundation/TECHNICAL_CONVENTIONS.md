# Convenciones técnicas

## Dinero

- PostgreSQL `numeric(18,2)`.
- Prisma `Decimal`.
- Entradas y respuestas monetarias como string decimal o minor units documentadas.
- Nunca usar `number` para sumar, dividir o comparar dinero.
- Redondeo financiero explícito a dos decimales.

## Fechas

- Timestamps almacenados en UTC.
- Zona de negocio: `America/Guayaquil`.
- Periodos mensuales con valor explícito `YYYY-MM`.
- Fechas recomendada y máxima se guardan como snapshot en la obligación.
- Si caen sábado o domingo, se desplazan al lunes siguiente.
- No se incluyen feriados en el MVP.

## Identificadores

- UUID para claves internas.
- Número de socio entero consecutivo por caja.
- Cédula única global.
- Idempotency key para jobs y operaciones sensibles cuando aplique.

## Estados

Usar enums explícitos. No inferir estados financieros únicamente desde fechas.

## Borrado

No usar hard delete en entidades financieras, membresías utilizadas, plantillas activadas ni auditoría.
