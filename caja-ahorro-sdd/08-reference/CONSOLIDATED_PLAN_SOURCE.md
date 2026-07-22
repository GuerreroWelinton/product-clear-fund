Base para diseno, desarrollo, pruebas, migracion y puesta en produccion.

# Contenido y guia de lectura

Este documento consolida las decisiones finales tomadas para el sistema. Cuando una regla fue modificada durante el levantamiento, aqui se conserva unicamente su version definitiva.

# 1. Resumen ejecutivo

El proyecto implementara una plataforma web para administrar una o varias cajas de ahorro, con separacion estricta de datos, permisos y saldos por caja. El sistema cubrira la operacion de socios, numeros de socio, aportes mensuales, prestamos, rondas, gastos, retiros, distribucion de rendimientos, migracion de saldos y auditoria.

La primera version estara orientada al uso administrativo. Incluira los roles Super Admin y Tesorero. El acceso de Socio se deja preparado en el modelo de permisos, pero su portal de consulta se implementara en una fase posterior.

## 1.1 Objetivos

Centralizar la administracion financiera de cada caja y eliminar calculos dispersos.

Mantener un historial inmutable y auditable de cada entrada y salida de dinero.

Automatizar cuotas mensuales, estados de cuenta, semaforos, riesgo y cronogramas de prestamos.

Evitar sobreasignacion de fondos mediante control de saldo libre y montos comprometidos.

Permitir migrar la operacion actual sin reconstruir todo el historial anterior.

Preparar la base para un futuro portal de socios de solo lectura.

## 1.2 Alcance del MVP

## 1.3 Principios funcionales

Toda operacion financiera se registra como movimiento y nunca se elimina.

Las operaciones agrupadas se descomponen en asignaciones exactas a obligaciones.

Las reglas historicas se preservan mediante snapshots en cuotas y prestamos.

Las operaciones criticas se ejecutan dentro de transacciones de base de datos.

Los procesos automaticos son idempotentes: repetirlos no crea duplicados.

Los importes monetarios usan decimales exactos; nunca numeros de punto flotante.

# 2. Arquitectura tecnologica

La solucion se implementara como un monolito modular. Esta eleccion reduce complejidad operativa para el volumen previsto, mantiene una sola unidad de despliegue y permite separar claramente cada dominio del negocio.

## 2.1 Stack objetivo

## 2.2 Estructura modular recomendada

## 2.3 Convenciones tecnicas

Timestamps almacenados en UTC y reglas de negocio calculadas con la zona America/Guayaquil.

Periodos mensuales representados de forma explicita, por ejemplo 2026-08, y no inferidos desde timestamps.

Montos con Decimal(18,2) o equivalente en PostgreSQL.

Validacion de entrada con esquemas compartidos entre UI y servidor.

Identificadores internos UUID; numeros de socio consecutivos por caja.

No se requiere Docker para el MVP; el repositorio debe poder incorporarlo posteriormente sin cambiar la arquitectura.

## 2.4 Procesos automaticos

# 3. Roles, acceso y permisos

## 3.1 Super Admin

Ve todas las cajas y sus reportes.

Crea, edita, activa y desactiva cajas.

Crea usuarios tesoreros y administra sus asignaciones.

Puede realizar cualquier operacion disponible para un tesorero.

Consulta auditoria global y configuracion transversal.

## 3.2 Tesorero

Accede solo a las cajas que tenga asignadas.

Puede compartir la gestion de una caja con otros tesoreros.

Gestiona socios, numeros, pagos, prestamos, gastos, retiros, cierres y reportes.

Puede modificar configuraciones operativas de una caja activa.

Puede reversar operaciones creadas por cualquier tesorero de la misma caja.

No puede crear cajas, asignar tesoreros ni consultar cajas no asignadas.

## 3.3 Socio - fase futura

Acceso de solo lectura a sus numeros, ahorros, prestamos, cuotas, rendimientos y estado de cuenta.

No registra pagos ni modifica datos financieros.

La autorizacion debe filtrar por persona, caja y numero asociado.

## 3.4 Matriz de permisos

# 4. Modulos funcionales

## 4.1 Administracion de cajas

Creacion, activacion, desactivacion, cuota fija, fecha oficial de inicio, dias de pago, limite de anticipos, umbral de riesgo y asignacion de tesoreros.

## 4.2 Personas y numeros

Registro unico por cedula, multiples numeros por persona y caja, numeracion consecutiva, ingreso por igualacion, estado activo o retirado.

## 4.3 Ahorros y obligaciones

Generacion mensual, adelantos configurables, pagos completos, semaforo, morosidad, riesgo y cancelacion por retiro.

## 4.4 Pagos y asignaciones

Un pago puede cubrir varias obligaciones y varios numeros. Cada detalle se asigna a una cuota exacta y puede reversarse individualmente.

## 4.5 Plantillas de prestamos

Monto exacto, plazo, interes fijo, tramos manuales de capital, estados Borrador/Activa/Inactiva e inmutabilidad tras activacion.

## 4.6 Rondas y turnos

Una ronda activa por caja, lista de siguientes elegibles, posposicion, reactivacion, reserva y control de un prestamo por numero y ronda.

## 4.7 Prestamos

Asignacion, saldo comprometido, desembolso, cronograma completo, pagos adelantados, liquidacion anticipada y migracion de prestamos activos.

## 4.8 Gastos y libro de caja

Gastos confirmados, reversas, saldo unico y movimientos inmutables.

## 4.9 Cierres y rendimientos

Intereses cobrados, gastos, deficit, remanentes, subperiodos de participacion, reparto por numero y ajustes tardios.

