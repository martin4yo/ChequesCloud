import { Router } from 'express';
import authRoutes from './authRoutes';
import bancoRoutes from './bancoRoutes';
import chequeraRoutes from './chequeraRoutes';
import chequeRoutes from './chequeRoutes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/bancos', bancoRoutes);
router.use('/chequeras', chequeraRoutes);
router.use('/cheques', chequeRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API funcionando correctamente',
    timestamp: new Date().toISOString()
  });
});

export default router;