# Guía de ejecución de migración

## Archivos controlados

- `cash-funds.csv`
- `people.csv`
- `memberships.csv`
- `membership-balances.csv`
- `active-loans.csv`
- `overdue-loan-installments.csv`
- `future-loan-installments.csv`
- `opening-cash-balance.csv`

## Flujo

1. Exportar y congelar datos origen.
2. Validar encabezados, tipos y duplicados.
3. Ejecutar dry run.
4. Generar reporte de errores.
5. Corregir origen, no la base destino.
6. Ejecutar carga de prueba completa.
7. Conciliar por caja.
8. Vaciar ambiente de prueba y repetir.
9. Realizar corte final.
10. Habilitar operaciones solo con conciliación aprobada.

## Conciliación mínima

- Cantidad de personas.
- Cantidad de números activos y retirados.
- Ahorro total por caja.
- Capital pendiente.
- Cuotas vencidas.
- Saldo inicial de caja.
