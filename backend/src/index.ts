import app from './app';
import { config } from './config';
import { logRoutes } from './utils/routeLogger';

const PORT = config.api.port;

const server = app.listen(PORT, () => {
  console.log(`🚀 Servidor ejecutándose en http://localhost:${PORT}`);
  console.log(`📊 Panel de salud disponible en http://localhost:${PORT}/api/health`);
  console.log(`🔐 API base URL: http://localhost:${PORT}/api`);
  
  // Mostrar todas las rutas disponibles
  logRoutes(app);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM señal recibida: cerrando servidor HTTP');
  server.close(() => {
    console.log('✅ Proceso HTTP terminado');
  });
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT señal recibida: cerrando servidor HTTP');
  server.close(() => {
    console.log('✅ Proceso HTTP terminado');
  });
});