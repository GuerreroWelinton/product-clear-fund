# Estrategia de pruebas

## Pirámide

1. Pruebas unitarias de reglas y cálculos.
2. Pruebas de integración con PostgreSQL para restricciones y transacciones.
3. Pruebas E2E de los flujos administrativos principales.
4. Pruebas manuales de conciliación y visuales.

## Casos obligatorios

- Concurrencia al asignar números consecutivos.
- Concurrencia al comprometer y desembolsar saldo.
- Idempotencia de generación mensual.
- Reversas parciales.
- Fechas de fin de semana.
- Pagos retroactivos y bloqueo de fechas futuras.
- Operaciones posteriores a cierres.
- Déficit y remanente.
- Liquidación anticipada.
- Retiro con resultado negativo.
- Migración y conciliación.

## Herramientas

- Vitest para dominio y aplicación.
- Base de datos aislada para integración.
- Playwright para E2E.
- Factories deterministas para cajas, personas, membresías y préstamos.

## Comandos

Se ejecutan desde `clear-fund/`.

| Comando | Alcance |
|---|---|
| `pnpm test` | Unitarias (vitest). Excluye `tests/integration/**`; no toca la base. |
| `pnpm test:watch` | Unitarias en modo watch. |
| `pnpm test:integration` | Integración contra base real; carga `.env.test` con dotenv-cli. |
| `pnpm test:integration:ci` | Integración leyendo `DATABASE_URL` del entorno, sin dotenv. |
| `pnpm test -- --coverage` | Cobertura (proveedor v8); reportes en `clear-fund/coverage`. |
| `pnpm lint` | ESLint (`eslint.config.mjs`). |
| `pnpm typecheck` | `tsc --noEmit`. |

Configuración en `vitest.config.ts` y `vitest.integration.config.ts`. La de
integración fija `fileParallelism: false` y `maxWorkers: 1`: las pruebas
comparten una sola base y truncan tablas entre corridas.

## CI

`.github/workflows/ci.yml`, job `verify`: install, `prisma generate`, lint,
typecheck, unitarias, `prisma migrate deploy`, integración (variante ci), build.

La base de integración en CI es un service container `postgres:18`, fijado al
major de Neon para que triggers y restricciones se comporten igual que en la
base real.

## Huecos conocidos

- **E2E sin cablear.** Playwright está instalado como devDependency, pero no hay
  `playwright.config.*`, ni script, ni pruebas: `tests/e2e/` solo tiene
  `.gitkeep`. Ningún criterio de aceptación puede apoyarse en E2E todavía.
- **Sin formateador.** Solo ESLint y `tsc --noEmit` controlan estilo y tipos.
