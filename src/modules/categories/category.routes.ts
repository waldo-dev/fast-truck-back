import { Router } from 'express';
import { authenticate, authorize, injectBusinessId, validate, validateParams } from '../../shared/middlewares';
import { UserRole } from '../../shared/database/models/enums';
import { categoryController } from './category.controller';
import { createCategorySchema, updateCategorySchema, categoryParamsSchema, bulkCreateCategorySchema } from './category.schemas';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// Rutas para BUSINESS_OWNER con múltiples negocios (sin business_id inyectado)
router.get('/owner', authorize(UserRole.BUSINESS_OWNER), categoryController.getByOwner);

// Bulk create para múltiples negocios (ADMIN o BUSINESS_OWNER con pertenencia)
router.post('/bulk', authorize(UserRole.ADMIN, UserRole.BUSINESS_OWNER), validate(bulkCreateCategorySchema), categoryController.bulkCreate);

// Rutas que requieren business_id (ADMIN/LOCAL_OPERATOR scoping)
router.use(injectBusinessId);

// GET /categories - Listar categorías (ADMIN y LOCAL_OPERATOR pueden leer)
router.get('/', categoryController.getAll);

// GET /categories/:id - Obtener categoría por ID (ADMIN y LOCAL_OPERATOR pueden leer)
router.get('/:id', validateParams(categoryParamsSchema), categoryController.getById);

// POST /categories - Crear categoría (solo ADMIN)
router.post('/', authorize(UserRole.ADMIN, UserRole.BUSINESS_OWNER), validate(createCategorySchema), categoryController.create);

// PUT /categories/:id - Actualizar categoría (solo ADMIN)
router.put(
  '/:id',
  authorize(UserRole.ADMIN),
  validateParams(categoryParamsSchema),
  validate(updateCategorySchema),
  categoryController.update
);

// DELETE /categories/:id - Eliminar categoría (solo ADMIN)
router.delete('/:id', authorize(UserRole.ADMIN), validateParams(categoryParamsSchema), categoryController.delete);

export default router;


