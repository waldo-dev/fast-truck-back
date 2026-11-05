import { Business } from '../../shared/database/models';
import { protectResource } from '../../shared/middlewares/businessAccess';
import { Router } from 'express';
import multer from 'multer';
import { authenticate, authorize } from '../../shared/middlewares';
import { UserRole } from '../../shared/database/models/enums';
import { businessController } from './business.controller';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Todas las rutas requieren autenticación
router.use(authenticate);
router.param(
  'id',
  protectResource(async id => (await Business.findByPk(id))?.id)
);

// GET /business - Listar business asociados al usuario autenticado
router.get('/', businessController.getAll);

// Dashboard / inicio
router.get('/dashboard/overview', businessController.getDashboardOverview);
router.get(
  '/dashboard/recent-orders',
  businessController.getDashboardRecentOrders
);
router.get(
  '/dashboard/top-businesses',
  businessController.getDashboardTopBusinesses
);

// GET /business/operating-context - Obtener modo operativo (LOCAL/EVENT)
router.get('/operating-context', businessController.getOperatingContext);

// PUT /business/operating-context - Actualizar modo operativo (ADMIN/BUSINESS_OWNER)
router.put(
  '/operating-context',
  authorize(UserRole.ADMIN, UserRole.BUSINESS_OWNER),
  businessController.updateOperatingContext
);

// GET /business/:id - Obtener business por ID (ADMIN y LOCAL_OPERATOR pueden leer)
router.get('/:id', businessController.getById);

// POST /business - Crear business (solo ADMIN)
router.post(
  '/',
  authorize(UserRole.ADMIN, UserRole.BUSINESS_OWNER),
  upload.single('logo'),
  businessController.create
);

// PUT /business/:id - Actualizar business (solo ADMIN)
router.put(
  '/:id',
  authorize(UserRole.ADMIN, UserRole.BUSINESS_OWNER),
  upload.single('logo'),
  businessController.update
);

// DELETE /business/:id - Eliminar business (solo ADMIN)
router.delete('/:id', authorize(UserRole.ADMIN), businessController.delete);

export default router;
