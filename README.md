# 🚀 POS-VENTA-SIS: Sistema de Punto de Venta e Inventario

**POS-VENTA-SIS** es una aplicación de escritorio profesional diseñada para pequeños y medianos comercios. Combina la potencia de **Electron** con la reactividad de **React 19** y la robustez de **SQLite** con **Prisma ORM** para ofrecer un control total sobre las ventas, el stock y el flujo de caja en un entorno local seguro.

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
- **Soporte para Impresoras Térmicas:** Ticket optimizado para impresión.

### 3. 🏦 Control de Caja (Cash Management)
- **Seguridad Contable:** Bloqueo automático de ventas si no se ha realizado la apertura de caja.
- **Gestión de Turnos:** Apertura con fondo inicial y arqueo de caja al cierre.
- **Conciliación:** Cálculo automático de diferencias (Sobrantes/Faltantes).
- **Resumen Diario:** Estadísticas completas por caja y método de pago.
- **Historial de Cierres:** Auditoría completa de todas las cajas cerradas para administradores.
- **Cálculo de Esperado:** Fondo inicial + Ventas totales vs. Real.

### 4. 📦 Gestión Completa de Inventario
- **CRUD de Productos:** Crear, leer, actualizar y eliminar productos.
- **Control de Stock:**
  - Añadir stock (ENTRADA - Compras, Ajustes)
  - Reducir stock (SALIDA - Ventas, Roturas)
  - Alertas de stock bajo automáticas
  - Historial completo de movimientos con filtro por producto
- **Categorías:** Organización de productos por categorías.
- **Búsqueda Avanzada:** Filtrar por nombre, SKU o descripción.
- **Movimientos de Inventario:** Auditoría completa de entradas y salidas (Solo Admin).

### 5. 👥 Gestión de Clientes
- **CRUD Completo:** Crear, leer, actualizar y eliminar clientes.
- **Búsqueda Inteligente:** Por DNI, nombre, código o RUC.
- **Validación de Datos:** Prevención de duplicados.
- **Historial de Compras:** Seguimiento de ventas por cliente.

### 6. 👤 Gestión de Usuarios y Seguridad
- **Autenticación Segura:** Login con bcrypt.
- **Control de Roles:** Administrador y Vendedor.
- **Protección de Rutas:** Los vendedores no pueden acceder a módulos administrativos (Categorías, Usuarios, Movimientos, Cierres, Ajustes).
- **Auditoría Completa:** Registro de todas las acciones críticas en `audit_logs`.
- **Gestión de Usuarios:** Crear, editar, cambiar contraseña y eliminar usuarios (Solo Admin).

### 7. ⚙️ UI/UX Moderna
- **Temas Oscuros:** Interfaz elegante con colores suaves.
- **Sidebar Colapsable:** Con atajo de teclado `Ctrl+B`.
- **Skeleton Loaders:** Feedback visual durante la carga de datos.
- **Empty States:** Mensajes amigables cuando no hay datos.
- **Micro-interacciones:** Animaciones suaves con Framer Motion.
- **Lazy Loading:** Carga diferida de páginas para mejor rendimiento.
- **Caché Inteligente:** Uso de Zustand para categorías y configuraciones.

---

## 🛠️ Stack Tecnológico

### Backend (Electron Main Process)
- **Runtime:** Electron (Node.js)
- **Language:** TypeScript (strict mode)
- **ORM:** Prisma 6.2.1
- **Database:** SQLite (WAL mode optimizado)
- **Validation:** Zod
- **Authentication:** bcryptjs

### Frontend (Renderer Process)
- **Framework:** React 19
- **Language:** TypeScript
- **Styling:** Tailwind CSS + Material UI (MUI)
- **State Management:** Zustand (con persistencia)
- **Routing:** React Router DOM v7
- **Charts:** Recharts
- **Animations:** Framer Motion
- **UI Icons:** Lucide React
- **PDF Generation:** jsPDF + jsPDF-AutoTable

### Build & Dev Tools
- **Bundler:** Vite 8
- **Electron Integration:** vite-plugin-electron
- **Linter:** ESLint

---

## 📋 Requisitos Previos

- **Node.js** 18 o superior
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

### 3. Configurar SQLite
SQLite viene integrado con el proyecto, solo asegurate de que el archivo `dev.sqlite3` se genere en la carpeta `prisma/`.

### 4. Ejecutar Migraciones
```bash
# Generar Prisma Client
npm run db:generate

# Ejecutar migraciones
npm run db:migrate

# (Opcional) Poblar con datos de prueba
npm run db:seed
```

### 5. Iniciar la Aplicación
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
│   └── pages/           # Frontend React (Páginas)
│       ├── Dashboard.tsx
│       ├── Sales.tsx
│       ├── SalesHistory.tsx
│       ├── Products.tsx
│       ├── Categories.tsx
│       ├── Clients.tsx
│       ├── Cash.tsx
│       ├── CashHistory.tsx
│       ├── InventoryMovements.tsx
│       ├── Users.tsx
│       └── Settings.tsx
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
- ✅ **Control de Roles:** Admin vs Vendedor
- ✅ **Rutas Protegidas:** Ocultas para vendedores
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

