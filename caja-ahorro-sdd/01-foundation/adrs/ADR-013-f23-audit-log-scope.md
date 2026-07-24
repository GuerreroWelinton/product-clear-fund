# ADR-013 - F23: alcance de auditoría, inmutabilidad y costuras diferidas

## Estado
Aceptado.

## Contexto

F23 (auditoría transversal) declara como dependencia únicamente **F01**. Su `spec.md`,
`plan.md` y `acceptance.md` contienen requisitos que no pueden implementarse literalmente
con las features existentes hoy (F01, F02, F03), y otros que la plantilla compartida de
`plan.md` arrastra sin que apliquen al acto de registrar un evento de auditoría.

Además, tres ADR previos declararon explícitamente deuda diferida a F23:

- **ADR-008 (F01):** "El `AuditEvent` inmutable y completo se implementa en F23, que lo
  cableará de forma retroactiva a las escrituras sensibles de F01 (incluido deshabilitar
  usuarios)."
- **ADR-010 (F02):** "F20 y F23 los cablearán de forma retroactiva si corresponde."
- **ADR-012 (F03):** "Queda pendiente para F23 conectar la auditoría formal a las acciones
  de F03."

F23 es, por tanto, la feature que paga esa deuda.

## Decisión

### 1. Modelo `AuditEvent` inmutable, con inmutabilidad garantizada en base de datos

`BR-F23-003` ("no permitir editar o eliminar auditoría") no puede cumplirse solo en la capa de
aplicación: cualquier acceso directo al cliente Prisma la eludiría. Prisma no expresa esta
restricción y `plan.md` autoriza SQL adicional en la migración, así que se añade un **trigger
`BEFORE UPDATE OR DELETE ON audit_event` que lanza excepción**. El módulo tampoco expone casos
de uso de actualización o borrado.

No se usa `REVOKE UPDATE, DELETE` porque en Postgres los privilegios de tabla **no aplican al
owner**, y en el despliegue actual (Neon) el usuario de la aplicación es el owner del esquema:
un `REVOKE` daría una falsa sensación de inmutabilidad. El trigger rige incluso para el owner.

El trigger no cubre `TRUNCATE`, que no dispara triggers `FOR EACH ROW`. Se deja abierto a
propósito: los fixtures de integración lo necesitan (`resetDb()`), y quien puede truncar también
puede hacer `DROP TRIGGER`, así que un guard no aportaría defensa real y sí rompería las pruebas.

### 2. `cashFundId` nullable: eventos globales

El caso límite "evento sin caja" de `spec.md` se resuelve con `cashFundId` opcional. Los
eventos de F01 (crear usuario, deshabilitar usuario, revocar sesiones) son globales y no
pertenecen a ninguna caja. La autorización trata explícitamente ese caso: solo un
`SUPER_ADMIN` ve eventos globales.

### 3. "Auditor" es una capacidad de lectura, no un rol nuevo

`FR-F23-003` menciona un "auditor". `SECURITY.md` y `lib/auth/index.ts` definen solo
`SUPER_ADMIN`, `TREASURER` y `MEMBER` (reservado para F25). Crear un rol `AUDITOR` invadiría
el modelo de roles que pertenece a F01.

La capacidad que exige `FR-F23-003` (comparar valores anteriores y nuevos) se satisface con
el detalle del evento, accesible a `SUPER_ADMIN` de forma global y a `TREASURER` dentro de
sus cajas asignadas. No se añade ningún rol.

### 4. Sin impacto financiero: `CashMovement`, `Decimal` e idempotency key son N/A

`plan.md` es una plantilla compartida y menciona estos conceptos "cuando exista impacto
financiero". Registrar un evento de auditoría no mueve dinero, no tiene montos y no es una
operación reintentable de negocio. Consistente con ADR-010 y ADR-012.

Las transacciones sí aplican, pero por otro motivo y con un alcance desigual: ver el punto 6.

### 5. Autorización derivada de F03, sin duplicar la regla

La visibilidad por caja no se reimplementa. `listAuditEvents` reutiliza
`listAssignedCashFunds()` de `src/modules/treasurer-assignments/application`, que ya es la
única fuente de verdad de "qué cajas puede ver el llamante" (`FR-F03-002`, `BR-F03-005`).
Un `TREASURER` que consulta una caja no asignada recibe `F23_FORBIDDEN_CASH_FUND`.

### 6. Cableado retroactivo de la deuda declarada

F23 conecta la auditoría a las escrituras sensibles de F01, F02 y F03. El inventario de qué
caso de uso emite qué evento vive en el código (`audit/domain/event-types.ts`) y en `tasks.md`;
aquí solo la decisión.

La atomicidad alcanzable **no es uniforme**, y es una restricción del stack, no una preferencia:

- **F02 y F03 — atómico.** Escriben con `prisma` directamente, así que el evento se persiste en
  la misma transacción interactiva que el cambio auditado: un cambio confirmado sin su evento es
  imposible. Resuelve el caso límite "operación fallida no confirmada" de `spec.md`.
- **F01 — no atómico.** Sus casos de uso delegan en `auth.api.*`; Better Auth gestiona su propio
  acceso a la base vía `prismaAdapter` y **no acepta una transacción externa**. Lograr atomicidad
  exigiría reimplementar sus escrituras, invadiendo F01 y duplicando hashing y sesiones. El
  evento se registra inmediatamente después de la llamada, y **si ese registro falla el error se
  propaga**: fallo ruidoso antes que hueco silencioso, porque un evento perdido sin aviso es peor
  que una operación que el operador ve fallar y puede reconciliar. La ventana de inconsistencia
  (cambio aplicado, evento ausente, error mostrado) queda como limitación conocida de F01.

