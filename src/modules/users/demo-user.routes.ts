import { Router } from 'express';
import { validate } from '../../shared/middlewares';
import { userController } from './user.controller';
import { createDemoUserSchema } from './user.schemas';

const router = Router();

router.post('/', validate(createDemoUserSchema), userController.createDemoUser);

export default router;