## 4.10 Retiros

Liquidacion completa del numero, deduccion de deudas, devolucion de ahorro, rendimiento acumulado y bloqueo si el resultado es negativo.

## 4.11 Reportes y auditoria

Dashboard, estados de cuenta, morosidad, riesgo, prestamos, cierres, saldo y bitacora de cambios.

# 5. Reglas de negocio consolidadas

## 5.1 Caja y configuracion

Cada caja opera en USD y mantiene su propio saldo, numeracion, socios, rondas, prestamos y cierres.

La cuota mensual de ahorro se define al crear la caja y queda inmutable al activarla o al registrar el primer numero.

Para operar con otra cuota mensual se debe crear otra caja.

La caja tiene una fecha oficial de inicio. Si inicia a mitad de mes, ese mes inicial no cuenta para la igualacion; el conteo comienza el mes siguiente.

Los dias recomendado y maximo, el limite de ahorro adelantado y el umbral de riesgo pueden modificarse mientras la caja este activa.

Los cambios de fechas solo afectan cuotas generadas despues del cambio. Las obligaciones existentes conservan sus fechas snapshot.

Una caja desactivada queda en modo consulta: no admite operaciones ni cambios y no genera cuotas.

Al reactivarla, se generan las cuotas faltantes de los meses inactivos.

## 5.2 Personas y numeros de socio

La cedula es unica en todo el sistema. Una persona existente se reutiliza al vincularla con otra caja.

Nombres, apellidos, cedula y telefono son obligatorios. Correo y direccion son opcionales.

La cedula puede corregirse con motivo y auditoria, pero se bloquea si el nuevo valor pertenece a otra persona.

Una persona puede tener varios numeros en una misma caja y participar en varias cajas.

El numero se asigna automaticamente y de forma consecutiva dentro de cada caja.

Los numeros retirados nunca se reutilizan ni se reactivan.

Una persona retirada puede volver a ingresar con un numero nuevo y un historial de riesgo nuevo para ese numero.

### Ingreso e igualacion

El aporte de igualacion se calcula con el ahorro teorico de la caja, no con lo efectivamente pagado por otros numeros.

La base corresponde a los meses acumulados hasta el mes anterior al ingreso, multiplicados por la cuota fija.

El aporte se registra como una sola operacion de igualacion, no como cuotas mensuales historicas ficticias.

No se permiten pagos parciales de igualacion.

El numero consecutivo se asigna al confirmar el pago completo y la activacion, dentro de una sola transaccion.

Si el numero queda activo antes de la generacion mensual, recibe la cuota de ese mes. Si queda activo despues, comienza el mes siguiente.

Un numero nuevo creado durante una ronda de prestamos activa espera hasta la siguiente ronda.

## 5.3 Cuotas de ahorro

Las cuotas se generan automaticamente al inicio de cada mes para los numeros activos en ese momento.

Solo puede existir una cuota por caja, numero y periodo.

Los pagos son completos; no se permite abonar parcialmente una cuota.

Se deben cubrir primero las cuotas anteriores pendientes.

Se pueden pagar meses futuros hasta el maximo configurable por caja.

El limite de adelantos puede cambiarse y se aplica solo a pagos nuevos; no invalida anticipos ya registrados.

El dinero de cuotas futuras entra inmediatamente al saldo disponible de la caja.

## 5.4 Fechas, semaforo y riesgo

Si una fecha cae sabado o domingo, se mueve al lunes siguiente. No se consideran feriados en el MVP.

Si la fecha recomendada y maxima coinciden, no existe ventana amarilla: hasta esa fecha es verde y luego rojo.

La fecha del pago se propone con la fecha actual del administrador; puede cambiarse a una fecha pasada, nunca futura.

Se guardan por separado la fecha real del pago, la fecha de registro y el usuario responsable.

Solo los eventos rojos cuentan para riesgo.

Se registra como maximo un evento de riesgo por numero y mes, aunque en ese periodo existan ahorro y cuota de prestamo.

El conteo se reinicia cada ano calendario para la clasificacion, pero el historial no se elimina.

Las obligaciones vencidas importadas no cuentan para riesgo; el conteo comienza desde la puesta en marcha.

El umbral es configurable por caja y no bloquea automaticamente al socio. Un prestamo a un numero en riesgo requiere advertencia y auditoria del override.

## 5.5 Pagos agrupados y reversas

Un pago pertenece a una persona y una caja, y puede cubrir varias cuotas de ahorro y de prestamo.

El tesorero selecciona exactamente las obligaciones incluidas.

Las cuotas de prestamo son indivisibles: capital e interes fijo se pagan juntos.

Las asignaciones siguen orden cronologico.

Se permiten reversas parciales: un detalle puede anularse sin reversar todo el pago.

Toda reversa exige motivo y crea el movimiento contrario; la operacion original permanece visible.

Un tesorero asignado puede reversar movimientos registrados por otro tesorero de la misma caja.

## 5.6 Plantillas de prestamo

Cada caja puede tener varias plantillas.

El monto entregado debe ser exactamente el configurado en la plantilla.

El interes mensual es un valor fijo en dolares, no un porcentaje sobre saldo.

El tesorero define manualmente los tramos de capital por rangos de cuotas.

La suma del capital de todos los tramos debe coincidir exactamente con el monto del prestamo.

La plantilla puede editarse solo en estado BORRADOR.

Al activarse queda inmutable para siempre. Puede pasar de ACTIVA a INACTIVA y volver a ACTIVA sin cambiar condiciones.

