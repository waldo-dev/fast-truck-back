import { Router } from 'express';
import { authenticate, authorize, injectBusinessId, validate, demoReadOnlyGuard, subscriptionGuard } from '../../shared/middlewares';
import { UserRole } from '../../shared/database/models/enums';
import { locationController } from './location.controller';
import { createLocationSchema } from './location.schemas';

const router = Router();

// Todas las rutas requieren autenticación y business_id
router.use(authenticate);
router.use(injectBusinessId);

// GET /locations - Listar locales (ADMIN y LOCAL_OPERATOR pueden leer)
router.get('/', locationController.getAll);

// POST /locations - Crear local (solo ADMIN)
router.post(
  '/',
  authorize(UserRole.ADMIN),
  demoReadOnlyGuard,
  subscriptionGuard('locations'),
  validate(createLocationSchema),
  locationController.create
);

export default router;


