import { Router } from 'express';
import { extractBusinessId, validate } from '../../shared/middlewares';
import { publicController } from './public.controller';
import { createOrderSchema } from '../orders/order.schemas';

const router = Router();

// GET /public/menu/template - Plantilla CSV de productos
router.get('/menu/template', publicController.getMenuTemplate);

// Endpoints públicos (solo requieren business_id)
router.use(extractBusinessId);

// GET /public/menu - Menú público (productos + promos)
router.get('/menu', publicController.getMenu);

// POST /public/orders - Crear pedido público
router.post('/orders', extractBusinessId, validate(createOrderSchema), publicController.createOrder);

// GET /public/events - Eventos activos
router.get('/events', publicController.getEvents);

// GET /public/payment-methods - Métodos de pago disponibles
router.get('/payment-methods', publicController.getPaymentMethods);

export default router;


