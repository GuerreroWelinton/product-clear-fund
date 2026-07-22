# Convenciones de API y acciones de servidor

## Formato de éxito

```json
{
  "data": {},
  "meta": {}
}
```

## Formato de error

```json
{
  "error": {
    "code": "SAVINGS_OLDER_OBLIGATION_PENDING",
    "message": "Existen cuotas anteriores pendientes.",
    "fieldErrors": {}
  }
}
```

## Reglas

- Validar entrada con esquemas compartidos.
- Verificar sesión y permisos en servidor.
- Incluir `cashFundId` de forma explícita y comprobar asignación.
- No confiar en roles enviados por el cliente.
- Usar códigos de error estables.
- Las acciones financieras deben aceptar una clave de idempotencia cuando puedan repetirse por red.
- Responder montos como strings decimales.
- No exponer detalles internos de Prisma.

## Operaciones sugeridas

Preferir casos de uso invocados mediante server actions para formularios administrativos y route handlers para exportaciones, jobs o integraciones.
