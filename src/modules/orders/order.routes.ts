import { Router } from 'express';
import { authenticate, authorize, validate, validateParams, validateQuery } from '../../shared/middlewares';
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

// Public: GET /orders - listar (filtros por status, order_source, customer_id, event_id, business_id)
router.get('/', orderController.getAll);

// Public: GET /orders/:id - detalle
router.get('/:id', validateParams(orderParamsSchema), orderController.getById);

// Rutas protegidas
router.use(authenticate);

// GET /orders/by-user/:userId - Listar pedidos de todos los negocios asociados a un usuario
router.get('/by-user/:userId', validateParams(orderUserParamsSchema), orderController.getByUserBusinesses);
// GET /orders/by-user/:userId/csv - Descargar CSV de pedidos de todos los negocios asociados a un usuario
router.get('/by-user/:userId/csv', validateParams(orderUserParamsSchema), orderController.getByUserBusinessesCsv);

// GET /orders/history - Historial con filtros (ADMIN, BUSINESS_OWNER, LOCAL_OPERATOR)
router.get('/history', validateQuery(orderHistoryQuerySchema), orderController.getHistory);
// GET /orders/closeout - Resumen de cierre de caja
router.get(
  '/closeout',
  authorize(UserRole.ADMIN, UserRole.BUSINESS_OWNER, UserRole.LOCAL_OPERATOR),
  validateQuery(orderCloseoutQuerySchema),
  orderController.getCloseout
);

// POST /orders - Crear pedido
router.post('/', validate(createOrderSchema), orderController.create);

// PATCH /orders/:id/status - Actualizar estado del pedido
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


