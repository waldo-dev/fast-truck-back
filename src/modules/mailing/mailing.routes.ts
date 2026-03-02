import { Router } from 'express';
import { authenticate, injectBusinessId, authorize } from '../../shared/middlewares';
import { UserRole } from '../../shared/database/models/enums';
import { mailingController } from './mailing.controller';

const router = Router();

router.use(authenticate);
router.use(injectBusinessId);

// Dashboard principal
router.get(
  '/dashboard',
  authorize(UserRole.ADMIN, UserRole.BUSINESS_OWNER, UserRole.LOCAL_OPERATOR),
  mailingController.getDashboard
);

// Listado de campañas
router.get(
  '/campaigns',
  authorize(UserRole.ADMIN, UserRole.BUSINESS_OWNER, UserRole.LOCAL_OPERATOR),
  mailingController.listCampaigns
);

// Crear campaña
router.post(
  '/campaigns',
  authorize(UserRole.ADMIN, UserRole.BUSINESS_OWNER),
  mailingController.createCampaign
);

// Envío masivo inmediato (array de correos + html)
router.post(
  '/send',
  authorize(UserRole.ADMIN, UserRole.BUSINESS_OWNER, UserRole.LOCAL_OPERATOR),
  mailingController.sendBulk
);

export default router;


