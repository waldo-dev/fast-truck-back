import { Router } from 'express';
import { authenticate, authorize, validate, validateQuery } from '../../shared/middlewares';
import { UserRole } from '../../shared/database/models/enums';
import { cashRegisterController } from './cash-register.controller';
import {
  openRegisterSchema,
  closeRegisterSchema,
  movementSchema,
  historyQuerySchema,
} from './cash-register.schemas';

const router = Router();

router.use(authenticate);

// Abrir caja
router.post(
  '/cash-registers/open',
  authorize(UserRole.ADMIN, UserRole.BUSINESS_OWNER, UserRole.LOCAL_OPERATOR),
  validate(openRegisterSchema),
  cashRegisterController.open
);

// Cerrar caja
router.post(
  '/cash-registers/:id/close',
  authorize(UserRole.ADMIN, UserRole.BUSINESS_OWNER, UserRole.LOCAL_OPERATOR),
  validate(closeRegisterSchema),
  cashRegisterController.close
);

// Obtener caja activa por negocio/local
router.get(
  '/cash-registers/active',
  authorize(UserRole.ADMIN, UserRole.BUSINESS_OWNER, UserRole.LOCAL_OPERATOR),
  cashRegisterController.getActive
);

// Historial de cajas
router.get(
  '/cash-registers/history',
  authorize(UserRole.ADMIN, UserRole.BUSINESS_OWNER, UserRole.LOCAL_OPERATOR),
  validateQuery(historyQuerySchema),
  cashRegisterController.getHistory
);

// Agregar movimiento
router.post(
  '/cash-registers/:id/movements',
  authorize(UserRole.ADMIN, UserRole.BUSINESS_OWNER, UserRole.LOCAL_OPERATOR),
  validate(movementSchema),
  cashRegisterController.addMovement
);

// Listar movimientos de una caja
router.get(
  '/cash-registers/:id/movements',
  authorize(UserRole.ADMIN, UserRole.BUSINESS_OWNER, UserRole.LOCAL_OPERATOR),
  cashRegisterController.listMovements
);

// Resumen de caja
router.get(
  '/cash-registers/:id/summary',
  authorize(UserRole.ADMIN, UserRole.BUSINESS_OWNER, UserRole.LOCAL_OPERATOR),
  cashRegisterController.getSummary
);

export default router;