### Categories
```javascript
ipcRenderer.invoke('categories:getAll', search)
ipcRenderer.invoke('categories:getById', id)
ipcRenderer.invoke('categories:create', data, userId)
ipcRenderer.invoke('categories:update', id, data, userId)
ipcRenderer.invoke('categories:delete', id, userId)
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

### Inventory Movements
```javascript
ipcRenderer.invoke('movements:getAll')
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
- **settings** - Configuraciones del sistema

### Optimizaciones
- ✅ Índices en columnas de búsqueda frecuente
- ✅ Índices compuestos para filtros combinados
- ✅ Restricciones de unicidad en campos clave
- ✅ Eliminación en cascada donde corresponde
- ✅ SQLite WAL mode + caché optimizada

---

## 🚀 Próximas Mejoras (Roadmap)

### 1. **Módulo de Proveedores y Compras (Crítico)**
   - Crear tabla `suppliers` (Proveedores)
   - Crear tabla `purchases` (Compras/Órdenes)
   - Al recibir compra, incrementar stock automáticamente
   - Generar movimiento de inventario tipo `COMPRA`
   - Cálculo de costo de mercancía vendida

### 2. **Exportación de Reportes**
   - Botón para exportar Dashboard a PDF
   - Reporte contable de cierre de caja en PDF
   - Exportar historial de ventas a Excel/PDF
   - Tickets personalizables para impresoras térmicas

### 3. **Gestión de Impuestos (Fiscal)**
   - Agregar campos de `tax_rate` en Settings
   - Modificar ventas para desglosar: `subtotal`, `tax_amount`, `total`
   - Mostrar desglose de impuestos en tickets

### 4. **Módulo de Auditoría Visual (Admin)**
   - Crear página `/audit-logs` (Solo Admin)
   - Mostrar tabla: Usuario, Acción, Entidad, Fecha
   - Filtros por usuario y rango de fechas

### 5. **Respaldo de Seguridad (Backup)**
   - Botón en Ajustes para "Descargar Copia de Seguridad"
   - Botón para "Restaurar Copia" (importar .sqlite3)
   - Respaldo automático al iniciar el día o al cerrar caja

### 6. **Frontend (UX)**
   - Implementar validación Zod en todos los formularios
   - Mejorar estados de carga y feedback visual
   - Optimizar diseño responsive para tablets
   - Notificaciones push para alertas de stock

### 7. **Backend (Performance)**
   - Implementar caché para métricas de dashboard
   - Agregar pagination en listas grandes
   - Optimizar consultas con Prisma (select explícito ya implementado)
   - Soporte para múltiples cajas simultáneas

---

## 📊 Fase Actual del Proyecto

**Fase:** MVP Completo + Maduración (Beta Funcional)

El proyecto ha superado la fase de "Prototipo" y se encuentra en **Desarrollo Avanzado**. Está listo para ser usado en un entorno real de bajo/moderado tráfico (mono-usuario), pero le faltan módulos administrativos clave para considerarse un sistema empresarial completo.

| Área | Estado |
|------|--------|
| **Base Técnica** | ✅ Sólida (Electron, React, Prisma, SQLite) |
| **UI/UX** | ✅ Moderna (MUI, Framer Motion, Skeletons) |
| **Seguridad** | ✅ Roles (Admin/Vendedor), Auditoría, Rate Limiting, Validación de contraseñas |
| **Ventas** | ✅ Funcional (POS, Historial, Caja) |
| **Inventario** | ⚠️ Básico (Falta gestión de proveedores) |
| **Reportes** | ⚠️ En progreso (Falta exportación PDF) |

---

## 🔒 Arquitectura de Seguridad

### Autenticación y Control de Acceso
- **Hash de contraseñas:** bcryptjs con salt rounds=10.
- **Rate Limiting:** Bloqueo de login tras 5 intentos fallidos por usuario durante 15 minutos (en memoria).
- **Política de contraseñas:** Mínimo 8 caracteres, mayúscula, minúscula, número y carácter especial.
- **Roles:** ADMIN y VENDEDOR. Los handlers IPC verifican el rol antes de ejecutar operaciones sensibles.

### Validación de Datos
- **Zod schemas:** Toda entrada del renderer se valida contra esquemas tipados antes de procesarse.
- **Path traversal:** Las operaciones de archivo (backups) validan que las rutas estén dentro del directorio permitido mediante `isPathWithin()`.

### Protección de Stock
- **3 capas de defensa:** Validación en servicio (`ProductService.removeStock`), condición atómica en repositorio (`PrismaProductRepository.updateStock` con `stock >= quantity`), y verificación post-actualización.

### Prácticas de Desarrollo Seguro
- **eslint-plugin-security:** Reglas de seguridad automáticas en CI.
- **Dependencias:** Auditoría regular con `npm audit`.
- **Secreto en entorno:** `DATABASE_URL` y credenciales solo en `.env` (excluido del repositorio via `.gitignore`).

---

## 📝 Licencia

Proyecto privado - Todos los derechos reservados

---

## 🆘 Soporte

Para problemas o preguntas:
1. Revisar issues del repositorio
2. Consultar documentación de Prisma
3. Contactar al equipo de desarrollo
