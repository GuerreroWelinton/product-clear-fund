# Módulos de dominio

Monolito modular: cada módulo mantiene sus reglas dentro de sí mismo y **no depende de los detalles internos de otro módulo**. La comunicación entre módulos ocurre a través de sus casos de uso (capa `application`), nunca accediendo a su `infrastructure` o `domain` directamente.

## Capas de cada módulo

| Capa | Responsabilidad | Reglas |
|---|---|---|
| `domain/` | Reglas puras y tipos del negocio | Sin dependencias de Prisma, Next ni de otros módulos. Funciones puras y testeables. |
| `application/` | Casos de uso y orquestación | Coordina domain + infrastructure. Es la **única puerta de entrada** desde fuera del módulo. |
| `infrastructure/` | Prisma, repositorios y adaptadores | Único lugar donde vive el acceso a datos. No se filtra hacia la UI. |
| `schemas/` | Validaciones de entrada y salida (Zod) | Valida en el borde del módulo. |
| `ui/` | Componentes específicos del módulo | Presenta datos; no calcula ni accede a Prisma. |

## Fronteras obligatorias (de `01-foundation/ARCHITECTURE.md`)

1. La UI **no** contiene cálculos financieros.
2. Los route handlers y server actions **no** implementan reglas; llaman a casos de uso (`application`).
3. Prisma **no** se filtra directamente hacia los componentes.
4. Los cálculos monetarios viven en funciones puras y testeadas (ver `src/lib/money`).
5. Toda operación financiera confirma **dominio + ledger + auditoría en una misma transacción**.

## Módulos

`auth`, `cash-funds`, `people`, `memberships`, `savings`, `payments`, `loans`, `expenses`, `distributions`, `withdrawals`, `ledger`, `reports`, `audit`.

Cada carpeta arranca con `.gitkeep` en sus capas hasta que se implemente la feature correspondiente (ver `caja-ahorro-sdd/03-features/`).
