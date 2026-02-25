import { Router } from 'express';
import { authenticate, injectBusinessId, validate, validateParams } from '../../shared/middlewares';
import { paymentController } from './payment.controller';
import { createPaymentSchema, paymentParamsSchema } from './payment.schemas';

const router = Router();

// Todas las rutas requieren autenticación y business_id
router.use(authenticate);
router.use(injectBusinessId);

// POST /payments - Registrar pago manual (ADMIN y LOCAL_OPERATOR)
router.post('/', validate(createPaymentSchema), paymentController.create);

// GET /payments/:orderId - Pagos de un pedido (ADMIN y LOCAL_OPERATOR)
router.get('/:orderId', validateParams(paymentParamsSchema), paymentController.getByOrder);

export default router;


