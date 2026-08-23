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
  - **Generación automática de deuda:** al aumentar stock con razón "Compra", si el producto tiene proveedor se crea una cuenta por pagar por `cantidad × precio de compra`
- **Categorías:** Organización de productos por categorías.
- **Búsqueda Avanzada:** Filtrar por nombre, SKU o descripción.
- **Movimientos de Inventario:** Auditoría completa de entradas y salidas (Solo Admin).

### 5. 🏭 Proveedores, Compras y Cuentas por Pagar
- **CRUD de Proveedores** con validación de RUC duplicado.
- **Órdenes de Compra:** creación, recepción (incrementa stock automáticamente), cancelación.
- **Cuentas por Pagar:**
  - Columna de deuda por proveedor en el módulo Proveedores
  - Pagos totales o parciales con aplicación **FIFO** (compras más antiguas primero)
  - **Validación de saldo:** solo se puede pagar si la empresa tiene saldo positivo (ingresos por ventas/aperturas − pagos realizados)
  - Historial completo de pagos en `supplier_payments`
  - **Factura de compra en PDF:** qué se compró, cuándo y estado de los pagos con historial
  - **Recibo de pago en PDF** generado automáticamente al registrar un pago

### 6. 🧮 Módulo de Contabilidad (Admin)
- **Saldo disponible de la empresa:** ingresos históricos (aperturas de caja + ventas) − pagos a proveedores.
- **Deudas por pagar:** total consolidado y detalle por proveedor con pago directo desde el módulo.
- **Proyección de ganancias brutas:** ingreso potencial del inventario actual − costo del inventario, con margen %.
- **Referencia en bolívares:** todos los montos muestran su equivalente usando la tasa de cambio del día configurada en Ajustes (`exchange_rate_usd_ves`).

### 7. 👥 Gestión de Clientes
- **CRUD Completo:** Crear, leer, actualizar y eliminar clientes.
- **Búsqueda Inteligente:** Por DNI, nombre, código o RUC.
- **Validación de Datos:** Prevención de duplicados.
- **Historial de Compras:** Seguimiento de ventas por cliente.

### 8. 👤 Gestión de Usuarios y Seguridad
- **Autenticación Segura:** Login con bcrypt.
- **Control de Roles:** Administrador y Vendedor.
- **Protección de Rutas:** Los vendedores no pueden acceder a módulos administrativos (Categorías, Usuarios, Movimientos, Cierres, Descuentos, Reportes, Contabilidad).
- **Auditoría Completa:** Registro de todas las acciones críticas en `audit_logs`.
- **Gestión de Usuarios:** Crear, editar, cambiar contraseña y eliminar usuarios (Solo Admin).

### 9. 📄 Reportes y Documentos PDF/Excel
- **Reportes configurables:** ventas del día/resumen, ganancias, inventario, stock bajo, top productos, comprobantes y cierres de caja.
- **Exportación PDF y Excel** con diálogo de guardado.
- **Reportes automáticos programados:** diario y semanal guardados en la carpeta `reports/` del proyecto.
- **Fechas correctas por zona horaria:** los rangos se calculan en hora local para no excluir ventas del día.

### 10. ⚙️ UI/UX Moderna
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
- **ORM:** Prisma 7 (driver adapter `better-sqlite3`, versión fijada)
- **Database:** SQLite (WAL mode optimizado)
- **Validation:** Zod
- **Authentication:** bcryptjs
- **Logging:** Pino

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
- **pnpm**

---

## 🚀 Instalación y Configuración

### 1. Clonar el Repositorio
```bash
git clone <repository-url>
cd POS-VENTA-SIS
```

### 2. Instalar Dependencias
```bash
pnpm install
```

> **Nota sobre `better-sqlite3`:** la versión está fijada en `package.json` y el `postinstall` recompila automáticamente el módulo nativo para **Electron** (necesario porque Electron usa un ABI distinto al de Node). Si ejecutas los tests con Node (vitest) justo después de instalar, corre antes:
> ```bash
> node scripts/rebuild-electron.mjs restore   # recompila para Node
> node scripts/rebuild-electron.mjs electron  # recompila para Electron (para pnpm run dev)
> ```

### 3. Configurar SQLite
SQLite viene integrado con el proyecto, solo asegurate de que el archivo `dev.sqlite3` se genere en la carpeta `prisma/`.

### 4. Ejecutar Migraciones
```bash
# Generar Prisma Client
pnpm run db:generate

# Ejecutar migraciones
pnpm run db:migrate

# (Opcional) Poblar con datos de prueba
pnpm run db:seed
```