Para nuevas condiciones se duplica la plantilla y se genera otra version en borrador.

## 5.7 Elegibilidad, rondas y turnos

Cada caja tiene como maximo una ronda activa.

Cada numero puede recibir como maximo un prestamo por ronda.

El sistema muestra los siguientes cinco numeros elegibles ordenados por numero.

Se excluyen numeros retirados, no incorporados a la ronda, ya atendidos, reservados o pertenecientes a una persona con prestamo activo o en proceso.

Si un socio pospone el prestamo, conserva su prioridad original pero queda oculto hasta ser reactivado.

Al reactivarlo vuelve a su posicion segun el numero.

Una ronda se cierra cuando no quedan numeros disponibles o cuando el tesorero decide cerrarla anticipadamente.

En una nueva ronda todos los numeros activos vuelven a evaluarse; la posposicion anterior no se arrastra.

## 5.8 Asignacion y desembolso

Solo puede existir un prestamo activo o en desembolso por persona y caja, aunque tenga varios numeros.

El prestamo se asigna a un numero especifico para trazabilidad.

Antes de asignarlo, todos los numeros activos de la persona dentro de la caja deben estar al dia en ahorros.

Para colocar un prestamo en DESEMBOLSO_EN_PROCESO debe existir saldo libre suficiente.

El dinero no se descuenta aun, pero su monto se considera comprometido.

La suma de prestamos en proceso no puede exceder el saldo contable disponible.

Al confirmar la entrega se valida nuevamente el saldo, se registra la salida y el prestamo pasa a ACTIVO.

Si se cancela durante el proceso, se libera el compromiso y el turno vuelve a disponible en la misma ronda.

El plazo maximo de desembolso genera una alerta; no cancela automaticamente ni puede extenderse manualmente.

## 5.9 Cronograma y pagos de prestamo

Al confirmar el desembolso se genera el cronograma completo del prestamo.

La primera cuota corresponde al mes siguiente al desembolso.

Cada cuota guarda numero, periodo, capital, interes fijo, total y fechas recomendada y maxima.

No existen multas ni intereses adicionales por mora.

Se pueden adelantar cuotas completas sin limite, siempre en orden cronologico.

Para pagar una cuota, el ahorro del numero asociado al prestamo debe estar al dia hasta el mes actual.

La regularizacion del ahorro y el pago de prestamo pueden registrarse dentro del mismo pago agrupado.

No se requiere adelantar ahorros de meses futuros para adelantar cuotas de prestamo.

## 5.10 Liquidacion anticipada

Cuando se seleccionan todas las cuotas restantes, el sistema aplica automaticamente liquidacion anticipada.

El calculo incluye todo el capital pendiente, intereses vencidos de meses anteriores y el interes fijo completo del mes actual.

Los intereses de meses futuros no se cobran.

El interes del mes actual no se prorratea, sin importar el dia de liquidacion.

Aunque la cuota normal del mes ya haya sido pagada, la liquidacion cobra el interes correspondiente al mes corriente segun la regla definida.

Antes de liquidar, solo el ahorro del numero asociado debe estar al dia.

El pago de ahorro pendiente y la liquidacion se ejecutan como operaciones separadas.

## 5.11 Gastos, saldo y movimientos

La caja maneja un unico saldo total; no se separa efectivo y bancos.

Los gastos reducen inmediatamente el saldo disponible.

Todos los gastos confirmados se descuentan de los intereses antes del reparto.

Los gastos se corrigen por reversa; no se eliminan.

No existen ajustes manuales de entrada o salida.

## 5.12 Cierre y distribucion de rendimientos

Solo se consideran intereses efectivamente cobrados.

Todos los gastos del periodo se restan de esos intereses.

Si el resultado es negativo no hay reparto y el deficit se arrastra al siguiente periodo.

Los centavos no distribuibles quedan como remanente y se suman al siguiente reparto.

El reparto se calcula por numero participante, no por persona.

La participacion se divide en subperiodos para que un numero nuevo no reciba intereses generados antes de su ingreso.

Los numeros activos reciben su parte aunque tengan atrasos o clasificacion de riesgo.

Un numero retirado recibe en su liquidacion el rendimiento acumulado hasta la fecha de retiro y deja de participar despues.

Al confirmar el reparto, los valores se consideran entregados y generan una salida de caja; no se suman al ahorro.

El cierre confirmado queda congelado. Pagos, gastos o reversas registrados tarde se trasladan como ajustes al siguiente periodo.

## 5.13 Retiro de un numero

El retiro es independiente por numero y es permanente.

Solo se exigen cuotas de ahorro hasta el mes anterior al retiro.

La cuota del mes actual, si ya fue generada, se cancela por retiro y no cuenta como deuda ni riesgo.

Los ahorros pagados por adelantado se incluyen integramente en el saldo devuelto.

Las deudas pueden descontarse directamente de la liquidacion.

Si existe prestamo activo, se aplica la regla de liquidacion anticipada.

Si el resultado neto es negativo, el retiro se bloquea hasta que la persona pague la diferencia.

La liquidacion, cancelacion de obligaciones, cierre del prestamo, salida de dinero y cambio a RETIRADO se ejecutan en una sola transaccion.

## 5.14 Operaciones en periodos cerrados

Se permiten pagos y gastos con fecha real perteneciente a un periodo ya cerrado.

El cierre anterior no se recalcula.

El registro se marca como posterior al cierre y su efecto se aplica al periodo abierto siguiente.

Tambien se permiten reversas de operaciones cerradas con el mismo tratamiento.

# 6. Modelo de datos

