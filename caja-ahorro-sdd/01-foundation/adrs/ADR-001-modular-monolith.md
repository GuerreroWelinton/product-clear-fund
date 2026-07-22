# ADR-001 - Monolito modular

## Estado
Aceptado.

## Decisión
Implementar una sola aplicación Next.js con módulos de dominio internos.

## Motivo
El volumen previsto es menor a diez usuarios administrativos y aproximadamente doscientos socios. Un monolito modular reduce despliegues, latencia y operación, sin impedir separar dominios.

## Consecuencias
- Una unidad de despliegue.
- Una base de datos.
- Transacciones simples entre dominios.
- Se deben respetar fronteras internas para evitar un monolito acoplado.
