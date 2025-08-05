import { Application } from 'express';

interface RouteInfo {
  method: string;
  path: string;
  handler: string;
}

/**
 * Extrae todas las rutas definidas en la aplicación Express
 */
export function extractRoutes(app: Application): RouteInfo[] {
  const routes: RouteInfo[] = [];

  // Función recursiva para extraer rutas de los routers
  function extractFromRouter(router: any, basePath = '') {
    if (!router || !router.stack) return;

    router.stack.forEach((layer: any) => {
      if (layer.route) {
        // Ruta directa
        const methods = Object.keys(layer.route.methods);
        methods.forEach(method => {
          routes.push({
            method: method.toUpperCase(),
            path: basePath + layer.route.path,
            handler: layer.route.stack[0]?.handle?.name || 'anonymous'
          });
        });
      } else if (layer.name === 'router') {
        // Sub-router
        const match = layer.regexp.source.match(/^\^\\?\/?(.+?)\\\//);
        const subPath = match ? `/${match[1]}` : '';
        extractFromRouter(layer.handle, basePath + subPath);
      }
    });
  }

  // Extraer rutas de la aplicación principal
  extractFromRouter(app._router);

  return routes.sort((a, b) => a.path.localeCompare(b.path));
}

/**
 * Muestra todas las rutas en la consola de forma organizada
 */
export function logRoutes(app: Application) {
  const routes = extractRoutes(app);
  
  if (routes.length === 0) {
    console.log('⚠️  No se encontraron rutas definidas');
    return;
  }

  console.log('\n📋 RUTAS DISPONIBLES:');
  console.log('='.repeat(50));
  
  // Agrupar rutas por prefijo
  const groupedRoutes: { [key: string]: RouteInfo[] } = {};
  
  routes.forEach(route => {
    const pathParts = route.path.split('/').filter(Boolean);
    const group = pathParts.length > 0 ? `/${pathParts[0]}` : '/';
    
    if (!groupedRoutes[group]) {
      groupedRoutes[group] = [];
    }
    groupedRoutes[group].push(route);
  });

  // Mostrar rutas agrupadas
  Object.keys(groupedRoutes).sort().forEach(group => {
    console.log(`\n🔗 ${group}:`);
    groupedRoutes[group].forEach(route => {
      const methodColor = getMethodColor(route.method);
      console.log(`  ${methodColor}%-6s\x1b[0m %s`, route.method, route.path);
    });
  });

  console.log(`\n✅ Total de rutas: ${routes.length}`);
  console.log('='.repeat(50));
}

/**
 * Obtiene el color ANSI para cada método HTTP
 */
function getMethodColor(method: string): string {
  const colors: { [key: string]: string } = {
    'GET': '\x1b[32m',     // Verde
    'POST': '\x1b[33m',    // Amarillo
    'PUT': '\x1b[34m',     // Azul
    'DELETE': '\x1b[31m',  // Rojo
    'PATCH': '\x1b[35m',   // Magenta
    'OPTIONS': '\x1b[36m', // Cian
    'HEAD': '\x1b[37m'     // Blanco
  };
  
  return colors[method] || '\x1b[0m'; // Default sin color
}