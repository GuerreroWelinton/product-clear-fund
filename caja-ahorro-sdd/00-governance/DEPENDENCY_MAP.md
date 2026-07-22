# Mapa de dependencias

```text
F01 Auth
 ├─ F02 Cajas
 │   ├─ F03 Tesoreros
 │   ├─ F04 Personas
 │   │   └─ F05 Números e igualación
 │   │       ├─ F06 Cuotas mensuales
 │   │       │   ├─ F07 Adelantos
 │   │       │   ├─ F08 Pagos
 │   │       │   │   └─ F09 Reversas
 │   │       │   └─ F10 Riesgo
 │   │       └─ F12 Rondas
 │   │           └─ F13 Asignación préstamo
 │   │               └─ F14 Desembolso
 │   │                   └─ F15 Cronograma y pagos
 │   │                       └─ F16 Liquidación anticipada
 │   ├─ F17 Gastos
 │   ├─ F18 Cierres y rendimientos
 │   ├─ F19 Retiros
 │   ├─ F20 Libro de caja
 │   ├─ F21 Reportes
 │   ├─ F22 Migración
 │   └─ F24 Jobs
 └─ F23 Auditoría

F25 Portal de socio depende de F04, F05, F06, F08, F15, F18, F19 y F21.
```

## Dependencias transversales

- F20 Libro de caja debe integrarse en toda operación financiera.
- F23 Auditoría debe integrarse en toda escritura sensible.
- F24 Jobs depende de F02, F06, F10 y F18.
