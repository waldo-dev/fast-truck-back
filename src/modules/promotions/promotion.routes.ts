import { Router } from 'express';
import { authenticate, authorize, injectBusinessId, validate, validateParams } from '../../shared/middlewares';
import { UserRole } from '../../shared/database/models/enums';
import { promotionController } from './promotion.controller';
import {
  createPromotionSchema,
  updatePromotionSchema,
  togglePromotionStatusSchema,
  promotionParamsSchema,
  addProductsToPromotionSchema,
  removeProductsFromPromotionSchema,
} from './promotion.schemas';

const router = Router();

// Todas las rutas requieren autenticación y business_id
router.use(authenticate);
router.use(injectBusinessId);

// GET /promotions - Listar promociones (ADMIN y STAFF pueden leer)
// Query params: active (true/false)
router.get('/', promotionController.getAll);

// GET /promotions/:id - Obtener promoción por ID (ADMIN y STAFF pueden leer)
router.get('/:id', validateParams(promotionParamsSchema), promotionController.getById);

// POST /promotions - Crear promoción (solo ADMIN)
router.post('/', authorize(UserRole.ADMIN), validate(createPromotionSchema), promotionController.create);

// PUT /promotions/:id - Actualizar promoción (solo ADMIN)
router.put(
  '/:id',
  authorize(UserRole.ADMIN),
  validateParams(promotionParamsSchema),
  validate(updatePromotionSchema),
  promotionController.update
);

// PATCH /promotions/:id/active - Activar/desactivar promoción (solo ADMIN)
router.patch(
  '/:id/active',
  authorize(UserRole.ADMIN),
  validateParams(promotionParamsSchema),
  validate(togglePromotionStatusSchema),
  promotionController.toggleStatus
);

// POST /promotions/:id/products - Agregar productos a promoción (solo ADMIN)
router.post(
  '/:id/products',
  authorize(UserRole.ADMIN),
  validateParams(promotionParamsSchema),
  validate(addProductsToPromotionSchema),
  promotionController.addProducts
);

// DELETE /promotions/:id/products - Remover productos de promoción (solo ADMIN)
router.delete(
  '/:id/products',
  authorize(UserRole.ADMIN),
  validateParams(promotionParamsSchema),
  validate(removeProductsFromPromotionSchema),
  promotionController.removeProducts
);

// DELETE /promotions/:id - Eliminar promoción (solo ADMIN)
router.delete('/:id', authorize(UserRole.ADMIN), validateParams(promotionParamsSchema), promotionController.delete);

export default router;

