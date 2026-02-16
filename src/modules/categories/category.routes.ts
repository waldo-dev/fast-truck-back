import { Router } from 'express';
import { authenticate, authorize, injectBusinessId, validate, validateParams } from '../../shared/middlewares';
import { UserRole } from '../../shared/database/models/enums';
import { categoryController } from './category.controller';
import { createCategorySchema, updateCategorySchema, categoryParamsSchema } from './category.schemas';

const router = Router();

// Todas las rutas requieren autenticación y business_id
router.use(authenticate);
router.use(injectBusinessId);

// GET /categories - Listar categorías (ADMIN y STAFF pueden leer)
router.get('/', categoryController.getAll);

// GET /categories/:id - Obtener categoría por ID (ADMIN y STAFF pueden leer)
router.get('/:id', validateParams(categoryParamsSchema), categoryController.getById);

// POST /categories - Crear categoría (solo ADMIN)
router.post('/', authorize(UserRole.ADMIN), validate(createCategorySchema), categoryController.create);

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

