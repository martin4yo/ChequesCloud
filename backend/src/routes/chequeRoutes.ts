import { Router } from 'express';
import {
  getCheques,
  getChequeById,
  createCheque,
  updateCheque,
  deleteCheque,
  marcarComoCobrado,
  exportChequesToExcel
} from '../controllers/chequeController';
import { validate } from '../middleware/validation';
import { authenticateToken } from '../middleware/auth';
import { chequeSchema, updateChequeSchema } from '../validations/chequeValidation';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

router.get('/', getCheques);
// IMPORTANT: Define /export route BEFORE /:id to avoid route conflicts
router.get('/export', exportChequesToExcel);
router.get('/:id', getChequeById);
router.post('/', validate(chequeSchema), createCheque);
router.put('/:id', validate(updateChequeSchema), updateCheque);
router.patch('/:id/cobrar', marcarComoCobrado);
router.delete('/:id', deleteCheque);

export default router;