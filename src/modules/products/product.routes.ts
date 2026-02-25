import { Router } from 'express';
import multer from 'multer';
import {
  authenticate,
  authorize,
  injectBusinessId,
  validate,
  validateParams,
} from '../../shared/middlewares';
import { UserRole } from '../../shared/database/models/enums';
import { productController } from './product.controller';
import {
  createProductSchema,
  updateProductSchema,
  toggleProductStatusSchema,
  productParamsSchema,
  bulkCreateProductSchema,
} from './product.schemas';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Todas las rutas requieren autenticación
router.use(authenticate);

// Rutas para BUSINESS_OWNER con múltiples negocios (sin business_id inyectado)
router.get(
  '/owner',
  authorize(UserRole.BUSINESS_OWNER, UserRole.LOCAL_OPERATOR),
  productController.getByOwner
);

// Bulk create para múltiples negocios (solo ADMIN) con soporte de archivo
router.post(
  '/bulk',
  authorize(UserRole.ADMIN, UserRole.BUSINESS_OWNER),
  upload.single('image'),
  validate(bulkCreateProductSchema),
  productController.bulkCreate
);

// Rutas que requieren business_id (ADMIN/LOCAL_OPERATOR scoping)
router.use(injectBusinessId);

// GET /products - Listar productos (ADMIN y LOCAL_OPERATOR pueden leer)
// Query params: category_id, status
router.get('/', authorize(UserRole.ADMIN, UserRole.BUSINESS_OWNER, UserRole.LOCAL_OPERATOR), productController.getAll);

// GET /products/:id - Obtener producto por ID (ADMIN y LOCAL_OPERATOR pueden leer)
router.get(
  '/:id',
  authorize(UserRole.ADMIN, UserRole.BUSINESS_OWNER, UserRole.LOCAL_OPERATOR),
  validateParams(productParamsSchema),
  productController.getById
);

// POST /products - Crear producto (solo ADMIN)
router.post(
  '/',
  authorize(UserRole.ADMIN, UserRole.BUSINESS_OWNER),
  upload.single('image'),
  validate(createProductSchema),
  productController.create
);

// PUT /products/:id - Actualizar producto (solo ADMIN)
router.put(
  '/:id',
  authorize(UserRole.ADMIN, UserRole.BUSINESS_OWNER),
  validateParams(productParamsSchema),
  upload.single('image'),
  validate(updateProductSchema),
  productController.update
);

// PATCH /products/:id/status - Activar/desactivar producto (solo ADMIN)
router.patch(
  '/:id/status',
  authorize(UserRole.ADMIN, UserRole.BUSINESS_OWNER),
  validateParams(productParamsSchema),
  validate(toggleProductStatusSchema),
  productController.toggleStatus
);

// DELETE /products/:id - Eliminar producto (solo ADMIN)
router.delete(
  '/:id',
  authorize(UserRole.ADMIN, UserRole.BUSINESS_OWNER),
  validateParams(productParamsSchema),
  productController.delete
);

export default router;