El modelo debe separar identidad, pertenencia a cajas, obligaciones, operaciones financieras y auditoria. La lista siguiente define las entidades principales; los nombres definitivos pueden adaptarse a las convenciones del repositorio.

## 6.1 Relaciones esenciales

Una Person tiene muchas Membership y puede pertenecer a varias CashFund.

Una CashFund tiene muchos tesoreros mediante CashFundUser.

Una Membership genera SavingsObligation y participa en LoanTurn.

Un Payment posee multiples PaymentAllocation.

Cada operacion financiera confirmada produce uno o mas CashMovement.

Un Loan pertenece a una persona y a un numero, y genera todas sus LoanInstallment al desembolsarse.

AnnualClosing congela totales y DistributionAllocation conserva el reparto por numero y subperiodo.

## 6.2 Restricciones de base de datos

## 6.3 Snapshots e inmutabilidad

Las cuotas guardan sus fechas recomendada y maxima al generarse.

Los prestamos copian monto, interes, plazo y tramos de la plantilla.

Los cierres copian participantes, subperiodos, gastos, intereses, deficit y remanente.

Los movimientos financieros no se actualizan para corregirlos; se crea una reversa enlazada.

# 7. Flujos criticos

## 7.1 Alta de un numero

El tesorero busca a la persona por cedula o crea su identidad.

El sistema calcula la igualacion teorica hasta el mes anterior.

Se crea un ingreso pendiente sin consumir numero.

El tesorero confirma el pago completo de igualacion.

En una transaccion se asigna el siguiente numero, se activa la membresia, se registra la entrada y se actualiza el saldo.

La cuota del mes se genera solo si la membresia estaba activa antes de la ejecucion mensual.

## 7.2 Registro de pago

Seleccionar caja y persona.

Mostrar obligaciones pendientes y futuras permitidas, ordenadas cronologicamente.

Seleccionar cuotas completas de uno o varios numeros y, si aplica, cuotas de prestamo.

Proponer la fecha actual; permitir una fecha pasada y bloquear fechas futuras.

Validar orden, montos, ahorro requerido y ausencia de asignaciones previas.

Confirmar Payment, PaymentAllocation y CashMovement en una transaccion.

Actualizar estados, semaforo, riesgo y saldo.

## 7.3 Desembolso de prestamo

Seleccionar uno de los siguientes numeros elegibles de la ronda.

Validar ahorro de todos los numeros de la persona, ausencia de otro prestamo y advertencia de riesgo.

Validar saldo libre considerando prestamos ya comprometidos.

Crear prestamo en DESEMBOLSO_EN_PROCESO y reservar el turno.

Al confirmar la entrega, volver a validar saldo.

Registrar salida, activar prestamo, marcar turno atendido y generar cronograma completo.

## 7.4 Reversa parcial

Seleccionar el detalle exacto del pago o movimiento.

Exigir motivo.

Crear reversa enlazada y movimiento contrario.

Restaurar la obligacion afectada sin modificar las demas asignaciones.

Si corresponde a un cierre confirmado, registrar el efecto en el periodo abierto siguiente.

## 7.5 Retiro

Calcular ahorro acumulado, anticipos, rendimiento hasta la fecha y obligaciones hasta el mes anterior.

Si existe prestamo, calcular liquidacion anticipada.

Determinar valor neto.

Bloquear si el neto es negativo.

Confirmar la liquidacion en una sola transaccion: saldar, cancelar, retirar, registrar salida y remover de rondas.

# 8. Migracion inicial

La migracion se realizara por saldos de apertura. No se reconstruira cada pago historico. La fecha de corte marcara el inicio del historial operativo confiable dentro del nuevo sistema.

## 8.1 Datos por caja

Informacion general y configuracion vigente.

Fecha oficial de inicio.

Saldo total disponible al corte.

Fecha de puesta en marcha para comenzar el conteo de riesgo.

## 8.2 Datos por numero

Persona y numero existente.

Estado activo o retirado.

Saldo actual de ahorro.

Fecha de ingreso si esta disponible.

Movimiento SALDO_INICIAL_MIGRADO por el valor de ahorro.

## 8.3 Prestamos activos

Monto original, capital pagado y capital pendiente.

Interes fijo mensual.

Cuotas vencidas pendientes con sus fechas originales.

Cuotas futuras y cronograma de capital restante.

Proximo numero de cuota y proximo vencimiento.

Las cuotas vencidas importadas aparecen en morosidad, pero no incrementan el contador de riesgo.

## 8.4 Saldo inicial de caja

Se registra un unico movimiento SALDO_INICIAL_CAJA por el dinero realmente disponible al corte.

No se desglosa entre efectivo y bancos.

Debe conciliarse contra la informacion migrada antes de habilitar operaciones.

## 8.5 Proceso recomendado

Preparar plantillas CSV controladas para cajas, personas, numeros, saldos, prestamos y cuotas pendientes.

Validar cedulas duplicadas, numeros repetidos y montos invalidos.

Ejecutar una migracion de prueba en un ambiente separado.

Emitir reporte de conciliacion por caja: saldo inicial, ahorros, capital pendiente y cuotas vencidas.

Corregir datos de origen y repetir la carga completa; evitar parches manuales.

Congelar la operacion anterior, realizar el corte final y habilitar el sistema.

# 9. Reportes y experiencia de usuario

## 9.1 Dashboard por caja

## 9.2 Vistas principales

Listado de cajas para Super Admin y selector de cajas asignadas para Tesorero.

Listado de socios con resumen por persona y acceso a cada numero.

Detalle de numero con ahorro, obligaciones, prestamos, riesgo, rendimientos y movimientos.

