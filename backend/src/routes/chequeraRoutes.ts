import { Router } from 'express';
import {
  getChequeras,
  getChequeraById,
  createChequera,
  updateChequera,
  deleteChequera,
  getChequerasActivas
} from '../controllers/chequeraController';
import { validate } from '../middleware/validation';
import { authenticateToken } from '../middleware/auth';
import { chequeraSchema, updateChequeraSchema } from '../validations/chequeraValidation';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

router.get('/', getChequeras);
router.get('/activas', getChequerasActivas);
router.get('/:id', getChequeraById);
router.post('/', validate(chequeraSchema), createChequera);
router.put('/:id', validate(updateChequeraSchema), updateChequera);
router.delete('/:id', deleteChequera);

export default router;