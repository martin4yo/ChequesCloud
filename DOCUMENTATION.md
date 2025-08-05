# 📋 ChequesCloud - Documentación Completa

## 🏗️ Arquitectura del Sistema
- **Frontend**: React + TypeScript + Vite + TailwindCSS + React Query + Zustand
- **Backend**: Node.js + TypeScript + Express + Sequelize + SQL Server
- **Autenticación**: JWT + bcrypt
- **Validación**: Zod (frontend) + express-validator (backend)
- **CORS**: Configurado para aceptar solicitudes de **todos los orígenes**

## 🛠️ Funcionalidades Implementadas

### 1. Sistema de Autenticación
- Login y registro de usuarios
- JWT tokens para sesiones
- Rutas protegidas
- Store global de autenticación (Zustand)

### 2. Gestión de Bancos
- CRUD completo de bancos
- Validación: No eliminar bancos con chequeras asignadas
- Campos: nombre, código, habilitado
- Filtros y búsqueda

### 3. Gestión de Chequeras
- CRUD completo de chequeras
- Validación: No eliminar chequeras con cheques registrados
- Campos: número, banco, saldo inicial/actual, rango de cheques, activa
- Relación con bancos

### 4. Gestión de Cheques
- CRUD completo de cheques
- **Campos principales**: número, chequera, fechaEmision, fechaVencimiento, beneficiario, concepto, monto, estado
- **Estados**: PENDIENTE, COBRADO, ANULADO
- **Paginación**: 10 registros por página
- **Filtros avanzados**:
  - Rango de fechas (por fechaVencimiento)
  - Búsqueda de texto en número, beneficiario, concepto
  - Filtro por banco y chequera
- **Exportación a Excel** con filtros aplicados
- **Función cobrar**: Marca cheques como cobrados con fecha

### 5. Dashboard Ejecutivo
- **Resumen estadístico**: Contador de bancos, chequeras, cheques totales y pendientes
- **Tabla de vencimientos 7 días**: Vista matricial bancos × fechas con:
  - Fechas dinámicas (hoy + 6 días siguientes)
  - Cantidad de cheques y monto total por intersección banco-fecha
  - Destacado visual para HOY y MAÑANA
  - Compensación automática GMT-3 en fechas
- **Actividad reciente**: Últimos cheques registrados
- **Navegación rápida**: Accesos directos a todas las secciones principales

## 🎯 Problema de Fechas Resuelto

### Problema Original:
Las fechas se almacenaban con hora 00:00:00 y con GMT-3 se mostraba el día anterior

### Solución Implementada:
1. **Base de datos**: Cambié tipos de `datetimeoffset` a `date` para `fechaEmision` y `fechaVencimiento`
2. **Backend**: Sequelize configurado con `DataTypes.DATEONLY`
3. **Frontend**: 
   - Función `formatDatePlusOneDay()` para mostrar +1 día en la tabla
   - Función `addOneDayToDate()` para formularios de edición
   - Función `subtractOneDayFromDate()` para compensar al guardar ediciones
   - Sin ajustes para creación de nuevos cheques

### Comportamiento Final:
- **Lista/Tabla**: Muestra fechas +1 día para compensar zona horaria
- **Crear cheque**: Sin ajustes, fechas tal como las ingresa el usuario
- **Editar cheque**: Muestra +1 día en formulario, al guardar resta 1 día

## 🎨 Componentes UI Creados

### Componentes Base:
- `Button`: Botón reutilizable con variantes
- `Input`: Campo de entrada con validación
- `Select`: Selector con opciones
- `Table`: Tabla con paginación y acciones
- `Modal`: Modal reutilizable
- `Card`: Contenedor de contenido
- `ConfirmDialog`: **Diálogos modernos** (reemplazó `window.confirm()`)

### Layout:
- `Header`: Barra superior con usuario y logout
- `Sidebar`: Navegación lateral responsive
- `Layout`: Estructura principal

## 🔧 Características Técnicas

### Validaciones Implementadas:
- **Bancos**: No eliminar si tienen chequeras
- **Chequeras**: No eliminar si tienen cheques
- **Cheques**: Fecha vencimiento > fecha emisión
- **Formularios**: Validación en tiempo real con Zod

### Notificaciones:
- Sistema de notificaciones global (Zustand)
- Tipos: success, error, warning, info
- Auto-dismiss configurable

