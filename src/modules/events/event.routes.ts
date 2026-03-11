import { Router } from 'express';
import {
  authenticate,
  authorize,
  injectBusinessId,
  validate,
  demoReadOnlyGuard,
  subscriptionGuard,
} from '../../shared/middlewares';
import { UserRole } from '../../shared/database/models/enums';
import { eventController } from './event.controller';
import { createEventSchema} from './event.schemas';

const router = Router();

// Todas las rutas requieren autenticación y business_id
router.use(authenticate);
router.use(injectBusinessId);

// GET /events - Listar eventos (ADMIN y LOCAL_OPERATOR pueden leer)
// Query param: future=true para solo eventos futuros
router.get('/', eventController.getAll);

// GET /events/analytics - ranking eventos
router.get('/analytics', eventController.getAnalytics);

// GET /events/:id/summary - Resumen evento (ventas, gastos, margen)
router.get('/:id/summary', eventController.getSummary);

// Expenses CRUD
router.get('/:id/expenses', eventController.listExpenses);
router.post(
  '/:id/expenses',
  authorize(UserRole.ADMIN, UserRole.BUSINESS_OWNER, UserRole.LOCAL_OPERATOR),
  demoReadOnlyGuard,
  subscriptionGuard('events'),
  eventController.createExpense
);
router.delete(
  '/:id/expenses/:expenseId',
  authorize(UserRole.ADMIN, UserRole.BUSINESS_OWNER, UserRole.LOCAL_OPERATOR),
  demoReadOnlyGuard,
  subscriptionGuard('events'),
  eventController.deleteExpense
);

// GET /events/:id - Detalle evento (ADMIN y LOCAL_OPERATOR pueden leer)
router.get('/:id', eventController.getById);

// POST /events - Crear evento (ADMIN, BUSINESS_OWNER, LOCAL_OPERATOR)
router.post(
  '/',
  authorize(UserRole.ADMIN, UserRole.BUSINESS_OWNER, UserRole.LOCAL_OPERATOR),
  demoReadOnlyGuard,
  validate(createEventSchema),
  eventController.create
);

export default router;


