import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { config } from './config';
import { errorHandler } from './middleware/errorHandler';
import routes from './routes';
import prisma from './lib/prisma';

const app = express();

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: 'Demasiadas solicitudes, intente de nuevo más tarde'
  }
});
app.use('/api/', limiter);

// CORS configuration - Allow all origins
app.use(cors({
  origin: true, // Allow all origins
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  optionsSuccessStatus: 200
}));

// Handle preflight requests explicitly
app.options('*', cors());

// Compression middleware
app.use(compression());

// Logging middleware
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use('/api', (req, res, next) => {
  console.log(`📥 ${req.method} ${req.originalUrl}`, req.body ? { body: req.body } : '');
  next();
});

// API routes
app.use('/api', routes);

// Serve static frontend files in production
if (process.env.NODE_ENV === 'production') {
  const path = require('path');
  const frontendPath = path.join(__dirname, '../../frontend/dist');

  // Serve static files
  app.use(express.static(frontendPath));

  // Handle React Router - serve index.html for all non-API routes
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
  });
} else {
  // Root endpoint for development
  app.get('/', (req, res) => {
    res.json({
      success: true,
      message: 'ChequesCloud API - Servidor funcionando correctamente',
      version: '2.0.0',
      timestamp: new Date().toISOString()
    });
  });
}

// 404 handler - only for API routes in production
if (process.env.NODE_ENV !== 'production') {
  app.use('*', (req, res) => {
    res.status(404).json({
      success: false,
      error: 'Endpoint no encontrado',
      path: req.originalUrl
    });
  });
}

// Error handling middleware (must be last)
app.use(errorHandler);

// Database connection and sync
const connectDatabase = async () => {
  try {
    await prisma.$connect();
    console.log('✅ Conectado a la base de datos con Prisma');
    console.log('✅ Prisma Client inicializado');
  } catch (error) {
    console.error('❌ Error en la conexión a la base de datos:', error);
    process.exit(1);
  }
};

// Initialize database connection
connectDatabase();

export default app;