Registro de pago con seleccion agrupada y total calculado en tiempo real.

Cola de los siguientes cinco numeros elegibles de la ronda.

Detalle de prestamo con cronograma, estado, saldos y acciones permitidas.

Libro de caja cronologico con filtros por tipo, fecha, socio, numero y referencia.

Vista de cierres con deficit, remanente, ajustes y asignaciones por numero.

## 9.3 Reportes minimos

## 9.4 Exportaciones

PDF para estados de cuenta, cronogramas, cierres y liquidaciones.

CSV/XLSX para conciliacion y analisis administrativo.

Las exportaciones deben respetar exactamente los filtros visibles.

# 10. Seguridad, auditoria y calidad

## 10.1 Autenticacion y autorizacion

Registro publico deshabilitado.

Usuarios creados por Super Admin.

Contrasenas almacenadas con el mecanismo seguro provisto por Better Auth.

Sesiones persistentes revocables.

Autorizacion verificada en servidor para cada accion; la ocultacion en UI no es suficiente.

Cada consulta de tesorero filtra por asignacion a caja.

## 10.2 Auditoria obligatoria

Creacion y cambio de configuracion.

Activacion y desactivacion de cajas y plantillas.

Asignacion de tesoreros.

Correccion de cedula.

Overrides para prestamos a numeros en riesgo.

Pagos, desembolsos, gastos, retiros, cierres y reversas.

Cambios de estado relevantes.

## 10.3 Integridad y concurrencia

Bloqueo transaccional del contador de numeros para evitar asignaciones duplicadas.

Validacion del saldo libre dentro de la misma transaccion de asignacion y desembolso.

Claves de idempotencia en acciones financieras para evitar doble envio.

Restricciones unicas y checks en PostgreSQL como segunda linea de defensa.

Reintentos controlados para procesos automaticos.

## 10.4 Estrategia de pruebas

## 10.5 Respaldo y operacion

Respaldos automaticos de PostgreSQL segun el plan del proveedor y exportaciones periodicas.

Variables sensibles solo en el gestor de secretos del despliegue.

Logs estructurados con correlation_id para operaciones criticas.

Monitoreo de errores, procesos mensuales y fallos de conciliacion.

Procedimiento documentado de restauracion antes de produccion.

# 11. Fases de implementacion

El orden prioriza primero la integridad financiera y luego las funcionalidades que dependen de ella. Cada fase debe cerrar con pruebas automatizadas, datos de demostracion y criterios de salida verificables.

## 11.1 Dependencias clave

El libro de movimientos debe existir antes de pagos, gastos, prestamos y retiros.

La generacion de obligaciones debe estar estable antes de habilitar riesgo y morosidad.

Plantillas y rondas deben estar cerradas antes de prestamos.

Cierres dependen de intereses cobrados, gastos, membresias y movimientos validados.

La migracion final solo se ejecuta despues de aprobar la conciliacion de prueba.

## 11.2 Estrategia de entrega

Usar feature flags para modulos financieros que aun no esten listos.

Mantener ambientes separados de desarrollo, pruebas y produccion.

Probar con una caja piloto antes de habilitar todas las cajas.

Realizar un periodo corto de operacion paralela para validar saldos y reportes.

# 12. Criterios de aceptacion y alcance futuro

## 12.1 Criterios de aceptacion globales

Ningun tesorero puede consultar o modificar una caja no asignada.

El saldo del dashboard coincide con la suma del libro de movimientos.

No se pueden crear numeros, cuotas, rondas ni prestamos duplicados bajo concurrencia.

Toda correccion financiera conserva el registro original y la reversa.

Los pagos agrupados actualizan exactamente las obligaciones seleccionadas.

El sistema impide prestamos que excedan el saldo libre.

Los cierres confirmados no cambian por registros posteriores.

La migracion final concilia saldo de caja, ahorros y capital pendiente.

## 12.2 Decisiones fuera del MVP

## 12.3 Riesgos del proyecto y mitigacion

# Anexo A. Estados y eventos recomendados

## A.1 Estados de caja y membresia

## A.2 Prestamos

## A.3 Operaciones financieras

## A.4 Eventos de auditoria minimos

CASH_FUND_CREATED / ACTIVATED / DEACTIVATED

SETTINGS_CHANGED

TREASURER_ASSIGNED / UNASSIGNED

PERSON_DOCUMENT_CHANGED

MEMBERSHIP_ACTIVATED / WITHDRAWN

PAYMENT_CONFIRMED / ALLOCATION_REVERSED

LOAN_RESERVED / DISBURSED / CANCELLED / PAID_EARLY

RISK_OVERRIDE_USED

EXPENSE_CONFIRMED / REVERSED

CLOSING_CONFIRMED / LATE_ADJUSTMENT_CREATED


### TABLE 1


| CAJA DE AHORRO XYZ / Plan definitivo / del proyecto / Arquitectura, modulos, modelo de datos, reglas de negocio y fases de implementacion /  / Documento funcional y tecnico consolidado / Version 1.0  |  Julio de 2026 |

| --- |


### TABLE 2


| Seccion | Contenido |

| --- | --- |

| 1 | Resumen ejecutivo y alcance |

| 2 | Arquitectura tecnologica |

| 3 | Roles, acceso y permisos |

| 4 | Modulos funcionales |

| 5 | Reglas de negocio consolidadas |

| 6 | Modelo de datos |

| 7 | Flujos criticos |

| 8 | Migracion inicial |

| 9 | Reportes y experiencia de usuario |

| 10 | Seguridad, auditoria y calidad |

