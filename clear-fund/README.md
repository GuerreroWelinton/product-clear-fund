# Clear Fund — aplicación

Aplicación Next.js del sistema de cajas de ahorro. El contexto del proyecto, el estado por feature, las decisiones de arquitectura y las reglas del dominio financiero están en el [README de la raíz](../README.md).

## Requisitos

Node.js 24 y pnpm 11, fijados con Volta en `package.json`.

## Puesta en marcha

```bash
pnpm install
# Configurar DATABASE_URL apuntando a un PostgreSQL propio
pnpm prisma migrate dev
pnpm seed
pnpm dev
```

La aplicación queda en `http://localhost:3000`. El registro público está deshabilitado: los usuarios se crean desde el seed o desde la administración.

## Scripts

| Comando | Qué hace |
|---|---|
| `pnpm dev` | Servidor de desarrollo |
| `pnpm build` | Build de producción |
| `pnpm test` | Pruebas unitarias con Vitest |
| `pnpm test:watch` | Unitarias en modo watch |
| `pnpm test:integration` | Integración contra un PostgreSQL real |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm lint` | ESLint |
| `pnpm seed` | Carga de datos inicial |

`pnpm test:integration` verifica primero que la URL no apunte a la base de desarrollo y se niega a correr si lo hace. Necesita su propia base configurada en `.env.test`.

## Organización del código

```
src/app/          Rutas del App Router: (auth), (admin) y api
src/modules/      Módulos de dominio, una carpeta por área de negocio
src/lib/          money, dates, db, auth, permissions, observability
src/components/   Componentes compartidos y primitivas de shadcn/ui
prisma/           Esquema, migraciones y seed
```

Cada módulo se organiza en `domain`, `application`, `infrastructure`, `schemas` y `ui`, con fronteras que no se cruzan. Las reglas están en [`src/modules/README.md`](src/modules/README.md).