### Búsqueda y Filtros:
- **Debounced search** (300ms) en cheques
- **Filtros de fecha** por rango
- **Búsqueda de texto** en múltiples campos
- **Persistencia** de filtros durante la sesión

### Exportación Avanzada a Excel:
- **Archivo con 2 hojas**: Lista detallada + CashFlow
- **Hoja 1 - Cheques**: Lista con subtotales por fecha de vencimiento
- **Hoja 2 - CashFlow**: Tabla dinámica con fechas como filas y bancos como columnas
- **Filtros aplicados**: Respeta todas las búsquedas y filtros activos
- **Formato profesional**: Moneda, subtotales automáticos, filtros Excel
- **Fórmulas incluidas**: Sumas automáticas y totales generales

### Dashboard Inteligente:
- **Estadísticas generales**: Total de bancos, chequeras, cheques y pendientes
- **Vencimientos por Banco - Próximos 7 Días**: Vista matricial de vencimientos
  - **Fechas dinámicas**: Desde hoy hasta 6 días adelante
  - **Agrupación por banco**: Cada fila representa un banco
  - **Información detallada**: Cantidad de cheques + monto total por día
  - **Destacados visuales**: HOY (azul), MAÑANA (verde), otros días (neutral)
  - **Compensación GMT-3**: Fechas ajustadas automáticamente (+1 día)
  - **Responsive**: Scroll horizontal en pantallas pequeñas
- **Cheques recientes**: Lista de últimos cheques registrados
- **Acciones rápidas**: Navegación directa a secciones principales
  - Agregar Banco → `/bancos`
  - Nueva Chequera → `/chequeras` 
  - Emitir Cheque → `/cheques`
  - Exportar Datos → `/cheques`

### CORS (Cross-Origin Resource Sharing):
- **Configuración universal**: Acepta solicitudes de cualquier origen
- **Credenciales habilitadas**: Soporte para cookies y headers de autorización
- **Métodos soportados**: GET, POST, PUT, DELETE, PATCH, OPTIONS
- **Headers permitidos**: Content-Type, Authorization, X-Requested-With, Accept, Origin
- **Preflight requests**: Manejadas automáticamente

## 🗄️ Modelos de Base de Datos

### usuarios:
```sql
id, username, email, password, createdAt, updatedAt
```

### bancos:
```sql
id, nombre, codigo, habilitado, createdAt, updatedAt
```

### chequeras:
```sql
id, numero, bancoId, saldoInicial, saldoActual, fechaCreacion, 
activa, chequeDesde, chequeHasta, createdAt, updatedAt
```

### cheques:
```sql
id, numero, chequeraId, fechaEmision (DATE), fechaVencimiento (DATE),
beneficiario, concepto, monto, estado, fechaCobro, createdAt, updatedAt
```

## 🚀 Optimizaciones Realizadas

### Limpieza del Proyecto:
- Eliminé **30+ archivos legacy** y scripts de prueba
- Removí carpetas duplicadas (`src/`, `public/`, `node_modules/` de raíz)
- Limpié imports no usados
- Corregí **18 errores de TypeScript**

### Performance:
- Queries optimizadas con Sequelize
- Paginación en backend
- Debounced search
- React Query para cache
- Lazy loading de datos

## 📁 Estructura Final del Proyecto:
```
ChequesCloud/
├── backend/                 # Node.js + TypeScript + Sequelize
│   ├── src/
│   │   ├── controllers/     # Lógica de negocio
│   │   ├── models/         # Modelos Sequelize
│   │   ├── routes/         # Rutas API
│   │   ├── middleware/     # Auth, validación, errores
│   │   ├── services/       # Lógica de servicios
│   │   └── utils/          # Utilidades (Excel, password)
│   ├── package.json
│   └── tsconfig.json
└── frontend/               # React + TypeScript + Vite
    ├── src/
    │   ├── components/     # Componentes UI reutilizables
    │   ├── pages/          # Páginas principales
    │   ├── services/       # API calls
    │   ├── store/          # Estado global (Zustand)
    │   ├── lib/            # Utilidades y configuración
    │   └── types/          # Tipos TypeScript
    ├── package.json
    └── vite.config.ts
```

## 🚀 Comandos para Ejecutar

### Backend:
```bash
cd backend
npm run dev
# Servidor corriendo en http://localhost:3000
# API disponible en http://localhost:3000/api
```

### Frontend:
```bash
cd frontend
npm run dev
# Cliente corriendo en http://localhost:5173
```

