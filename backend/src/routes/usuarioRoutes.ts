import { Router } from 'express';
import {
  getUsuarios,
  getUsuarioById,
  createUsuario,
  updateUsuario,
  toggleUsuarioActivo,
  reenviarEmailCambioPassword,
  deleteUsuario
} from '../controllers/usuarioController';
import { validate } from '../middleware/validation';
import { authenticateToken } from '../middleware/auth';
import { usuarioSchema, updateUsuarioSchema } from '../validations/usuarioValidation';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

router.get('/', getUsuarios);
router.get('/:id', getUsuarioById);
router.post('/', validate(usuarioSchema), createUsuario);
router.put('/:id', validate(updateUsuarioSchema), updateUsuario);
router.patch('/:id/toggle-activo', toggleUsuarioActivo);
router.post('/:id/reenviar-email', reenviarEmailCambioPassword);
router.delete('/:id', deleteUsuario);

export default router;