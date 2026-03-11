import { Router } from 'express';
import { authenticate, authorize, injectBusinessId, validate, validateParams, validateQuery } from '../../shared/middlewares';
import { UserRole } from '../../shared/database/models/enums';
import { subscriptionController } from './subscription.controller';
import {
  createSubscriptionSchema,
  subscriptionParamsSchema,
  updateSubscriptionSchema,
  createSubscriptionPaymentSchema,
  subscriptionQuerySchema,
} from './subscription.schemas';

const router = Router();

// Autenticación y business_id
router.use(authenticate);
router.use(injectBusinessId);

// GET /subscriptions - listar (ADMIN, OWNER, OPERATOR)
router.get(
  '/',
  authorize(UserRole.ADMIN, UserRole.BUSINESS_OWNER, UserRole.LOCAL_OPERATOR),
  validateQuery(subscriptionQuerySchema),
  subscriptionController.getAll
);

// GET /subscriptions/:id - detalle
router.get(
  '/:id',
  authorize(UserRole.ADMIN, UserRole.BUSINESS_OWNER, UserRole.LOCAL_OPERATOR),
  validateParams(subscriptionParamsSchema),
  subscriptionController.getById
);

// POST /subscriptions - crear (ADMIN, OWNER)
router.post(
  '/',
  authorize(UserRole.ADMIN, UserRole.BUSINESS_OWNER),
  validate(createSubscriptionSchema),
  subscriptionController.create
);

// PUT /subscriptions/:id - actualizar (ADMIN, OWNER)
router.put(
  '/:id',
  authorize(UserRole.ADMIN, UserRole.BUSINESS_OWNER),
  validateParams(subscriptionParamsSchema),
  validate(updateSubscriptionSchema),
  subscriptionController.update
);

// POST /subscriptions/:id/payments - registrar pago (ADMIN, OWNER)
router.post(
  '/:id/payments',
  authorize(UserRole.ADMIN, UserRole.BUSINESS_OWNER),
  validateParams(subscriptionParamsSchema),
  validate(createSubscriptionPaymentSchema),
  subscriptionController.addPayment
);

export default router;






