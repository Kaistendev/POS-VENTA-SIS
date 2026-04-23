# 🚀 POS-VENTA-SIS: Sistema de Punto de Venta e Inventario

**POS-VENTA-SIS** es una aplicación de escritorio profesional diseñada para pequeños y medianos comercios. Combina la potencia de **Electron** con la reactividad de **React 19** y la robustez de **PostgreSQL** con **Prisma ORM** para ofrecer un control total sobre las ventas, el stock y el flujo de caja en un entorno local seguro.

---

## ✨ Características Principales

### 1. 📊 Dashboard Inteligente y Reportes
- **Métricas en Tiempo Real:** Visualización de ingresos diarios, ganancias, número de ventas, productos activos y clientes.
- **Gráficos de Tendencias:** Histórico de ventas de los últimos 7 días (personalizable).
- **Alertas de Inventario:** Detección automática de productos con stock bajo.
- **Reportes Avanzados:**
  - Ventas por método de pago (Efectivo/Tarjeta)
  - Top productos más vendidos
  - Top clientes por compras
  - Distribución de ventas por hora
  - Resumen de cajas registradoras
  - Métricas completas de inventario

### 2. 💳 Terminal de Ventas (POS)
- **Carrito Dinámico:** Gestión fluida de productos en el ticket (añadir, quitar, actualizar cantidades).
- **Clientes Flexibles:** Permite buscar clientes existentes o registrar nuevos "al vuelo" sin salir de la pantalla de venta.
- **Métodos de Pago:** Diferenciación entre pagos en Efectivo y Tarjeta.
- **Validación de Stock:** Impide ventas si no hay stock suficiente.
- **Tickets Profesionales:** Generación automática de tickets en PDF.
- **Cancelación de Ventas:** Restaura automáticamente el stock.

### 3. 🏦 Control de Caja (Cash Management)
- **Seguridad Contable:** Bloqueo automático de ventas si no se ha realizado la apertura de caja.
- **Gestión de Turnos:** Apertura con fondo inicial y arqueo de caja al cierre.
- **Conciliación:** Cálculo automático de diferencias (Sobrantes/Faltantes).
- **Resumen Diario:** Estadísticas completas por caja y método de pago.

### 4. 📦 Gestión Completa de Inventario
- **CRUD de Productos:** Crear, leer, actualizar y eliminar productos.
- **Control de Stock:**
  - Añadir stock (ENTRADA)
  - Reducir stock (SALIDA)
  - Alertas de stock bajo automáticas
  - Historial completo de movimientos
- **Categorías:** Organización de productos por categorías.
- **Búsqueda Avanzada:** Filtrar por nombre, SKU o descripción.

### 5. 👥 Gestión de Clientes
- **CRUD Completo:** Crear, leer, actualizar y eliminar clientes.
- **Búsqueda Inteligente:** Por DNI, nombre, código o RUC.
- **Validación de Datos:** Prevención de duplicados.
- **Historial de Compras:** Seguimiento de ventas por cliente.

### 6. 👤 Gestión de Usuarios
- **Autenticación Segura:** Login con bcrypt.
- **Control de Roles:** Administrador y usuario estándar.
- **Auditoría Completa:** Registro de todas las acciones críticas.

---

## 🛠️ Stack Tecnológico

### Backend (Electron Main Process)
- **Runtime:** Electron (Node.js)
- **Language:** TypeScript (strict mode)
- **ORM:** Prisma 7.7.0
- **Database:** PostgreSQL
- **Validation:** Zod
- **Authentication:** bcryptjs

### Frontend (Renderer Process)
- **Framework:** React 19
- **Language:** TypeScript
- **Styling:** Tailwind CSS + Material UI
- **State Management:** Zustand
- **Routing:** React Router DOM v7
- **Charts:** Recharts
- **Animations:** Framer Motion
- **UI Icons:** Lucide React

### Build & Dev Tools
- **Bundler:** Vite
- **Electron Integration:** vite-plugin-electron
- **Linter:** ESLint
- **Database Management:** Prisma Studio

---

## 📋 Requisitos Previos

- **Node.js** 18 o superior
- **PostgreSQL** 14 o superior
- **npm** o **yarn**

