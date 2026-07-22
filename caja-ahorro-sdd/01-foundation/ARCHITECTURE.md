# Arquitectura

## Estilo

Monolito modular desplegado como una sola aplicación Next.js. Cada dominio debe mantener sus reglas dentro de su módulo y no depender directamente de detalles internos de otro módulo.

## Stack


- Next.js 16 con App Router.
- Node.js 24 LTS.
- TypeScript en modo estricto.
- PostgreSQL en Neon.
- Prisma ORM.
- Better Auth con correo y contraseña; registro público deshabilitado.
- Tailwind CSS 4, Shadcn/ui y tokens inspirados en Material Design 3.
- Recharts para visualizaciones.
- Cloudflare R2 para archivos opcionales.
- Railway Hobby para despliegue.
- Vitest para pruebas unitarias/integración y Playwright para pruebas E2E.
- pnpm como único gestor de paquetes.


## Estructura sugerida

```text
src/
  app/
    (auth)/
    (admin)/
    api/
  modules/
    auth/
    cash-funds/
    people/
    memberships/
    savings/
    payments/
    loans/
    expenses/
    distributions/
    withdrawals/
    ledger/
    reports/
    audit/
  lib/
    auth/
    db/
    money/
    dates/
    permissions/
    observability/
  components/
  styles/
prisma/
  schema.prisma
  migrations/
tests/
  integration/
  e2e/
```

Cada módulo puede contener:

```text
domain/          Reglas puras y tipos del negocio
application/     Casos de uso y orquestación
infrastructure/  Prisma, repositorios y adaptadores
schemas/         Validaciones de entrada y salida
ui/              Componentes específicos
```

## Fronteras obligatorias

- La UI no contiene cálculos financieros.
- Los route handlers o server actions no implementan reglas; llaman casos de uso.
- Prisma no debe filtrarse directamente hacia componentes.
- Los cálculos monetarios viven en funciones puras y testeadas.
- Toda operación financiera confirma dominio, ledger y auditoría en una misma transacción.
