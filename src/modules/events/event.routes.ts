import { Router } from 'express';
import {
  authenticate,
  authorize,
  injectBusinessId,
  validate,
  validateParams,
  demoReadOnlyGuard,
  subscriptionGuard,
} from '../../shared/middlewares';
import { UserRole } from '../../shared/database/models/enums';
import { eventController } from './event.controller';
import { createEventSchema, eventParamsSchema } from './event.schemas';

const router = Router();

// Todas las rutas requieren autenticación y business_id
router.use(authenticate);
router.use(injectBusinessId);

// GET /events - Listar eventos (ADMIN y LOCAL_OPERATOR pueden leer)
// Query param: future=true para solo eventos futuros
router.get('/', eventController.getAll);

// GET /events/:id - Detalle evento (ADMIN y LOCAL_OPERATOR pueden leer)
router.get('/:id', validateParams(eventParamsSchema), eventController.getById);

// POST /events - Crear evento (ADMIN, BUSINESS_OWNER, LOCAL_OPERATOR)
router.post(
  '/',
  authorize(UserRole.ADMIN, UserRole.BUSINESS_OWNER, UserRole.LOCAL_OPERATOR),
  demoReadOnlyGuard,
  subscriptionGuard('events'),
  validate(createEventSchema),
  eventController.create
);

export default router;