Dos precisiones de alcance:

- `USER_ENABLED`, `USER_SESSIONS_REVOKED` y `CASH_FUND_DRAFT_UPDATED` no figuran en
  `EVENT_CATALOG.md` (declarado "sugerido") y se añaden porque son escrituras sensibles reales.
- Las operaciones idempotentes de F03 que resuelven en `NOOP` (ADR-012) **no registran evento**:
  no hubo cambio que describir, y auditarlo contradiría `BR-F23-002` e inflaría la bitácora.

### 7. Redacción de datos sensibles

`BR-F23-004` prohíbe guardar secretos. La construcción del diff aplica una **lista de
denegación por nombre de campo** (`password`, `newPassword`, `token`, `secret`, `hash`,
`apiKey`, y cualquier clave que contenga esas subcadenas, sin distinguir mayúsculas). El
valor se sustituye por `"[REDACTED]"` en lugar de omitirse, para que la bitácora muestre
*que* el campo cambió sin exponer su contenido. La regla es una función pura y está
cubierta por pruebas unitarias.

En la práctica esto aplica a `createTreasurer`, cuyo input incluye la contraseña inicial
(ADR-009).

### 8. Escenarios de aceptación diferidos

| Escenario | Estado en F23 | Motivo |
|---|---|---|
| AC-F23-001 (cambio de cédula) | **Adaptado** | `Person` y la cédula pertenecen a **F04** (Fase 1), y F23 declara dependencia solo de F01. El *mecanismo* exigido (valor anterior, valor nuevo, motivo, actor) se implementa y se prueba en integración con `USER_DISABLED` (que sí tiene motivo real: `banReason`) y `CASH_FUND_CONFIG_CHANGED` (diff antes/después). El wiring literal de `PERSON_DOCUMENT_CHANGED` queda como costura para F04. |
| AC-F23-002 (enlace reversa ↔ original) | **Diferido a F09** | Las reversas parciales son **F09** y `CashMovement` es **F20**; hoy no existe operación financiera que enlazar. F23 construye la costura de enlace (`correlationId`, `relatedEventId`) y prueba la regla pura de enlace con test unitario. El escenario de integración lo implementa F09. |
| AC-F23-003 (tesorero solo ve sus cajas) | **Implementado** | Se prueba completo en integración en F23. |

`BR-F23-005` ("los eventos financieros deben enlazar la operación original") queda satisfecho
estructuralmente por la costura: `relatedEventId` apunta al evento original y `correlationId`
agrupa todos los eventos de una misma operación de negocio. Ninguna operación financiera
existe todavía para poblarlos.

### 9. Códigos de error propios `F23_`

F23 expone su propio catálogo estable prefijado `F23_`, sin reutilizar códigos `F01_`/`F02_`/
`F03_`. El cableado retroactivo **no cambia los códigos de error de las features
auditadas**: un fallo al registrar auditoría aborta la transacción y se propaga como el
código de error de la feature anfitriona (`F01_*`, `F02_*`, `F03_*`), porque desde la
perspectiva del usuario la operación que falló es la suya.

### 10. Sin claves foráneas en `audit_event`

La tabla no declara relaciones Prisma hacia `user` ni `cash_fund`. `actorId`, `cashFundId` y
`relatedEventId` se guardan como identificadores planos, acompañados de un **snapshot**
legible (`actorEmail`, `actorRole`) tomado en el momento del evento.

El motivo es que una FK con `onDelete: Cascade` borraría eventos al borrar un usuario o una
caja —destruyendo la bitácora—, y una con `onDelete: SetNull` intentaría un `UPDATE` sobre
`audit_event` que el trigger de inmutabilidad rechazaría, haciendo fallar el borrado del
padre. Un log append-only guarda hechos históricos, no referencias vivas: el snapshot es lo
correcto y además preserva el actor tal como era cuando actuó, aunque después cambie de
nombre o de rol.

### 11. `action` y `entityType` como `String`, no como enum de Postgres

El tipo de evento se guarda como `String` en la base de datos, con una **unión de literales
TypeScript** (`AuditEventType`) como contrato en el código.

`TECHNICAL_CONVENTIONS.md` pide enums explícitos para **estados**; el tipo de evento no es un
estado con máquina de transiciones. Un enum de Postgres obligaría a una migración por cada
feature futura (F04–F24 aportan cada una sus tipos), sin ganar nada: la validación real está en
el borde del módulo. Existe precedente en el propio esquema: `CashFundUser.status` es
`String` (F02).

### 12. Sin feature flag

`plan.md` sugiere activación por feature flag "si el riesgo lo justifica". No se usa: la
auditoría debe estar activa siempre para cumplir `BR-F23-001`, y un flag que la desactive
crearía huecos silenciosos en la bitácora — exactamente el riesgo que la feature existe para
eliminar.

## Consecuencias

- F23 permanece fiel a su spec y a su única dependencia declarada (F01), y paga la deuda que
  ADR-008, ADR-010 y ADR-012 le asignaron.
- La bitácora es inmutable a nivel de base de datos, no solo por convención de código.
- `AC-F23-003` se prueba completo en F23; `AC-F23-001` se prueba adaptado; `AC-F23-002` queda
  pendiente de F09 y se documenta en `tasks.md` y en la matriz de pruebas.
- F04 hereda la obligación de cablear `PERSON_DOCUMENT_CHANGED`; F09/F20 heredan la de poblar
  `relatedEventId`/`correlationId` en reversas y movimientos.
- Las costuras (`correlationId`, `relatedEventId`, redacción) son campos y funciones puras
  testeadas, sin ramas muertas ocultas.
