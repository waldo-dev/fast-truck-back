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

// GET /promotions/by-business?business_ids=1,2 - Admin/Owner/Operator
router.get(
  '/by-business',
  authorize(UserRole.ADMIN, UserRole.BUSINESS_OWNER, UserRole.LOCAL_OPERATOR),
  promotionController.getByBusinessIds
);

// GET /promotions - Listar promociones (ADMIN, BUSINESS_OWNER, LOCAL_OPERATOR)
// Query params: active (true/false)
router.get('/', authorize(UserRole.ADMIN, UserRole.BUSINESS_OWNER, UserRole.LOCAL_OPERATOR), promotionController.getAll);

// GET /promotions/:id - Obtener promoción por ID (ADMIN, BUSINESS_OWNER, LOCAL_OPERATOR)
router.get(
  '/:id',
  authorize(UserRole.ADMIN, UserRole.BUSINESS_OWNER, UserRole.LOCAL_OPERATOR),
  validateParams(promotionParamsSchema),
  promotionController.getById
);

// POST /promotions - Crear promoción (ADMIN, BUSINESS_OWNER)
router.post(
  '/',
  authorize(UserRole.ADMIN, UserRole.BUSINESS_OWNER),
  validate(createPromotionSchema),
  promotionController.create
);

// PUT /promotions/:id - Actualizar promoción (ADMIN, BUSINESS_OWNER)
router.put(
  '/:id',
  authorize(UserRole.ADMIN, UserRole.BUSINESS_OWNER),
  validateParams(promotionParamsSchema),
  validate(updatePromotionSchema),
  promotionController.update
);

// PATCH /promotions/:id/active - Activar/desactivar promoción (ADMIN, BUSINESS_OWNER)
router.patch(
  '/:id/active',
  authorize(UserRole.ADMIN, UserRole.BUSINESS_OWNER),
  validateParams(promotionParamsSchema),
  validate(togglePromotionStatusSchema),
  promotionController.toggleStatus
);

// POST /promotions/:id/products - Agregar productos a promoción (ADMIN, BUSINESS_OWNER)
router.post(
  '/:id/products',
  authorize(UserRole.ADMIN, UserRole.BUSINESS_OWNER),
  validateParams(promotionParamsSchema),
  validate(addProductsToPromotionSchema),
  promotionController.addProducts
);

// DELETE /promotions/:id/products - Remover productos de promoción (ADMIN, BUSINESS_OWNER)
router.delete(
  '/:id/products',
  authorize(UserRole.ADMIN, UserRole.BUSINESS_OWNER),
  validateParams(promotionParamsSchema),
  validate(removeProductsFromPromotionSchema),
  promotionController.removeProducts
);

// DELETE /promotions/:id - Eliminar promoción (ADMIN, BUSINESS_OWNER)
router.delete(
  '/:id',
  authorize(UserRole.ADMIN, UserRole.BUSINESS_OWNER),
  validateParams(promotionParamsSchema),
  promotionController.delete
);

export default router;