### 5. Iniciar la Aplicación
```bash
pnpm run dev
```

---

## 📚 Comandos Útiles

### Desarrollo
```bash
pnpm run dev              # Iniciar en modo desarrollo
```

### Base de Datos
```bash
pnpm run db:generate      # Generar Prisma Client
pnpm run db:migrate       # Ejecutar migraciones (desarrollo)
pnpm run db:migrate:deploy # Ejecutar migraciones (producción)
pnpm run db:seed          # Poblar base de datos
pnpm run db:studio        # Abrir Prisma Studio (GUI)
pnpm run db:reset         # Resetear base de datos (⚠️ elimina datos)
pnpm run db:validate      # Validar esquema Prisma
```

### Build
```bash
pnpm run build            # Compilar para producción
pnpm run lint             # Ejecutar linter
```

---

## 🏗️ Arquitectura

### Estructura del Proyecto
```
POS-VENTA-SIS/
├── src/
│   ├── backend/            # Proceso principal de Electron
│   │   ├── index.ts        # Punto de entrada
│   │   ├── ipc.ts          # Manejadores IPC (~85 canales)
│   │   ├── auth/           # Sesión, autorización por rol, rate limiting
│   │   ├── di/             # Inyección de dependencias manual (container/registry)
│   │   ├── services/       # Lógica de negocio (17 servicios)
│   │   └── utils/          # ipcWrapper, migrationRunner, pathValidation
│   ├── domain/             # Capa de dominio (arquitectura hexagonal)
│   │   ├── models.ts       # Entidades de dominio
│   │   ├── dtos.ts         # DTOs de entrada/salida
│   │   └── ports/          # Interfaces de repositorios y generadores
│   ├── infrastructure/     # Implementaciones concretas
│   │   ├── persistence/    # Repositorios Prisma
│   │   ├── backup/         # ElectronBackupService
│   │   └── reports/        # PDFReportGenerator, ExcelReportGenerator
│   ├── frontend/           # Renderer (React)
│   │   ├── pages/          # 17 páginas (Dashboard, POS, Contabilidad, etc.)
│   │   ├── components/     # Componentes UI reutilizables
│   │   ├── preload/        # contextBridge → window.api
│   │   ├── store/          # Stores Zustand
│   │   ├── hooks/          # Custom hooks
│   │   └── lib/            # Utilidades (currency, formateo)
│   ├── shared/             # Errores de dominio, helpers, logger, schemas Zod
│   └── env.d.ts            # Tipado de window.api
├── prisma/
│   ├── schema.prisma       # Modelo de datos (16 modelos)
│   ├── schema.sql          # DDL para primera ejecución en producción
│   ├── migrations/         # Migraciones
│   └── seed*.ts            # Datos de prueba (productos, compras)
├── scripts/                # generate-schema, rebuild-electron
├── reports/                # Reportes automáticos diarios/semanales (PDF)
├── backups/                # Respaldos comprimidos de la BD
└── package.json
```

### Patrón de Diseño
**Arquitectura Hexagonal (Puertos-Adaptadores):**
1. **Capa IPC** (`backend/ipc.ts`) - Comunicación Electron con validación Zod y control de roles
2. **Capa de Servicios** (`backend/services/`) - Lógica de negocio
3. **Capa de Dominio** (`domain/ports/`) - Interfaces (puertos) que definen qué necesita la app
4. **Capa de Infraestructura** (`infrastructure/persistence/`) - Adaptadores Prisma que implementan los puertos
5. **Capa Compartida** (`shared/`) - Errores tipados, helpers y esquemas

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

### Suppliers
```javascript
ipcRenderer.invoke('suppliers:getAll', search)
ipcRenderer.invoke('suppliers:getById', id)
ipcRenderer.invoke('suppliers:create', data, userId)
ipcRenderer.invoke('suppliers:update', id, data, userId)
ipcRenderer.invoke('suppliers:delete', id, userId)
// Cuentas por pagar
ipcRenderer.invoke('suppliers:getAccountsPayable')
ipcRenderer.invoke('suppliers:getDebt', supplierId)
ipcRenderer.invoke('suppliers:getPayments', supplierId)
ipcRenderer.invoke('suppliers:pay', supplierId, amount, note)
```

### Purchases
```javascript
ipcRenderer.invoke('purchases:getAll', supplierId, status)
ipcRenderer.invoke('purchases:getById', id)
ipcRenderer.invoke('purchases:create', data, userId)
ipcRenderer.invoke('purchases:receive', purchaseId, userId)
ipcRenderer.invoke('purchases:cancel', purchaseId, userId)
ipcRenderer.invoke('purchases:updatePaymentStatus', purchaseId, paymentStatus)
```

