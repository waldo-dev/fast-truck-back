import { Router } from 'express';
import { authenticate, authorize, injectBusinessId, validate, validateParams } from '../../shared/middlewares';
import { UserRole } from '../../shared/database/models/enums';
import { userController } from './user.controller';
import { createUserSchema, updateUserSchema, userParamsSchema } from './user.schemas';

const router = Router();

// Todas las rutas requieren autenticación y business_id
router.use(authenticate);
router.use(injectBusinessId);

// GET /users - Listar usuarios del negocio (ADMIN y STAFF pueden leer)
router.get('/', userController.getAll);

// GET /users/:id - Obtener usuario por ID (ADMIN y STAFF pueden leer)
router.get('/:id', validateParams(userParamsSchema), userController.getById);

// POST /users - Crear usuario STAFF (solo ADMIN)
router.post('/', authorize(UserRole.ADMIN), validate(createUserSchema), userController.create);

// PUT /users/:id - Editar usuario (solo ADMIN)
router.put(
  '/:id',
  authorize(UserRole.ADMIN),
  validateParams(userParamsSchema),
  validate(updateUserSchema),
  userController.update
);

// DELETE /users/:id - Desactivar usuario (solo ADMIN)
router.delete('/:id', authorize(UserRole.ADMIN), validateParams(userParamsSchema), userController.delete);

export default router;


