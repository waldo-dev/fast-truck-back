import { Router } from 'express';
import { authenticate, authorize, injectBusinessId, validate, validateParams } from '../../shared/middlewares';
import { UserRole } from '../../shared/database/models/enums';
import { orderController } from './order.controller';
import { createOrderSchema, updateOrderStatusSchema, orderParamsSchema } from './order.schemas';

const router = Router();

// Todas las rutas requieren autenticación y business_id
router.use(authenticate);
router.use(injectBusinessId);

// GET /orders - Listar pedidos (ADMIN y STAFF pueden leer)
// Query params: status, order_source, customer_id
router.get('/', orderController.getAll);

// GET /orders/:id - Obtener pedido por ID (ADMIN y STAFF pueden leer)
router.get('/:id', validateParams(orderParamsSchema), orderController.getById);

// POST /orders - Crear pedido
// ADMIN puede crear cualquier tipo, STAFF solo WHATSAPP
router.post('/', validate(createOrderSchema), orderController.create);

// PATCH /orders/:id/status - Actualizar estado del pedido (solo ADMIN)
router.patch(
  '/:id/status',
  authorize(UserRole.ADMIN),
  validateParams(orderParamsSchema),
  validate(updateOrderStatusSchema),
  orderController.updateStatus
);

// DELETE /orders/:id - Eliminar pedido (solo ADMIN)
router.delete('/:id', authorize(UserRole.ADMIN), validateParams(orderParamsSchema), orderController.delete);

export default router;


