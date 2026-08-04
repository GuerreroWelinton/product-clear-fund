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
- Fechas recomendada y máxima se guardan como snapshot en la obligación (ADR-006).
- Si caen sábado o domingo, se desplazan al lunes siguiente.
- No se incluyen feriados en el MVP.

### La zona de negocio se lee de un solo lugar

`clear-fund/src/lib/dates` es la única fuente de la zona y de los bordes de día. No escribir `"America/Guayaquil"` a mano ni armar un borde con `new Date("...T00:00:00.000Z")`.

| Símbolo | Para qué |
|---|---|
| `BUSINESS_TIME_ZONE` | Zona de todo formateo de instantes. |
| `businessDayStart(isoDate)` | Primer instante de esa fecha calendario en la zona. |
| `businessDayEndExclusive(isoDate)` | Primer instante del día siguiente: borde superior exclusivo. |

Consumidores actuales:

- Formateo: `app/(admin)/audit/page.tsx`, `app/(admin)/cash-funds/[id]/ledger/page.tsx`, `modules/audit/ui/audit-event-detail-dialog.tsx` y `modules/audit/domain/event-types.ts`.
- Filtros de rango: `modules/ledger/application/list-cash-movements.ts`, hoy el único filtro por fechas del código.

Un filtro por fecha calendario es una **regla de negocio**, no persistencia: sus bordes se resuelven en la zona de negocio, la misma en que se renderiza. Armarlos en UTC deja los movimientos de la noche del último día del mes fuera del mes al que pertenecen — el defecto que corrigió ADR-014 §5.

El offset se obtiene con `Intl` en el instante ya resuelto, no fijado en `-05:00`. Un literal funciona solo mientras Ecuador no aplique horario de verano, y eso es un hecho externo del que el código no debe depender.

Excepción: un valor `@db.Date` no lleva zona y se formatea en `UTC` (`auditDateOnlyFormatter`). Desplazarlo movería el día calendario.

## Identificadores

- UUID para claves internas.
- Número de socio entero consecutivo por caja.
- Cédula única global.
- Idempotency key para jobs y operaciones sensibles cuando aplique.

## Estados

Usar enums explícitos. No inferir estados financieros únicamente desde fechas.

## Borrado

No usar hard delete en entidades financieras, membresías utilizadas, plantillas activadas ni auditoría.
