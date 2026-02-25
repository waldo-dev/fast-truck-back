import { Router } from 'express';
import { authenticate, authorize, injectBusinessId, validate } from '../../shared/middlewares';
import { UserRole } from '../../shared/database/models/enums';
import { paymentConfigController } from './payment-config.controller';
import { createPaymentConfigSchema } from './payment-config.schemas';

const router = Router();

// Todas las rutas requieren autenticación y business_id
router.use(authenticate);
router.use(injectBusinessId);

// GET /payment-configs - Obtener configuración activa (ADMIN y LOCAL_OPERATOR)
router.get('/', paymentConfigController.getAll);

// POST /payment-configs - Configurar proveedor (solo ADMIN)
router.post('/', authorize(UserRole.ADMIN), validate(createPaymentConfigSchema), paymentConfigController.create);

export default router;


