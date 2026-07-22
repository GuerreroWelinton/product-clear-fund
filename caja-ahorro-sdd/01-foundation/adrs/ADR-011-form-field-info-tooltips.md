# ADR-011 - Tooltips de ayuda en labels de formularios

## Estado
Aceptado.

## Contexto
Varios campos de los formularios son específicos del dominio de cajas de ahorro y
no se entienden a la primera (cuota mensual inmutable, fecha oficial de inicio y su
efecto en la igualación, día recomendado vs. máximo, meses de adelanto, umbral de
riesgo). Se necesita explicar brevemente para qué sirve cada campo sin recargar la
interfaz.

## Decisión
Se adopta como **convención transversal de UI**: todo label de formulario que no sea
autoexplicativo lleva un ícono de información (`InfoIcon`) a su lado que, al **hacer
clic/tap**, muestra una frase explicando para qué se usa el campo.

Se usa **clic/tap (Popover), no hover (Tooltip)**: los formularios se usan también en
móvil, donde el hover no existe; abrir por clic funciona en escritorio y en pantallas
táctiles por igual.

Implementación:
- Primitivo `src/components/ui/popover.tsx` sobre `@base-ui/react/popover`, siguiendo el
  estilo shadcn/MD3 existente (mismo patrón que `dialog.tsx`). Su `Positioner` usa un
  z-index por encima del modal (`z-[100]`) porque se abre desde dentro de un `Dialog`.
- Componente reutilizable `src/components/ui/field-label.tsx` (`FieldLabel`) que compone
  `Label` + disparador de ayuda (`type="button"`, accesible por teclado, `aria-label`).
- El disparador nunca envía el formulario; el contenido se cierra al hacer clic fuera o
  con `Escape` (comportamiento por defecto del Popover).

Primera aplicación: los tres formularios de F02 (crear, editar borrador, config
operativa). Los nuevos formularios deben reutilizar `FieldLabel` para campos no obvios.

## Consecuencias
- Mejor comprensión sin manuales externos; refuerza la tarea de accesibilidad de F02.
- Copia de ayuda centralizada por campo (una sola frase, en español).
- Coste: un primitivo y un componente compartidos; dependencia de `@base-ui/react/tooltip`
  (ya presente).
- No sustituye validación ni mensajes de error; es solo orientación de uso.