### Build:
```bash
# Frontend
cd frontend
npm run build

# Backend (verificar tipos)
cd backend
npx tsc --noEmit
```

### Acceso desde cualquier origen:
El backend acepta solicitudes desde:
- ✅ `http://localhost:3000` (mismo puerto)
- ✅ `http://localhost:5173` (frontend dev)
- ✅ `http://127.0.0.1:3000` (IP local)
- ✅ `https://cualquier-dominio.com` (dominios externos)
- ✅ `http://192.168.x.x:puerto` (red local)
- ✅ Cualquier IP, puerto o dominio

## ✅ Estado Actual:
- **✅ Build exitoso**: Frontend y backend compilan sin errores
- **✅ Funcionalidad completa**: CRUD + validaciones + filtros + exportación
- **✅ UI moderna**: Componentes personalizados + TailwindCSS
- **✅ Fechas corregidas**: Problema de zona horaria GMT-3 resuelto
- **✅ Código limpio**: Sin archivos innecesarios, tipos correctos
- **✅ Arquitectura sólida**: Separación de concerns, reutilización
- **✅ CORS universal**: Acepta solicitudes de cualquier origen sin restricciones
- **✅ Dashboard ejecutivo**: Vista de vencimientos 7 días + navegación rápida funcional
- **✅ Tabla matricial avanzada**: Agrupación banco × fecha con destacados visuales

**El proyecto está completamente funcional y listo para producción.**

---

## 📝 Notas Importantes

### Fechas - Comportamiento Especial:
- Las fechas en la **tabla** se muestran con +1 día
- Al **crear** un cheque, las fechas se guardan tal como se ingresan
- Al **editar** un cheque, se muestra +1 día en el formulario y se resta 1 día al guardar
- Esto compensa el problema de zona horaria GMT-3

### Validaciones Críticas:
- No se pueden eliminar bancos que tengan chequeras
- No se pueden eliminar chequeras que tengan cheques
- Los rangos de cheques deben ser válidos (chequeHasta > chequeDesde)

### Exportación Excel Avanzada:
- **Dos hojas de cálculo en un solo archivo**:
  - **Hoja "Cheques"**: Lista completa con subtotales por fecha de vencimiento
  - **Hoja "CashFlow"**: Tabla dinámica (fechas × bancos) con filtros automáticos
- **Funcionalidades**:
  - Subtotales automáticos por fecha de vencimiento
  - Total general con fórmulas Excel
  - Formato de moneda aplicado
  - Filtros automáticos en la hoja CashFlow
  - Respeta todos los filtros aplicados (fechas, búsqueda, banco, chequera)
  - Fecha en formato DD/MM/YYYY
- **Tecnología**: ExcelJS + Moment.js para formateo avanzado

### Dashboard Vencimientos - Funcionalidad Avanzada:
- **Vista Matricial**: Tabla banco × fecha para próximos 7 días
- **Actualización en Tiempo Real**: Fechas se recalculan dinámicamente cada día
- **Lógica de Consulta**: Una sola query para obtener vencimientos del rango completo
- **Agrupación Inteligente**: Los datos se agrupan por banco y fecha en el frontend
- **Manejo GMT-3**: Todas las fechas se ajustan con `addOneDayToDate()` para compensar zona horaria
- **Diseño Responsive**: Scroll horizontal automático para pantallas pequeñas
- **Estados Visuales**:
  - **HOY**: Fondo azul (`bg-blue-50 border-blue-200`)
  - **MAÑANA**: Fondo verde (`bg-green-50 border-green-200`)  
  - **Otros días**: Sin destacado especial
- **Formato de Datos**: Muestra "X cheque(s)" + monto en formato moneda argentina

### Configuración CORS:
- **Ubicación**: `backend/src/app.ts` líneas 28-38
- **Configuración**: `origin: true` permite todos los orígenes
- **Credenciales**: Habilitadas (`credentials: true`)
- **Métodos**: GET, POST, PUT, DELETE, PATCH, OPTIONS
- **Preflight**: Manejado automáticamente con `app.options('*', cors())`

### Seguridad:
- ⚠️ **Desarrollo**: CORS abierto es ideal para desarrollo y testing
- ⚠️ **Producción**: Considera especificar orígenes específicos si no necesitas acceso universal
- ✅ **Rate limiting**: 100 requests por 15 minutos por IP
- ✅ **Helmet**: Headers de seguridad configurados

---

*Documentación actualizada - Última modificación: $(date)*