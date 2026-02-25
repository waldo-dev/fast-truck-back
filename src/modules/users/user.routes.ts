import { Router } from 'express';
import { authenticate, authorize, injectBusinessId, validate, validateParams, validateQuery } from '../../shared/middlewares';
import { UserRole } from '../../shared/database/models/enums';
import { userController } from './user.controller';
import {
  adminsOwnersQuerySchema,
  businessParamsSchema,
  createUserSchema,
  updateUserSchema,
  userParamsSchema,
} from './user.schemas';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// Rutas sin business_id inyectado (para owners con múltiples negocios)
router.get(
  '/business/:businessId',
  authorize(UserRole.ADMIN, UserRole.BUSINESS_OWNER),
  validateParams(businessParamsSchema),
  userController.getByBusiness
);

router.get(
  '/admins-owners',
  authorize(UserRole.ADMIN, UserRole.BUSINESS_OWNER),
  validateQuery(adminsOwnersQuerySchema),
  userController.getAdminsAndOwners
);

// Rutas que requieren business_id inyectado (scoping ADMIN/LOCAL_OPERATOR)
router.use(injectBusinessId);

// GET /users - Listar usuarios del negocio (ADMIN y LOCAL_OPERATOR pueden leer)
router.get('/', userController.getAll);

// GET /users/:id - Obtener usuario por ID (ADMIN y LOCAL_OPERATOR pueden leer)
router.get('/:id', validateParams(userParamsSchema), userController.getById);

// POST /users - Crear usuario LOCAL_OPERATOR (ADMIN o BUSINESS_OWNER) y asociar a múltiples locales
router.post(
  '/',
  authorize(UserRole.ADMIN, UserRole.BUSINESS_OWNER),
  validate(createUserSchema),
  userController.create
);

// PUT /users/:id - Editar usuario y reasignar locales (ADMIN o BUSINESS_OWNER)
router.put(
  '/:id',
  authorize(UserRole.ADMIN, UserRole.BUSINESS_OWNER),
  validateParams(userParamsSchema),
  validate(updateUserSchema),
  userController.update
);

// DELETE /users/:id - Desactivar usuario (solo ADMIN)
router.delete('/:id', authorize(UserRole.ADMIN), validateParams(userParamsSchema), userController.delete);

export default router;


