# Operfoods Esencial: cambios y verificación

## Alcance implementado

- Pedidos privados con autenticación, comprobación del negocio seleccionado y protección de IDs de pedidos, eventos, cajas, productos, categorías, promociones y locales. Ser dueño no permite exportar pedidos o clientes de otro usuario.
- Asociación a varios negocios respetada mediante `X-Business-Id`, query o cuerpo, con rechazo de identificadores contradictorios. Acceso a datos personales limitado al negocio autorizado.
- Creación de pedido, cliente/dirección, líneas, consumo y pago/caja dentro de la misma transacción. `request_key` obligatorio en ambos canales HTTP: los reintentos devuelven el mismo pedido y no permiten cambiar su contenido.
- Serialización de reintentos mediante advisory lock de PostgreSQL e índice único por negocio y clave. Las claves no expiran: sirven para recuperar una respuesta perdida.
- Nombre del producto, opciones, notas, total de línea con descuento y costo total de ingredientes conservados en cada venta.
- Cambios de estado bajo bloqueo, con fecha e historial. Anulación previa a preparación restituye ingredientes; posterior a preparación conserva el consumo como merma. Borrar un pedido se convierte en anulación para conservar el historial.
- Cobros completos explícitos e idempotentes: pago recibido y movimiento de venta se guardan juntos. Los pagos pendientes no se suman como recaudados. Los movimientos manuales no pueden registrar ventas de pedidos ni inflar efectivo con tarjeta.
- Cierre de caja y cobros comparten bloqueo de caja. Aperturas concurrentes se serializan por negocio.
- Resumen y ranking de eventos limitados al negocio. Margen = ventas − gastos − ingredientes, incluyendo consumo de cancelaciones preparadas. Si falta costo o snapshot histórico, se muestra incompleto. No se reconstruyen costos históricos desde recetas actuales.
- Acceso por OTP simulado deshabilitado; el middleware de sesión de cliente exige firma y audiencia. El pedido público sigue funcionando sin cuenta de cliente.
- Mailing simulado retirado de la API. Solo administración puede modificar suscripciones; los propietarios no pueden activarlas registrando pagos ficticios.
- El manejador de errores tiene los cuatro parámetros requeridos por Express y no revela detalles SQL al cliente.

## Cambio de contrato

Cada POST a `/orders` o `/public/orders` debe enviar `request_key` (16–100 caracteres alfanuméricos, guion o guion bajo; UUID recomendado). Reutilizar exactamente la misma clave y contenido ante una falla de red. Para otra compra, generar otra clave.

`payment_method` indica el medio elegido, no confirma un cobro. Solo en el canal privado, `payment_received: true` junto con `cash_register_id` registra un pago recibido. El canal público ignora esos campos y cualquier `customer_id`, `address_id`, estado u origen privado proporcionado por el visitante.

POST `/payments` registra el total completo efectivamente recibido y lo incorpora a una caja abierta. Repetir el mismo cobro no agrega otro movimiento. Los pagos parciales no forman parte de esta entrega.

## Migración obligatoria antes de desplegar

1. Respaldar la base y comprobar su restauración.
2. Usar una copia de prueba con el esquema vigente de Operfoods; no las tablas de casinos.
3. Configurar `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` en el entorno o `.env` del backend.
4. `npm run migrate` muestra el plan sin conectar ni modificar datos.
5. `npm run migrate -- --apply` aplica `20261105_order_integrity.sql` de forma transaccional y registra su versión. Repetir el comando no duplica columnas ni historial.
6. Comprobar con dos negocios el recorrido menú → pedido → preparación → cobro → entrega → cierre. Probar un envío con respuesta perdida y una cancelación antes/después de preparar.
7. Desplegar backend y frontend juntos, en una ventana controlada: el frontend anterior no envía la clave requerida. Actualizar también cualquier integración que cree pedidos.

La migración añade columnas e historial; no cambia ni borra ventas existentes. El backend nuevo requiere esas columnas. Para volver temporalmente al código anterior, conservarlas; no eliminar registros ni columnas como parte de un rollback de aplicación.

## Evidencia y límites

`npm test`: pruebas HTTP, dominio y repositorio con modelos simulados; no conectan a una base operativa. Incluyen aislamiento, reintentos simultáneos, snapshots, anulaciones, cobro y efectivo esperado.

La prueba PostgreSQL se omite si no existe `OPERFOODS_TEST_DATABASE_URL`. Al configurarla, el nombre de la base debe contener `test`. Crea y elimina únicamente un esquema temporal propio, aplica la migración dos veces y comprueba claves únicas, JSON y rollback. No sustituye el recorrido completo de aceptación con la base de prueba del negocio.

No se ejecutó una migración real en esta sesión: no había PostgreSQL de pruebas configurado. No se modificó producción.

Los pedidos ya pagados no se anulan automáticamente: se rechaza la acción para no ocultar dinero cobrado. Esta entrega no incorpora devolución automática ni conciliación con terminales. Antes del uso comercial se debe definir y validar el procedimiento de devoluciones.

La impresión de comandas en el frontend usa el diálogo del navegador. Requiere verificar el formato en la impresora elegida; no hay envío automático a impresoras. La actualización de pedidos usa consultas cada cinco segundos mientras la página está visible; no es operación sin conexión.

El ranking compara hasta 100 eventos recientes. El margen depende de los gastos y recetas cargados, no equivale a contabilidad ni a utilidad neta auditada. SII y cobro electrónico no forman parte de esta entrega.
