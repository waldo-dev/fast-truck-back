import { Customer, CustomerAddress } from '../../shared/database/models';
import { protectResource } from '../../shared/middlewares/businessAccess';
import { Router } from 'express';
import {
  authenticate,
  injectBusinessId,
  validate,
  validateParams,
} from '../../shared/middlewares';
import { customerController } from './customer.controller';
import {
  customerUserParamsSchema,
  createCustomerSchema,
} from './customer.schemas';

const router = Router();

// OTP Endpoints (públicos, pero requieren business_id en query, body o header)
router.post('/otp/send', (_req, res) => {
  res.status(503).json({
    success: false,
    error: {
      message:
        'El acceso por teléfono no está habilitado. Puedes pedir sin iniciar sesión.',
    },
  });
});
router.post('/otp/verify', (_req, res) => {
  res.status(503).json({
    success: false,
    error: { message: 'El acceso por teléfono no está habilitado.' },
  });
});

// GET /customers/by-user/:userId - Listar customers de todos los negocios asociados a un usuario
router.get(
  '/by-user/:userId',
  authenticate,
  validateParams(customerUserParamsSchema),
  customerController.getByUserBusinesses
);
// GET /customers/by-user/:userId/csv - Descargar customers de todos los negocios asociados a un usuario en CSV
router.get(
  '/by-user/:userId/csv',
  authenticate,
  validateParams(customerUserParamsSchema),
  customerController.getByUserBusinessesCsv
);

// Rutas con autenticación y business_id inyectado
router.use(authenticate);
router.use(injectBusinessId);
router.param(
  'customerId',
  protectResource(async id => (await Customer.findByPk(id))?.business_id)
);
router.param(
  'id',
  protectResource(async (id, req) => {
    if (req.path.startsWith('/addresses/')) {
      const address = await CustomerAddress.findByPk(id);
      return address?.customer_id
        ? (await Customer.findByPk(address.customer_id))?.business_id
        : null;
    }
    return (await Customer.findByPk(id))?.business_id;
  })
);

// POST /customers - Crear customer (ADMIN o BUSINESS_OWNER)
router.post(
  '/',
  validate(createCustomerSchema),
  customerController.createForBusiness
);

// Customer CRUD (requieren autenticación de customer o business)
// Por ahora, estas rutas requieren business_id en el request
// En producción, deberías protegerlas con authenticateCustomer o authenticate según el caso
router.get('/', customerController.getAll);
router.get('/:id', customerController.getById);
router.put('/:id', customerController.update);
router.delete('/:id', customerController.delete);

// Address CRUD
router.get('/:customerId/addresses', customerController.getAllAddresses);
router.get(
  '/:customerId/addresses/:addressId',
  customerController.getAddressById
);
router.post('/:customerId/addresses', customerController.createAddress);
// PUT /customers/addresses/:id (ruta alternativa para compatibilidad)
router.put('/addresses/:id', customerController.updateAddressById);
router.put(
  '/:customerId/addresses/:addressId',
  customerController.updateAddress
);
router.delete(
  '/:customerId/addresses/:addressId',
  customerController.deleteAddress
);

export default router;
