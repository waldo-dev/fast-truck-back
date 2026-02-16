import { Router } from 'express';
import { authenticate, authorize, injectBusinessId, validate } from '../../shared/middlewares';
import { UserRole } from '../../shared/database/models/enums';
import { locationController } from './location.controller';
import { createLocationSchema } from './location.schemas';

const router = Router();

// Todas las rutas requieren autenticación y business_id
router.use(authenticate);
router.use(injectBusinessId);

// GET /locations - Listar locales (ADMIN y STAFF pueden leer)
router.get('/', locationController.getAll);

// POST /locations - Crear local (solo ADMIN)
router.post('/', authorize(UserRole.ADMIN), validate(createLocationSchema), locationController.create);

export default router;

