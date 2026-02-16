import { Router } from 'express';
import { authenticate } from '../../shared/middlewares';
import { authController } from './auth.controller';

const router = Router();

router.post('/login', authController.login);
router.get('/me', authenticate, authController.getMe);

export default router;