| 11 | Fases de implementacion |

| 12 | Criterios de aceptacion y alcance futuro |

| Anexo | Estados, eventos y restricciones |


### TABLE 3


|  | Decision estructural principal / La cuota mensual de ahorro de una caja es fija e inmutable. Si se necesita operar con otra cuota, se debe crear una caja independiente. |

| --- | --- |


### TABLE 4


|  | Principio contable / El saldo de la caja se obtiene del libro de movimientos. No existiran ajustes manuales de saldo ni eliminacion de registros financieros; las correcciones se realizan mediante reversas trazables. |

| --- | --- |


### TABLE 5


| Incluido | No incluido inicialmente |

| --- | --- |

| Multiples cajas con configuracion y saldo independientes | Portal de socio |

| Super Admin y tesoreros asignados por caja | Carga de comprobantes de pago |

| Socios, numeros, ahorros, pagos y estados de cuenta | Integracion directa con WhatsApp |

| Plantillas, rondas, prestamos y liquidacion anticipada | Desglose de efectivo y cuentas bancarias |

| Gastos, cierres, rendimientos, retiros y reversas | Calendario de feriados |

| Migracion de saldos y prestamos activos | Monedas distintas de USD |


### TABLE 6


| Capa | Tecnologia | Uso |

| --- | --- | --- |

| Aplicacion web | Next.js 16 - App Router | Interfaz, rutas protegidas, acciones de servidor y API interna. |

| Lenguaje | TypeScript estricto | Tipos compartidos, validaciones y seguridad en compilacion. |

| Runtime | Node.js 24 | Ejecucion del servidor y tareas programadas. |

| UI | Shadcn/ui + Tailwind CSS 4 | Componentes accesibles y sistema visual consistente. |

| Diseno | Tokens Material Design 3 | Jerarquia, densidad, estados y temas. |

| Graficos | Recharts | Dashboards y reportes visuales. |

| Autenticacion | Better Auth | Correo/contrasena, sesiones persistentes y usuarios administrados. |

| ORM | Prisma | Modelo relacional, migraciones y transacciones. |

| Base de datos | PostgreSQL en Neon | Persistencia principal y restricciones financieras. |

| Archivos | Cloudflare R2 | Logos y exportaciones opcionales. |

| Despliegue | Railway | Aplicacion, variables, logs y tareas programadas. |

| Pruebas | Vitest + Playwright | Pruebas unitarias, integracion y recorridos E2E. |

| Paquetes | pnpm | Gestor unico del repositorio. |


### TABLE 7


| src/ /   app/                    # Rutas y layouts /   modules/ /     cash-funds/           # Cajas y configuracion /     members/              # Personas y numeros /     savings/              # Cuotas de ahorro /     payments/             # Pagos y asignaciones /     loans/                # Plantillas, rondas y prestamos /     expenses/             # Gastos /     distributions/        # Cierres y rendimientos /     withdrawals/          # Retiros y liquidaciones /     ledger/               # Libro de movimientos /     audit/                # Auditoria /   lib/ /     auth/ /     db/ /     money/ /     dates/ /   jobs/                   # Procesos programados / prisma/ /   schema.prisma /   migrations/ |

| --- |


### TABLE 8


| Proceso | Frecuencia | Comportamiento |

| --- | --- | --- |

| Generacion de cuotas de ahorro | Inicio de cada mes | Crea una cuota por numero activo al momento de la ejecucion. |

| Recuperacion tras reactivacion | Al reactivar una caja | Genera en orden los meses omitidos durante la inactividad. |

| Actualizacion de morosidad | Diaria o bajo consulta | Calcula semaforo, dias de atraso y eventos de riesgo. |

| Alertas de desembolso | Periodica | Detecta prestamos que excedieron el plazo de entrega; solo alerta. |

| Verificacion de integridad | Programada | Comprueba totales, obligaciones sin asignacion y consistencia del libro. |


### TABLE 9


| Accion | Super Admin | Tesorero asignado | Socio futuro |

| --- | --- | --- | --- |

| Crear/editar caja | Si | No | No |

| Asignar tesoreros | Si | No | No |

| Configurar operacion | Si | Si | No |

| Crear socios y numeros | Si | Si | No |

| Registrar pagos/gastos | Si | Si | No |

| Gestionar prestamos | Si | Si | No |

| Reversar movimientos | Si | Si | No |

| Ver estado propio | Si | Si | Si |

| Ver todas las cajas | Si | No | No |


### TABLE 10


| Estado | Regla |

| --- | --- |

| Verde | Pago realizado hasta la fecha recomendada efectiva. |

| Amarillo | Pago posterior a la recomendada y hasta la fecha maxima efectiva. |

| Rojo | Pago posterior a la fecha maxima o cuota que continua pendiente despues de ella. |


### TABLE 11


| Rendimiento neto del periodo / = intereses cobrados / - gastos confirmados / - deficit anterior / + remanente anterior / +/- ajustes de periodos cerrados |

| --- |


### TABLE 12


| Liquidacion neta / = ahorro acumulado / + rendimiento generado hasta el retiro / - obligaciones de ahorro hasta el mes anterior / - deuda del prestamo / = valor a entregar |

| --- |


### TABLE 13


| Entidad | Responsabilidad | Campos clave |

| --- | --- | --- |

| User | Cuenta de acceso administrativo o futura cuenta de socio. | id, email, password_hash/auth_data, status, created_at |

| Person | Identidad unica del socio. | id, document_id unique, first_name, last_name, phone, email?, address? |

| CashFund | Caja y sus parametros estructurales. | id, name, logo_key, phrase, currency, monthly_saving_amount, official_start_date, status, next_member_number |

