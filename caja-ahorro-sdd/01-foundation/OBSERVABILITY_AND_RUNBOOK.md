# Observabilidad y runbook

## Logs estructurados

Campos mínimos:

- timestamp
- requestId
- userId
- cashFundId
- action
- entityType
- entityId
- outcome
- durationMs
- errorCode

No incluir contraseñas, sesiones ni datos personales completos.

## Métricas útiles

- Jobs ejecutados, omitidos y fallidos.
- Cuotas generadas por mes.
- Pagos y reversas.
- Saldo contable y saldo comprometido.
- Desembolsos bloqueados por falta de fondos.
- Errores de autorización.
- Latencia de consultas de reportes.

## Alertas iniciales

- Job mensual fallido.
- Diferencia de conciliación detectada.
- Error durante una transacción financiera.
- Intentos repetidos de acceso no autorizado.