### Accounting (Contabilidad)
```javascript
ipcRenderer.invoke('accounting:getSummary')  // saldo, deudas y proyección de ganancias
```

### Reports (Documentos PDF/Excel)
```javascript
ipcRenderer.invoke('reports:generate', request)
ipcRenderer.invoke('reports:generateReceipt', saleId)              // ticket de venta
ipcRenderer.invoke('reports:generateCashClose', registerId)        // cierre de caja
ipcRenderer.invoke('reports:generatePurchaseInvoice', purchaseId)  // factura de compra
ipcRenderer.invoke('reports:generatePaymentReceipt', paymentIds)   // recibo de pago a proveedor
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
- **products** - Productos (con `supplier_id` para asociación a proveedor)
- **cash_registers** - Cajas registradoras
- **sales** - Ventas
- **sale_items** - Detalle de ventas (con datos de descuentos)
- **inventory_movements** - Movimientos de inventario
- **suppliers** - Proveedores
- **purchases** - Compras (`total_amount`, `paid_amount`, `status`, `payment_status`)
- **purchase_items** - Detalle de compras
- **supplier_payments** - Pagos a proveedores (historial de cuentas por pagar)
- **discounts / product_discounts** - Descuentos y su asociación con productos
- **audit_logs** - Registro de auditoría
- **settings** - Configuraciones del sistema (incluye tasa de cambio `exchange_rate_usd_ves`)

### Optimizaciones
- ✅ Índices en columnas de búsqueda frecuente
- ✅ Índices compuestos para filtros combinados
- ✅ Restricciones de unicidad en campos clave
- ✅ Eliminación en cascada donde corresponde
- ✅ SQLite WAL mode + caché optimizada

---

## 🎯 Roadmap

### ✅ Completado
- ~~Módulo de Proveedores y Compras~~ (CRUD completo + recepción con incremento de stock)
- ~~Cuentas por pagar~~ (pagos FIFO, validación de saldo, historial)
- ~~Módulo de Contabilidad~~ (saldo, deudas, proyección de ganancias, referencia en Bs.)
- ~~Exportación de Reportes~~ (PDF/Excel: ventas, inventario, cierres, facturas de compra, recibos de pago)
- ~~Gestión de Impuestos~~ (IVA/IGV configurable con desglose en tickets)
- ~~Respaldo de Seguridad~~ (manual + automático diario, restauración)
- ~~Descuentos~~ (por producto/categoría/monto mínimo)

### Pendiente
1. **Módulo de Cuentas por Cobrar**
   - Ventas a crédito a clientes
   - Registro de abonos y saldos por cliente
2. **Módulo de Auditoría Visual (Admin)**
   - Página `/audit-logs` con tabla de Usuario, Acción, Entidad, Fecha
   - Filtros por usuario y rango de fechas
3. **Frontend (UX)**
   - Implementar validación Zod en todos los formularios del renderer
   - Optimizar diseño responsive para tablets
   - Notificaciones para alertas de stock
4. **Backend (Performance)**
   - Agregar paginación server-side en listas grandes
   - Soporte para múltiples cajas simultáneas

---

## 📊 Fase Actual del Proyecto

**Fase:** MVP Completo + Maduración (Beta Funcional)

El proyecto ha superado la fase de "Prototipo" y se encuentra en **Desarrollo Avanzado**. Está listo para ser usado en un entorno real de bajo/moderado tráfico (mono-usuario), pero le faltan módulos administrativos clave para considerarse un sistema empresarial completo.

| Área | Estado |
|------|--------|
| **Base Técnica** | ✅ Sólida (Electron, React 19, Prisma 7, SQLite) |
| **UI/UX** | ✅ Moderna (MUI, Framer Motion, Skeletons) |
| **Seguridad** | ✅ Roles (Admin/Vendedor), Auditoría, Rate Limiting, Validación de contraseñas |
| **Ventas** | ✅ Funcional (POS, Historial, Caja, Impuestos, Descuentos) |
| **Inventario** | ✅ Completo (Productos, Categorías, Proveedores, Compras) |
| **Finanzas** | ✅ Cuentas por pagar + Contabilidad + Facturación de compras |
| **Reportes** | ✅ PDF/Excel + automáticos programados |

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
- **Dependencias:** Auditoría regular con `pnpm audit`.
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