| CashFundSettings | Configuracion operativa mutable. | recommended_day, maximum_day, max_advance_months, risk_threshold, updated_by |

| CashFundUser | Asignacion de usuarios a cajas. | cash_fund_id, user_id, role, status |

| MembershipEnrollment | Ingreso pendiente antes de asignar numero. | person_id, cash_fund_id, equalization_amount, status, confirmed_at |

| Membership | Numero de socio dentro de una caja. | cash_fund_id, person_id, member_number, activated_at, status, withdrawal_at |

| SavingsObligation | Cuota mensual de ahorro. | membership_id, period, amount, recommended_date, maximum_date, origin, risk_eligible, status |

| Payment | Cabecera de un pago agrupado. | cash_fund_id, person_id, payment_date, registered_at, registered_by, total, status |

| PaymentAllocation | Aplicacion exacta del pago. | payment_id, obligation_type, obligation_id, amount, status |

| CashMovement | Libro inmutable de entradas y salidas. | cash_fund_id, direction, type, amount, effective_date, reference_type/id, reversal_of |

| Expense | Gasto operativo. | cash_fund_id, category, concept, amount, expense_date, status, registered_by |

| LoanTemplate | Condiciones reutilizables. | cash_fund_id, name, principal, term_months, fixed_interest, max_disbursement_hours, status, version_of |

| LoanCapitalSegment | Tramos manuales de capital. | template_id, installment_from, installment_to, capital_per_installment |

| LoanRound | Ronda de prestamos. | cash_fund_id, status, opened_at, closed_at, closed_by |

| LoanTurn | Participacion del numero en una ronda. | round_id, membership_id, original_order, status, reserved_loan_id |

| Loan | Prestamo otorgado. | cash_fund_id, person_id, membership_id, template_snapshot, principal, fixed_interest, status, disbursed_at |

| LoanInstallment | Cronograma completo. | loan_id, installment_number, period, capital, interest, total, recommended_date, maximum_date, status |

| RiskOccurrence | Evento mensual de riesgo. | membership_id, year, month, source_obligation_id, counted_at |

| AnnualClosing | Cierre de intereses y gastos. | cash_fund_id, period_from/to, interest_total, expense_total, prior_deficit, remainder, net, status |

| ClosingAdjustment | Efectos tardios de periodos cerrados. | source_period, target_closing_id, type, amount, source_reference |

| DistributionAllocation | Rendimiento asignado por numero/subperiodo. | closing_id, membership_id, participation_from/to, amount, status |

| MembershipWithdrawal | Liquidacion de retiro. | membership_id, withdrawal_date, savings, return_amount, debt_amount, net_amount, status |

| AuditEvent | Bitacora transversal. | actor_user_id, cash_fund_id, action, entity_type/id, before_json, after_json, reason, created_at |


### TABLE 14


| Restriccion | Objetivo |

| --- | --- |

| UNIQUE Person.document_id | Evitar personas duplicadas. |

| UNIQUE (cash_fund_id, member_number) | Evitar numeros repetidos dentro de una caja. |

| UNIQUE (membership_id, period) en SavingsObligation | Evitar cuotas mensuales duplicadas. |

| UNIQUE (loan_id, installment_number) | Evitar cuotas de prestamo duplicadas. |

| UNIQUE (membership_id, year, month) en RiskOccurrence | Contar como maximo un rojo mensual. |

| Indice parcial: una ronda ACTIVA por caja | Impedir rondas simultaneas. |

| Indice parcial: un prestamo EN_PROCESO/ACTIVO por persona y caja | Cumplir la regla de exclusividad. |

| CHECK amount > 0 | Impedir montos invalidos. |

| CHECK payment_date <= current business date | Bloquear fechas futuras desde la aplicacion y el servicio. |

| Foreign keys con RESTRICT | Evitar eliminacion de datos financieros relacionados. |


### TABLE 15


| Indicador | Definicion |

| --- | --- |

| Saldo contable | Suma de movimientos confirmados. |

| Saldo comprometido | Prestamos en desembolso en proceso. |

| Saldo libre | Saldo contable menos saldo comprometido. |

| Ahorros del mes | Cuotas cobradas del periodo. |

| Morosidad | Obligaciones pendientes posteriores a fecha maxima. |

| Intereses cobrados | Intereses efectivamente recibidos en el periodo. |

| Gastos | Salidas por gastos confirmados. |

| Prestamos | En proceso, activos, pagados y liquidados anticipadamente. |


### TABLE 16


| Reporte | Filtros y contenido |

| --- | --- |

| Estado de cuenta | Caja, persona, numero, rango de fechas, tipo de movimiento y saldo acumulado. |

| Cuotas de ahorro | Periodo, estado, semaforo, fecha de pago y numero. |

| Morosidad | Persona, numero, obligacion, fecha maxima, dias de atraso y monto. |

| Riesgo | Eventos rojos del ano, umbral y estado de cada numero. |

| Prestamos | Plantilla, estado, capital pendiente, interes cobrado y proximos vencimientos. |

| Ronda | Disponibles, pospuestos, reservados, atendidos e inelegibles. |

| Gastos | Fecha, categoria, concepto, monto, usuario y reversa. |

| Rendimientos | Intereses, gastos, deficit, remanente, participantes y valor entregado. |

| Auditoria | Usuario, accion, entidad, antes/despues, motivo y fecha. |


### TABLE 17


| Nivel | Cobertura prioritaria |

| --- | --- |

