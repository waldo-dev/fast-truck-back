import { Router } from 'express';
import { authenticate, authorize, injectBusinessId } from '../../shared/middlewares';
import { UserRole } from '../../shared/database/models/enums';
import { businessController } from './business.controller';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);
router.use(injectBusinessId);

// GET /businesses - Listar businesses (ADMIN y STAFF pueden leer)
router.get('/', businessController.getAll);

// GET /businesses/:id - Obtener business por ID (ADMIN y STAFF pueden leer)
router.get('/:id', businessController.getById);

// POST /businesses - Crear business (solo ADMIN)
router.post('/', authorize(UserRole.ADMIN), businessController.create);

// PUT /businesses/:id - Actualizar business (solo ADMIN)
router.put('/:id', authorize(UserRole.ADMIN), businessController.update);

// DELETE /businesses/:id - Eliminar business (solo ADMIN)
router.delete('/:id', authorize(UserRole.ADMIN), businessController.delete);

export default router;


