import { Router } from 'express';
import { authenticate, authorize, injectBusinessId, validate, validateParams, validateQuery } from '../../shared/middlewares';
import { UserRole } from '../../shared/database/models/enums';
import { orderController } from './order.controller';
import {
  createOrderSchema,
  updateOrderStatusSchema,
  orderParamsSchema,
  orderUserParamsSchema,
  orderHistoryQuerySchema,
  orderCloseoutQuerySchema,
} from './order.schemas';

const router = Router();

// Todas las rutas requieren autenticación y business_id
router.use(authenticate);

// GET /orders/by-user/:userId - Listar pedidos de todos los negocios asociados a un usuario
router.get('/by-user/:userId', validateParams(orderUserParamsSchema), orderController.getByUserBusinesses);
// GET /orders/by-user/:userId/csv - Descargar CSV de pedidos de todos los negocios asociados a un usuario
router.get('/by-user/:userId/csv', validateParams(orderUserParamsSchema), orderController.getByUserBusinessesCsv);

router.use(injectBusinessId);

// GET /orders/history - Historial con filtros (ADMIN, BUSINESS_OWNER, LOCAL_OPERATOR)
router.get('/history', validateQuery(orderHistoryQuerySchema), orderController.getHistory);
// GET /orders/closeout - Resumen de cierre de caja
router.get(
  '/closeout',
  authorize(UserRole.ADMIN, UserRole.BUSINESS_OWNER, UserRole.LOCAL_OPERATOR),
  validateQuery(orderCloseoutQuerySchema),
  orderController.getCloseout
);

// GET /orders - Listar pedidos (ADMIN y LOCAL_OPERATOR pueden leer)
// Query params: status, order_source, customer_id
router.get('/', orderController.getAll);

// GET /orders/:id - Obtener pedido por ID (ADMIN y LOCAL_OPERATOR pueden leer)
router.get('/:id', validateParams(orderParamsSchema), orderController.getById);

// POST /orders - Crear pedido
// ADMIN puede crear cualquier tipo, LOCAL_OPERATOR solo WHATSAPP
router.post('/', validate(createOrderSchema), orderController.create);

// PATCH /orders/:id/status - Actualizar estado del pedido (solo ADMIN)
router.patch(
  '/:id/status',
  authorize(UserRole.ADMIN, UserRole.BUSINESS_OWNER, UserRole.LOCAL_OPERATOR),
  validateParams(orderParamsSchema),
  validate(updateOrderStatusSchema),
  orderController.updateStatus
);

// DELETE /orders/:id - Eliminar pedido (solo ADMIN)
router.delete('/:id', authorize(UserRole.ADMIN), validateParams(orderParamsSchema), orderController.delete);

export default router;


