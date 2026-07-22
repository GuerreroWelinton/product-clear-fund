# Arranque del repositorio

## Crear aplicación

```bash
pnpm create next-app@latest caja-ahorro --ts --eslint --tailwind --app --src-dir --import-alias "@/*"
cd caja-ahorro
pnpm add prisma @prisma/client better-auth zod decimal.js
pnpm add -D vitest @vitest/coverage-v8 playwright
pnpm exec prisma init
```

Fijar en `package.json`:

```json
{
  "packageManager": "pnpm@11"
}
```

## Primeros entregables

1. Configuración de TypeScript estricto.
2. Conexión a Neon.
3. Better Auth.
4. Layout administrativo.
5. Módulos vacíos con fronteras.
6. CI con lint, typecheck, tests y build.
7. Seed de Super Admin.
