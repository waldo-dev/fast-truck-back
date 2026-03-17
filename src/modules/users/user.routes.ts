import { Router } from 'express';
import {
  authenticate,
  authorize,
  injectBusinessId,
  validate,
  validateParams,
  validateQuery,
} from '../../shared/middlewares';
import { UserRole } from '../../shared/database/models/enums';
import { userController } from './user.controller';
import {
  adminsOwnersQuerySchema,
  businessParamsSchema,
  createUserSchema,
  updateSelfSchema,
  updateUserSchema,
  updatePasswordSchema,
  userParamsSchema,
  userBusinessParamsSchema,
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

// GET /users/by-user/:userId - Listar usuarios de todos los negocios asociados a un usuario
router.get('/by-user/:userId', validateParams(userBusinessParamsSchema), userController.getByUserBusinesses);

// Rutas que requieren business_id inyectado (scoping ADMIN/LOCAL_OPERATOR)
router.use(injectBusinessId);

router.patch('/me', validate(updateSelfSchema), userController.updateSelf);

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

// PATCH /users/:id/password - Actualizar contraseña (ADMIN o BUSINESS_OWNER) con scoping
router.patch(
  '/:id/password',
  authorize(UserRole.ADMIN, UserRole.BUSINESS_OWNER),
  validateParams(userParamsSchema),
  validate(updatePasswordSchema),
  userController.updatePassword
);

// DELETE /users/:id - Desactivar usuario (solo ADMIN)
router.delete('/:id', authorize(UserRole.ADMIN), validateParams(userParamsSchema), userController.delete);

export default router;


