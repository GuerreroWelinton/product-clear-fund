# ADR-009 - Contraseña provista al crear tesorero

## Estado
Aceptado.

## Contexto
El caso de uso `createTreasurer` (F01) necesita una contraseña inicial para la cuenta. El `plan.md` no especifica si debe autogenerarse o ser provista por el Super Admin.

## Decisión
`createTreasurer` recibe la contraseña como entrada validada (mínimo 8 caracteres), ingresada por el Super Admin en el formulario. El seed del primer Super Admin (BR-F01-002) sí autogenera y muestra una contraseña una sola vez, por no existir aún un administrador.

## Consecuencias
- El flujo de creación desde la UI es explícito y directo.
- Queda pendiente, cuando se implemente el envío de correo, evaluar un flujo de invitación o restablecimiento en primer inicio de sesión.
