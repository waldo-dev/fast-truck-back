import { Router } from 'express';
import { extractBusinessId } from '../../shared/middlewares';
import { customerController } from './customer.controller';

const router = Router();

// OTP Endpoints (públicos, pero requieren business_id en query, body o header)
router.post('/otp/send', extractBusinessId, customerController.sendOtp);
router.post('/otp/verify', extractBusinessId, customerController.verifyOtp);

// Customer CRUD (requieren autenticación de customer o business)
// Por ahora, estas rutas requieren business_id en el request
// En producción, deberías protegerlas con authenticateCustomer o authenticate según el caso
router.get('/', customerController.getAll);
router.get('/:id', customerController.getById);
router.put('/:id', customerController.update);
router.delete('/:id', customerController.delete);

// Address CRUD
router.get('/:customerId/addresses', customerController.getAllAddresses);
router.get('/:customerId/addresses/:addressId', customerController.getAddressById);
router.post('/:customerId/addresses', customerController.createAddress);
// PUT /customers/addresses/:id (ruta alternativa para compatibilidad)
router.put('/addresses/:id', customerController.updateAddressById);
router.put('/:customerId/addresses/:addressId', customerController.updateAddress);
router.delete('/:customerId/addresses/:addressId', customerController.deleteAddress);

export default router;

