import { Router } from 'express';
import {
  getBancos,
  getBancoById,
  createBanco,
  updateBanco,
  deleteBanco
} from '../controllers/bancoController';
import { validate } from '../middleware/validation';
import { authenticateToken } from '../middleware/auth';
import { bancoSchema, updateBancoSchema } from '../validations/bancoValidation';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

router.get('/', getBancos);
router.get('/:id', getBancoById);
router.post('/', validate(bancoSchema), createBanco);
router.put('/:id', validate(updateBancoSchema), updateBanco);
router.delete('/:id', deleteBanco);

export default router;