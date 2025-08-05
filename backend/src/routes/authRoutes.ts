import { Router } from 'express';
import { register, login, getProfile } from '../controllers/authController';
import { validate } from '../middleware/validation';
import { authenticateToken } from '../middleware/auth';
import { registerSchema, loginSchema } from '../validations/authValidation';

const router = Router();

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.get('/profile', authenticateToken, getProfile);

export default router;