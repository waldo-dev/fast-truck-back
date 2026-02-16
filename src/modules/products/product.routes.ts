import { Router } from 'express';
import { authenticate, authorize, injectBusinessId, validate, validateParams } from '../../shared/middlewares';
import { UserRole } from '../../shared/database/models/enums';
import { productController } from './product.controller';
import {
  createProductSchema,
  updateProductSchema,
  toggleProductStatusSchema,
  productParamsSchema,
} from './product.schemas';

const router = Router();

// Todas las rutas requieren autenticación y business_id
router.use(authenticate);
router.use(injectBusinessId);

// GET /products - Listar productos (ADMIN y STAFF pueden leer)
// Query params: category_id, status
router.get('/', productController.getAll);

// GET /products/:id - Obtener producto por ID (ADMIN y STAFF pueden leer)
router.get('/:id', validateParams(productParamsSchema), productController.getById);

// POST /products - Crear producto (solo ADMIN)
router.post('/', authorize(UserRole.ADMIN), validate(createProductSchema), productController.create);

// PUT /products/:id - Actualizar producto (solo ADMIN)
router.put(
  '/:id',
  authorize(UserRole.ADMIN),
  validateParams(productParamsSchema),
  validate(updateProductSchema),
  productController.update
);

// PATCH /products/:id/status - Activar/desactivar producto (solo ADMIN)
router.patch(
  '/:id/status',
  authorize(UserRole.ADMIN),
  validateParams(productParamsSchema),
  validate(toggleProductStatusSchema),
  productController.toggleStatus
);

// DELETE /products/:id - Eliminar producto (solo ADMIN)
router.delete('/:id', authorize(UserRole.ADMIN), validateParams(productParamsSchema), productController.delete);

export default router;