---

## 🚀 Instalación y Configuración

### 1. Clonar el Repositorio
```bash
git clone <repository-url>
cd POS-VENTA-SIS
```

### 2. Instalar Dependencias
```bash
npm install
```

### 3. Configurar PostgreSQL

Crear un archivo `.env` en la raíz del proyecto:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/pos_venta_sis"
```

Reemplazar:
- `username`: Tu usuario de PostgreSQL
- `password`: Tu contraseña de PostgreSQL
- `pos_venta_sis`: Nombre de la base de datos (crearla primero)

### 4. Crear la Base de Datos
```bash
# Conectarse a PostgreSQL
psql -U username

# Crear la base de datos
CREATE DATABASE pos_venta_sis;
\q
```

### 5. Ejecutar Migraciones
```bash
# Generar Prisma Client
npm run db:generate

# Ejecutar migraciones
npm run db:migrate

# (Opcional) Poblar con datos de prueba
npm run db:seed
```

### 6. Iniciar la Aplicación
```bash
npm run dev
```

---

## 📚 Comandos Útiles

### Desarrollo
```bash
npm run dev              # Iniciar en modo desarrollo
```

### Base de Datos
```bash
npm run db:generate      # Generar Prisma Client
npm run db:migrate       # Ejecutar migraciones (desarrollo)
npm run db:migrate:deploy # Ejecutar migraciones (producción)
npm run db:seed          # Poblar base de datos
npm run db:studio        # Abrir Prisma Studio (GUI)
npm run db:reset         # Resetear base de datos (⚠️ elimina datos)
npm run db:validate      # Validar esquema Prisma
```

### Build
```bash
npm run build            # Compilar para producción
npm run preview          # Previsualizar build
npm run lint             # Ejecutar linter
```

---

## 🏗️ Arquitectura

### Estructura del Proyecto
```
POS-VENTA-SIS/
├── src/
│   ├── common/           # Tipos y esquemas compartidos (Zod)
│   │   ├── types.ts      # Interfaces TypeScript
│   │   └── schemas.ts    # Esquemas de validación Zod
│   ├── main/             # Proceso principal de Electron
│   │   ├── index.ts      # Punto de entrada
│   │   ├── ipc.ts        # Manejadores IPC
│   │   ├── services/     # Lógica de negocio
│   │   ├── repositories/ # Capa de acceso a datos (Prisma)
│   │   └── prisma/       # Cliente Prisma
│   ├── preload/          # Scripts de precarga de Electron
│   └── renderer/         # Frontend React
├── prisma/
│   ├── schema.prisma     # Esquema de base de datos
│   ├── migrations/       # Migraciones
│   └── seed.ts           # Datos de prueba
└── package.json
```

### Patrón de Diseño
**Arquitectura en Capas:**
1. **Capa IPC** (`ipc.ts`) - Comunicación Electron
2. **Capa de Servicios** (`services/`) - Lógica de negocio y validación
3. **Capa de Repositorios** (`repositories/`) - Acceso a datos con Prisma
4. **Capa Común** (`common/`) - Tipos y esquemas compartidos

---

## 🔐 Seguridad

- ✅ **Context Isolation** habilitado en Electron
- ✅ **Node Integration** deshabilitado
- ✅ **Contraseñas hasheadas** con bcryptjs
- ✅ **Validación de entradas** con Zod
- ✅ **Auditoría completa** de todas las acciones críticas
- ✅ **Variables de entorno** para datos sensibles

---

## 🎯 IPC Endpoints Disponibles

### Health Check
```javascript
ipcRenderer.invoke('health:check')
```

### Dashboard
```javascript
ipcRenderer.invoke('dashboard:getStats', startDate, endDate)
ipcRenderer.invoke('dashboard:getWeeklySales', days)
ipcRenderer.invoke('dashboard:getLowStock', limit)
ipcRenderer.invoke('dashboard:getSalesByPayment', startDate, endDate)
ipcRenderer.invoke('dashboard:getTopProducts', limit, startDate, endDate)
ipcRenderer.invoke('dashboard:getTopClients', limit, startDate, endDate)
ipcRenderer.invoke('dashboard:getSalesByHour', startDate, endDate)
ipcRenderer.invoke('dashboard:getCashSummary', startDate, endDate)
ipcRenderer.invoke('dashboard:getInventoryMetrics')
ipcRenderer.invoke('dashboard:invalidateCache')
```

### Cash Register
```javascript
ipcRenderer.invoke('cash:getOpen')
ipcRenderer.invoke('cash:getAll', startDate, endDate)
ipcRenderer.invoke('cash:getDetails', registerId)
ipcRenderer.invoke('cash:getDailySummary', registerId)
ipcRenderer.invoke('cash:open', openingAmount, userId)
ipcRenderer.invoke('cash:close', registerId, closingAmount, userId)
```

### Clients
```javascript
ipcRenderer.invoke('clients:getAll', search)
ipcRenderer.invoke('clients:getById', id)
ipcRenderer.invoke('clients:create', data, userId)
ipcRenderer.invoke('clients:update', id, data, userId)
ipcRenderer.invoke('clients:delete', id, userId)
```

### Products
```javascript
ipcRenderer.invoke('products:getAll', search, categoryId)
ipcRenderer.invoke('products:getById', id)
ipcRenderer.invoke('products:getLowStock')
ipcRenderer.invoke('products:create', data, userId)
ipcRenderer.invoke('products:update', id, data, userId)
ipcRenderer.invoke('products:delete', id, userId)
ipcRenderer.invoke('products:addStock', productId, quantity, userId)
ipcRenderer.invoke('products:removeStock', productId, quantity, userId)
ipcRenderer.invoke('products:getMovements', productId, limit)
```

### Categories
```javascript
ipcRenderer.invoke('categories:getAll', search)
ipcRenderer.invoke('categories:getById', id)
ipcRenderer.invoke('categories:create', data, userId)
ipcRenderer.invoke('categories:update', id, data, userId)
ipcRenderer.invoke('categories:delete', id, userId)
```

### Sales
```javascript
ipcRenderer.invoke('sales:getAll', startDate, endDate, clientId, registerId)
ipcRenderer.invoke('sales:getToday')
ipcRenderer.invoke('sales:getStats', startDate, endDate)
ipcRenderer.invoke('sales:getDetails', saleId)
ipcRenderer.invoke('sales:register', saleData, itemsData, userId)
ipcRenderer.invoke('sales:cancel', saleId, userId)
```

### Users
```javascript
ipcRenderer.invoke('users:getAll')
ipcRenderer.invoke('users:getById', id)
ipcRenderer.invoke('users:create', data, createdBy)
ipcRenderer.invoke('users:update', id, data, updatedBy)
ipcRenderer.invoke('users:delete', id, deletedBy)
ipcRenderer.invoke('users:changePassword', userId, newPassword, changedBy)
```

---

## 📊 Base de Datos

### Tablas Principales
- **users** - Usuarios del sistema
- **clients** - Clientes
- **categories** - Categorías de productos
- **products** - Productos
- **cash_registers** - Cajas registradoras
- **sales** - Ventas
- **sale_items** - Detalle de ventas
- **inventory_movements** - Movimientos de inventario
- **audit_logs** - Registro de auditoría

### Optimizaciones
- ✅ Índices en columnas de búsqueda frecuente
- ✅ Índices compuestos para filtros combinados
- ✅ Restricciones de unicidad en campos clave
- ✅ Eliminación en cascada donde corresponde

---

## 🚀 Próximas Mejoras (Roadmap)

1. **Frontend:**
   - Implementar validación Zod en todos los formularios
   - Mejorar estados de carga y feedback
   - Optimizar diseño responsive
   - Exportar reportes a PDF/Excel

2. **Backend:**
   - Implementar caché Redis para métricas
   - Agregar pagination en listas grandes
   - Optimizar consultas con Prisma

3. **Testing:**
   - Tests unitarios para servicios
   - Tests de integración para Prisma
   - Tests E2E para flujos críticos

---

## 📝 Licencia

Proyecto privado - Todos los derechos reservados

---

## 🆘 Soporte

Para problemas o preguntas:
1. Revisar issues del repositorio
2. Consultar documentación de Prisma
3. Contactar al equipo de desarrollo