| Unitarias | Calculos de fechas, semaforo, igualacion, riesgo, tramos, liquidacion, reparto y retiro. |

| Integracion | Transacciones de pagos, reversas, desembolsos, cierres y migracion. |

| E2E | Alta de numero, pago agrupado, prestamo completo, retiro y cierre anual. |

| Concurrencia | Dos altas simultaneas, dos desembolsos y doble confirmacion de pago. |

| Migracion | Conciliacion de saldos y prestamos antes/despues. |


### TABLE 18


| Fase | Alcance | Criterio de salida |

| --- | --- | --- |

| Fase 0 - Fundacion | Repositorio, pnpm, Next.js, TypeScript, CI, entornos, Prisma, Neon, Better Auth, sistema visual y convenciones. | Aplicacion desplegada, login funcional, migraciones y pipeline de pruebas. |

| Fase 1 - Cajas, roles y auditoria | Super Admin, tesoreros, asignaciones, cajas, configuracion, activacion/desactivacion y AuditEvent. | Aislamiento por caja y permisos validados. |

| Fase 2 - Personas, numeros y migracion base | Personas unicas, ingreso pendiente, igualacion, numeracion consecutiva, saldos iniciales y consulta de detalle. | Alta transaccional y migracion de prueba conciliada. |

| Fase 3 - Ahorros, pagos y riesgo | Generacion mensual, anticipos, pagos agrupados, semaforo, morosidad, riesgo y reversas parciales. | Estado de cuenta y reportes de ahorro completos. |

| Fase 4 - Plantillas, rondas y prestamos | Plantillas inmutables, tramos, rondas, elegibilidad, compromisos, desembolso, cronograma y pagos. | Flujo de prestamo probado de extremo a extremo. |

| Fase 5 - Gastos, retiros y libro | Gastos, ledger completo, saldo libre, liquidacion anticipada y retiro atomico. | Conciliacion diaria y liquidaciones verificadas. |

| Fase 6 - Cierres y rendimientos | Subperiodos, deficit, remanentes, ajustes tardios, distribucion y comprobantes PDF. | Cierre anual reproducible y congelado. |

| Fase 7 - Reportes, hardening y produccion | Dashboards, exportaciones, E2E, carga final, capacitacion, monitoreo y respaldo. | Go-live con conciliacion firmada y plan de soporte. |


### TABLE 19


| Tema | Tratamiento futuro |

| --- | --- |

| Portal de socio | Acceso de solo lectura y descarga de estados de cuenta. |

| Notificaciones | Recordatorios por correo o integracion con WhatsApp. |

| Comprobantes | Carga opcional de imagen o PDF en R2. |

| Bancos y efectivo | Subcuentas contables si la operacion lo requiere. |

| Feriados | Calendario por pais para ajustar fechas efectivas. |

| PWA/offline | Instalacion y captura limitada cuando exista una necesidad real. |

| Aprobaciones dobles | Flujo de autorizacion para gastos o desembolsos altos. |


### TABLE 20


| Riesgo | Mitigacion |

| --- | --- |

| Datos historicos inconsistentes | Migracion por saldos, validaciones y conciliacion previa. |

| Duplicidad por operaciones simultaneas | Transacciones, indices unicos e idempotencia. |

| Errores en reparto | Snapshots, pruebas de escenarios y cierre congelado. |

| Diferencias de saldo | Libro inmutable, sin ajustes manuales, reportes de integridad. |

| Cambio de reglas despues del lanzamiento | Configuracion auditada y snapshots en obligaciones. |

| Acceso indebido entre cajas | Autorizacion server-side y pruebas de aislamiento. |


### TABLE 21


| Entidad | Estados |

| --- | --- |

| CashFund | DRAFT, ACTIVE, INACTIVE |

| MembershipEnrollment | PENDING, CONFIRMED, CANCELLED |

| Membership | ACTIVE, WITHDRAWN |

| SavingsObligation | PENDING, PAID, CANCELLED_BY_WITHDRAWAL, REVERSED |


### TABLE 22


| Entidad | Estados |

| --- | --- |

| LoanTemplate | DRAFT, ACTIVE, INACTIVE |

| LoanRound | DRAFT, ACTIVE, CLOSED |

| LoanTurn | AVAILABLE, POSTPONED, RESERVED, ATTENDED, INELIGIBLE |

| Loan | DISBURSEMENT_IN_PROGRESS, ACTIVE, PAID, PAID_EARLY, CANCELLED |

| LoanInstallment | PENDING, PAID, CANCELLED_BY_EARLY_PAYOFF, REVERSED |


### TABLE 23


| Entidad | Estados o tipos relevantes |

| --- | --- |

| Payment | CONFIRMED, PARTIALLY_REVERSED, REVERSED |

| Expense | CONFIRMED, REVERSED |

| AnnualClosing | DRAFT, CONFIRMED, REVERSED_BY_ADJUSTMENT |

| MembershipWithdrawal | CALCULATED, CONFIRMED, BLOCKED_NEGATIVE |

| CashMovement | INITIAL_CASH_BALANCE, INITIAL_SAVINGS, EQUALIZATION, SAVING_PAYMENT, LOAN_DISBURSEMENT, LOAN_CAPITAL, LOAN_INTEREST, EXPENSE, DISTRIBUTION, WITHDRAWAL, REVERSAL |


### TABLE 24


|  | Cierre del plan / Este documento define el comportamiento esperado del MVP. Los detalles de interfaz, nombres exactos de tablas y endpoints pueden evolucionar durante el desarrollo, siempre que mantengan las reglas, restricciones y trazabilidad aqui establecidas. |

| --- | --- |
