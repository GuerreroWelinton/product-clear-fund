# Despliegue

## Ambientes

- Local.
- Preview por pull request.
- Staging con datos anonimizados.
- Producción.

## Servicios

- Railway: aplicación.
- Neon: PostgreSQL.
- Cloudflare R2: archivos opcionales.
- Proveedor SMTP compatible con Better Auth cuando se implemente recuperación.

## Pipeline mínimo

1. `pnpm install --frozen-lockfile`
2. lint
3. typecheck
4. unit tests
5. integration tests
6. build
7. aplicar migraciones aprobadas
8. smoke test

## Docker

No es obligatorio para el MVP. La aplicación debe mantenerse portable para incorporarlo después sin rediseñar los módulos.
