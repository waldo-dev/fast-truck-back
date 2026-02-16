import { Router } from 'express';
import { authenticate, authorize, injectBusinessId, validate, validateParams } from '../../shared/middlewares';
import { UserRole } from '../../shared/database/models/enums';
import { productOptionController } from './product-option.controller';
import {
  createProductOptionSchema,
  updateProductOptionSchema,
  productOptionParamsSchema,
  productParamsSchema,
} from './product-option.schemas';

const router = Router();

// Todas las rutas requieren autenticación y business_id
router.use(authenticate);
router.use(injectBusinessId);

// POST /products/:id/options - Agregar opción a producto (solo ADMIN)
router.post(
  '/products/:id/options',
  authorize(UserRole.ADMIN),
  validateParams(productParamsSchema),
  validate(createProductOptionSchema),
  productOptionController.create
);

// PUT /product-options/:id - Editar opción (solo ADMIN)
router.put(
  '/product-options/:id',
  authorize(UserRole.ADMIN),
  validateParams(productOptionParamsSchema),
  validate(updateProductOptionSchema),
  productOptionController.update
);

// DELETE /product-options/:id - Eliminar opción (solo ADMIN)
router.delete(
  '/product-options/:id',
  authorize(UserRole.ADMIN),
  validateParams(productOptionParamsSchema),
  productOptionController.delete
);

export default router;

