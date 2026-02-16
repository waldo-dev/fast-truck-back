import { Router } from 'express';
import { extractBusinessId } from '../../shared/middlewares';
import { publicController } from './public.controller';

const router = Router();

// Endpoints públicos (solo requieren business_id)
router.use(extractBusinessId);

// GET /public/menu - Menú público (productos + promos)
router.get('/menu', publicController.getMenu);

// GET /public/events - Eventos activos
router.get('/events', publicController.getEvents);

// GET /public/payment-methods - Métodos de pago disponibles
router.get('/payment-methods', publicController.getPaymentMethods);

export default router;

