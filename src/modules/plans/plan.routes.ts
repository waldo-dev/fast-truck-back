import { Router } from 'express';
import { authenticate, authorize, validate, validateParams } from '../../shared/middlewares';
import { UserRole } from '../../shared/database/models/enums';
import { planController } from './plan.controller';
import { createPlanSchema, planParamsSchema, updatePlanSchema } from './plan.schemas';

const router = Router();

// GET /plans - público (lista planes)
router.get('/', planController.getAll);

// GET /plans/:id - público
router.get('/:id', validateParams(planParamsSchema), planController.getById);

// POST /plans - solo ADMIN
router.post('/', authenticate, authorize(UserRole.ADMIN), validate(createPlanSchema), planController.create);

// PUT /plans/:id - solo ADMIN
router.put(
  '/:id',
  authenticate,
  authorize(UserRole.ADMIN),
  validateParams(planParamsSchema),
  validate(updatePlanSchema),
  planController.update
);

export default router;












