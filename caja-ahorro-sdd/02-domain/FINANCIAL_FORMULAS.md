# Fórmulas financieras

## Saldo

```text
saldo_contable = suma(entradas confirmadas) - suma(salidas confirmadas)
saldo_comprometido = suma(préstamos en desembolso en proceso)
saldo_libre = saldo_contable - saldo_comprometido
```

## Igualación

```text
igualacion = meses_completos_desde_inicio_hasta_mes_anterior * cuota_mensual_fija
```

Si la caja inició después del día 1, el mes inicial no cuenta.

## Reparto

```text
resultado = intereses_cobrados + ajustes_positivos
          - gastos_confirmados
          - ajustes_negativos
          - deficit_arrastrado
          + remanente_arrastrado
```

Si `resultado <= 0`, no hay reparto y el déficit se arrastra.

```text
valor_por_unidad = floor_centavos(resultado / unidades_participacion)
remanente = resultado - total_distribuido
```

## Liquidación anticipada

```text
total = capital_pendiente
      + intereses_vencidos_anteriores
      + interes_fijo_mes_actual
```

No se cobran intereses futuros ni se prorratea el mes actual.
