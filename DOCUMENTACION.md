# Documentación Técnica — InventarioPOS

Sistema de Punto de Venta (POS) y gestión de inventario construido con **Electron + React + Prisma + SQLite**.

---

## Índice

1. [Arquitectura General](#1-arquitectura-general)
2. [Stack Tecnológico](#2-stack-tecnológico)
3. [Estructura del Proyecto](#3-estructura-del-proyecto)
4. [Proceso Principal (Main Process)](#4-proceso-principal-main-process)
5. [Comunicación IPC](#5-comunicación-ipc)
6. [Frontend (Renderer Process)](#6-frontend-renderer-process)
7. [Capa de Dominio](#7-capa-de-dominio)
8. [Base de Datos](#8-base-de-datos)
9. [Seguridad](#9-seguridad)
10. [Flujo de Datos — Ejemplo Completo](#10-flujo-de-datos--ejemplo-completo)
11. [Construcción y Empaquetado](#11-construcción-y-empaquetado)
12. [Guía de Desarrollo](#12-guía-de-desarrollo)

---

## 1. Arquitectura General

```
┌─────────────────────────────────────────────────────┐
│                    Electron App                      │
├─────────────────────┬───────────────────────────────┤
│   Main Process      │      Renderer Process          │
│   (Node.js)         │      (Chromium + React)        │
│                     │                                │
│  ┌───────────────┐  │   ┌────────────────────────┐   │
│  │  IPC Handlers  │◄─┼───┤    window.api.*        │   │
│  │  (ipc.ts)      │  │   │    (preload bridge)    │   │
│  └───────┬───────┘  │   └────────────────────────┘   │
│          │          │                                │
│  ┌───────▼───────┐  │   ┌────────────────────────┐   │
│  │  Services     │  │   │  React Pages            │   │
│  │  (lógica de   │  │   │  (17 páginas)           │   │
│  │   negocio)    │  │   └────────────────────────┘   │
│  └───────┬───────┘  │                                │
│          │          │   ┌────────────────────────┐   │
│  ┌───────▼───────┐  │   │  Zustand Stores        │   │
│  │  Repositories  │  │   │  (estado cliente)      │   │
│  │  (Prisma ORM)  │  │   └────────────────────────┘   │
│  └───────┬───────┘  │                                │
│          │          │                                │
│  ┌───────▼───────┐  │                                │
│  │  SQLite DB    │  │                                │
│  │  (dev.sqlite3)│  │                                │
│  └───────────────┘  │                                │
└─────────────────────┴───────────────────────────────┘
```

### Decisiones Arquitectónicas Clave

| Decisión | Justificación |
|----------|---------------|
| **Electron** (no web) | Aplicación de escritorio offline-first, acceso directo al sistema de archivos para backups, impresión térmica nativa |
| **SQLite local** (no servidor) | Sin dependencias externas, datos siempre disponibles, ideal para pequeño comercio mono-puesto |
| **Patrón Puertos-Adaptadores (Hexagonal)** | Separación total entre lógica de negocio (`services/`) y acceso a datos (`ports/` → `persistence/`), facilitando cambios de DB o pruebas |
| **Prisma Driver Adapter** | En v7, Prisma usa el adaptador `better-sqlite3` directamente sin engine separado, simplificando el empaquetado en Electron |
| **DI manual** (sin framework) | Suficiente para el tamaño del proyecto; evita sobrecarga de Inversify/TSyringe |
| **Zustand** (no Redux) | Mínimo boilerplate, persistencia integrada, tipos inferidos automáticamente |
| **HashRouter** (no BrowserRouter) | Necesario en Electron porque no hay servidor web que maneje rutas |

---

## 2. Stack Tecnológico

### 2.1 Electron (v41)

**¿Qué es?** Framework que permite crear aplicaciones de escritorio multiplataforma usando tecnologías web (Chromium + Node.js). Cada app Electron tiene dos procesos:

| Proceso | Descripción |
|---------|-------------|
| **Main** | Un solo proceso Node.js. Arranca la app, crea ventanas, accede al sistema de archivos, base de datos, etc. |
| **Renderer** | Una instancia de Chromium por ventana. Renderiza HTML/CSS/React. No tiene acceso directo a Node.js. |

**Context Isolation:** `true` — el renderer no puede acceder a objetos de Node.js directamente. Solo se comunica mediante IPC a través del `preload` script.

**Node Integration:** `false` — `require()` y `process` no están disponibles en el renderer.

### 2.2 React 19

**¿Qué es?** Biblioteca para construir interfaces de usuario declarativas y basadas en componentes.

**Características usadas en el proyecto:**

- **Componentes funcionales** con hooks (`useState`, `useEffect`, `useCallback`)
- **Lazy Loading** con `React.lazy()` y `Suspense` — cada página se carga bajo demanda
- **HashRouter** de React Router v7 para navegación SPA
- **Framer Motion** para animaciones de entrada/salida de componentes
- **MUI (Material UI) v9** para DataGrid, temas y componentes base

### 2.3 TypeScript (v6, modo estricto)

Configuración `strict: true` con `noImplicitAny`, `noUnusedLocals`, `noUnusedParameters` y `noFallthroughCasesInSwitch`. Todo el código, tanto en main como en renderer, está escrito en TypeScript.

### 2.4 Vite 8

Bundler ultrarrápido para desarrollo y producción.

- `vite-plugin-electron/simple` orquesta la compilación de:
  1. **Main process** → `dist-electron/index.js`
  2. **Preload** → `dist-electron/index.mjs`
  3. **Renderer** → `dist/`

### 2.5 Prisma ORM v7

**¿Qué es?** ORM (Object-Relational Mapper) para TypeScript/Node.js. Genera un cliente tipado a partir del esquema.

**Driver Adapter Pattern (v7):** En lugar del engine binario tradicional, Prisma v7 se conecta a través de adaptadores:

```typescript
import { PrismaClient } from '@prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'

const prisma = new PrismaClient({
  adapter: new PrismaBetterSqlite3({ url: 'file:./dev.sqlite3' })
})
```

**Ventaja para Electron:** El adaptador elimina la dependencia del binario `query-engine-windows.dll` del engine, simplificando el empaquetado.

### 2.6 SQLite con WAL Mode

Base de datos embebida que vive en un solo archivo (`dev.sqlite3`). Optimizaciones aplicadas al conectar:

```sql
PRAGMA journal_mode = WAL;         -- Mayor rendimiento en lecturas concurrentes
PRAGMA synchronous = NORMAL;       -- Balance seguridad/velocidad
PRAGMA cache_size = -64000;        -- 64MB de caché
PRAGMA foreign_keys = ON;          -- Integridad referencial
```

### 2.7 Zod

Biblioteca de validación de esquemas para TypeScript. En el proyecto se usa para:

- Validar entrada del renderer antes de procesar en el backend
- Definir esquemas tipados para cada entidad (`productSchema`, `saleSchema`, `clientSchema`, etc.)
- Refinar datos complejos (ej. `settingsSchema` verifica que las claves estén en `SETTINGS_ALLOWLIST`)

### 2.8 Zustand

Estado global del frontend con persistencia opcional. Stores creados:

| Store | Persistencia | Propósito |
|-------|-------------|-----------|
| `useAuthStore` | `localStorage` | Usuario actual, estado de autenticación |
| `useCartStore` | `localStorage` | Carrito de compras, carritos suspendidos |
| `useCacheStore` | `sessionStorage` | Caché de categorías y settings (con TTL) |
| `useUIStore` | `localStorage` | Sidebar colapsada, preferencias UI |
| `useCashStore` | — | Caja activa actual |
| `useNotificationStore` | — | Toasts de notificación |

### 2.9 Tailwind CSS

Framework de utilidades CSS. El proyecto usa un tema oscuro personalizado con variables CSS en `:root` y modo `darkMode: ["class"]`.

### 2.10 bcryptjs

Hash de contraseñas con salt rounds=10. También se usa para hashear respuestas de seguridad (case-insensitive, normalizadas a lowercase).

### 2.11 Pino

Logger estructurado (formato JSON). Usado en todo el main process con timestamps ISO.

---

## 3. Estructura del Proyecto

```
POS-VENTA-SIS/
├── src/
│   ├── shared/
│   │   ├── errors.ts             # Clases de error: DomainError, NotFoundError, etc.
│   │   ├── helpers.ts            # buildDateFilter, etc.
│   │   ├── schemas.ts            # Esquemas Zod
│   │   └── logger.ts             # Pino logger
│   ├── domain/                   # Capa de dominio (pura, sin dependencias externas)
│   │   ├── models.ts             # Interfaces de dominio (User, Product, Sale, SupplierPayment, etc.)
│   │   ├── dtos.ts               # DTOs (CreateUserDTO, PurchaseInvoiceDTO, PaymentReceiptDTO, etc.)
│   │   └── ports/                # Interfaces de repositorios y generadores de reportes
│   ├── infrastructure/           # Implementaciones concretas
│   │   ├── persistence/          # Repositorios Prisma (12 implementaciones)
│   │   ├── backup/               # ElectronBackupService
│   │   └── reports/              # PDFReportGenerator, ExcelReportGenerator
│   ├── backend/                  # Proceso principal de Electron
│   │   ├── index.ts              # Entry point: bootstrap completo
│   │   ├── env.ts                # Configuración de entorno (producción/dev)
│   │   ├── ipc.ts                # Todos los handlers IPC (~90)
│   │   ├── di/
│   │   │   ├── container.ts      # Ensamblado de dependencias (DI)
│   │   │   └── registry.ts       # Acceso global al contenedor
│   │   ├── auth/
│   │   │   ├── session.ts        # Sesión en memoria (currentUser)
│   │   │   ├── authorize.ts      # requireRole(), UnauthorizedError, ForbiddenError
│   │   │   └── rateLimiter.ts    # Rate limiter (5 intentos, 15 min lockout)
│   │   ├── services/             # Lógica de negocio (17 servicios)
│   │   └── utils/
│   │       ├── ipcWrapper.ts     # wrapIpc(), sanitizedCatch()
│   │       ├── migrationRunner.ts# Ejecuta schema.sql en primera ejecución
│   │       └── pathValidation.ts # assertPathWithin() para backups
│   ├── frontend/
│   │   ├── preload/
│   │   │   └── index.ts          # contextBridge → window.api
│   │   ├── pages/                # 17 páginas React
│   │   ├── components/           # Componentes UI reutilizables
│   │   ├── hooks/                # Custom hooks
│   │   ├── store/                # Stores Zustand
│   │   └── lib/
│   │       ├── utils.ts          # cn(), formatCurrency()
│   │       └── currency.ts       # useExchangeRate(), formatBsRef() (referencia Bs.)
│   ├── styles/
│   │   └── theme.ts              # Tema MUI oscuro
│   ├── assets/                   # Imágenes, fuentes
│   ├── env.d.ts                  # Tipado de window.api
│   └── App.tsx                   # Root component con rutas
├── prisma/
│   ├── schema.prisma             # Modelo de datos (16 modelos)
│   ├── schema.sql                # DDL para primera ejecución
│   ├── migrations/               # Migraciones Prisma
│   └── seed*.ts                  # Datos de prueba (seed, seed-data, seed-purchases)
├── scripts/
│   ├── generate-schema.mjs       # Regenera schema.sql desde schema.prisma
│   └── rebuild-electron.mjs      # Recompila better-sqlite3 para Electron/Node
├── reports/                      # Reportes automáticos diarios/semanales (PDF)
├── backups/                      # Respaldos comprimidos de la BD
├── scheduler-state.json          # Estado de tareas programadas
├── vite.config.js                # Configuración de Vite
├── electron-builder.config.cjs   # Configuración de empaquetado
├── tailwind.config.js            # Configuración de Tailwind
├── tsconfig.json                 # TypeScript strict
├── index.html                    # HTML entry point
├── .env                          # Variables de entorno (no versionado)
└── .env.example                  # Template de .env
```

---

## 4. Proceso Principal (Main Process)

### 4.1 Bootstrap (`index.ts`)

El arranque sigue este orden:

```
1. setupProductionEnv()        → Configura DATABASE_URL
2. Crear PrismaClient          → Con adapter better-sqlite3
3. buildContainer(prisma)      → DI: ensambla todos los servicios
4. setContainer(container)     → Registro global
5. app.whenReady()
   ├── prisma.$connect()       → Conexión a SQLite
   ├── PRAGMAs (WAL, cache)    → Optimizaciones SQLite
   ├── runMigrations()         → schema.sql solo si DB vacía
   ├── setupIpcHandlers()      → Registra todos los IPC handlers
   ├── scheduler.start()       → Inicia tareas programadas
   └── createWindow()          → BrowserWindow con preload
```

### 4.2 Inyección de Dependencias (DI)

No hay framework DI. Se usa un contenedor manual:

```typescript
// buildContainer() crea todas las instancias y las ensambla
const container = buildContainer(prisma)
// {
//   prisma, userRepo, productService, saleService,
//   authService, backupService, reportService, ...
// }

// Se guarda globalmente
setContainer(container)

// Cualquier handler lo recupera
function setupIpcHandlers() {
  const $ = new Proxy({} as ReturnType<typeof getContainer>, {
    get: (_, prop) => getContainer()[prop as keyof AppContainer]
  })

  ipcMain.handle('products:getAll', async () => {
    return $.productService.getAllProducts()
  })
}
```

### 4.3 Servicios de Aplicación

| Servicio | Responsabilidad |
|----------|----------------|
| `AuthService` | Login, register, changePassword, password recovery (pregunta de seguridad + token UUID) |
| `UserService` | CRUD de usuarios + cambio de contraseña admin |
| `ProductService` | CRUD de productos, control de stock (addStock/removeStock), movimientos. `addStock` con razón `COMPRA` genera automáticamente cuenta por pagar si el producto tiene proveedor |
| `SaleService` | Registrar ventas (con validación de stock, caja abierta, cálculo de impuestos y descuentos), cancelar ventas |
| `CashRegisterService` | Apertura/cierre de caja, cálculo de diferencias (sobrante/faltante) |
| `ClientService` | CRUD de clientes, validación de duplicados (DNI, código, RUC) |
| `CategoryService` | CRUD de categorías |
| `DiscountService` | CRUD de descuentos (producto/categoría/monto mínimo) y cálculo de aplicables |
| `SupplierService` | CRUD de proveedores + **cuentas por pagar**: deuda por proveedor, posición de caja (`getCashPosition`), pago FIFO validando saldo disponible, historial de pagos |
| `PurchaseService` | Órdenes de compra, recepción (incrementa stock), cancelación, datos para factura de compra (`getPurchaseInvoiceData`) |
| `AccountingService` | Resumen contable: saldo disponible, cuentas por pagar consolidadas y proyección de ganancia bruta por inventario |
| `SettingsService` | CRUD de configuraciones clave/valor, impuestos, tasa de cambio |
| `DashboardService` | Estadísticas, métricas, caché de dashboard |
| `BackupService` | Fachada que delega en `ElectronBackupService` |
| `ReportService` | Generación de reportes (PDF/Excel): ventas, inventario, cierre de caja, tickets, **facturas de compra**, **recibos de pago a proveedor** |
| `CacheService` | Caché en memoria para dashboard (TTL configurable) |
| `SchedulerService` | Tareas programadas: reporte diario/semanal (**guardados como PDF en `reports/`**), backup automático |

#### 4.3.1 Manejo de Errores en Servicios

Todos los servicios lanzan errores tipados:

```typescript
class DomainError extends Error { code: string }
class NotFoundError extends DomainError    // código: NOT_FOUND
class ConflictError extends DomainError    // código: CONFLICT
class ValidationError extends DomainError  // código: VALIDATION
class BusinessRuleError extends DomainError // código: BUSINESS_RULE
```

El `ipcWrapper.ts` captura estos errores y los transforma en respuestas IPC estructuradas:
```typescript
// wrapIpc() envuelve la respuesta automáticamente:
{ success: true, data: ... }

// Errores se transforman en:
{ success: false, message: "Error en español", code: "VALIDATION" }
```

### 4.4 Migraciones (schema.sql)

**Problema que resuelve:** En la primera ejecución (DB vacía), se necesita crear todas las tablas. Prisma espera que las migraciones ya existan, pero la app se distribuye empaquetada.

**Solución:** El archivo `prisma/schema.sql` contiene el DDL completo generado con:
```bash
npm run db:schema
# Ejecuta: prisma migrate diff --from-empty --to-schema prisma/schema.prisma --script
```

El `migrationRunner.ts`:
1. Verifica si la tabla `users` existe → si sí, salta
2. Si no, ejecuta todas las sentencias SQL del archivo
3. Reconecta Prisma para refrescar el caché de esquema

**⚠️ Importante:** Cada vez que se modifica `schema.prisma`, hay que regenerar `schema.sql` con `npm run db:schema`.

---

## 5. Comunicación IPC

### 5.1 Patrón General

Electron aísla el renderer del main process por seguridad. La comunicación se hace mediante **IPC (Inter-Process Communication)** con `ipcMain.handle()` / `ipcRenderer.invoke()`.

```
Renderer                          Main
   │                                │
   │ window.api.getProducts()       │
   ├───────────────────────────────►│
   │  ipcRenderer.invoke(           │
   │    'products:getAll')          │
   │                                │
   │                                ├─► productService.getAllProducts()
   │                                │       │
   │                                │       ▼
   │                                │  productRepo.findAll(search, catId)
   │                                │       │
   │                                │       ▼
   │                                │  prisma.product.findMany()
   │                                │
   │◄───────────────────────────────┤
   │  { success: true,             │
   │    data: Product[] }           │
   │                                │
```

### 5.2 Preload Bridge

El `preload/index.ts` expone funciones seguras al renderer:

```typescript
// preload.ts
contextBridge.exposeInMainWorld('api', {
  // Sin argumentos
  getSettings: () => ipcRenderer.invoke('settings:getAll'),
  checkSession: () => ipcRenderer.invoke('auth:checkSession'),

  // Con argumentos
  login: (user, pass) => ipcRenderer.invoke('auth:login', user, pass),
  createProduct: (data, userId) => ipcRenderer.invoke('products:create', data, userId),

  // Múltiples argumentos
  getSalesByPayment: (start, end) => ipcRenderer.invoke('dashboard:getSalesByPayment', start, end),
})
```

### 5.3 Tipos de Handlers

#### Handler Simple (sin auth)
```typescript
ipcMain.handle("health:check", async () => {
  try { return await $.dashboardService.getStats(); }
  catch (error) { return sanitizedCatch(error, 'Error al obtener estadísticas'); }
})
```

#### Handler con Validación Zod + Auth
```typescript
ipcMain.handle("clients:create", wrapIpc((clientData, userId) =>
    $.clientService.createClient(clientData, userId), clientSchema
))
// wrapIpc() valida clientData contra clientSchema, y si el handler
// lanza error, lo transforma en { success: false, message, code }
```

#### Handler Raw con Auth Manual
```typescript
ipcMain.handle("settings:getAll", async () => {
  const user = getCurrentUser();
  if (!user) throw new UnauthorizedError();
  if (user.role !== 'ADMIN') throw new ForbiddenError(['ADMIN']);
  return await $.settingsService.getSettings();
})
```

### 5.4 Lista Completa de Canales IPC

| Prefijo | Canales | Total |
|---------|---------|-------|
| `auth:` | login, logout, checkSession, getSecurityQuestion, verifySecurityAnswer, resetPassword, setSecurityQuestion | 7 |
| `setup:` | status, complete | 2 |
| `dashboard:` | getStats, getWeeklySales, getLowStock, getSalesByPayment, getTopProducts, getTopClients, getSalesByHour, getCashSummary, getInventoryMetrics, invalidateCache | 10 |
| `sales:` | getAll, getToday, getLast, getStats, getDetails, register, cancel | 7 |
| `products:` | getAll, getById, getLowStock, create, update, delete, addStock, removeStock, getMovements | 9 |
| `clients:` | getAll, getById, create, update, delete | 5 |
| `categories:` | getAll, getById, create, update, delete | 5 |
| `discounts:` | getAll, getById, create, update, delete, getApplicable | 6 |
| `cash:` | getOpen, getAll, getDetails, getDailySummary, open, close | 6 |
| `users:` | getAll, getById, create, update, delete, changePassword | 6 |
| `settings:` | getAll, update, getTax, updateTax | 4 |
| `suppliers:` | getAll, getById, create, update, delete + **getAccountsPayable, getDebt, getPayments, pay** (cuentas por pagar) | 9 |
| `purchases:` | getAll, getById, create, receive, cancel, updatePaymentStatus | 6 |
| `accounting:` | getSummary (saldo disponible, deudas, proyección de ganancias) | 1 |
| `movements:` | getAll | 1 |
| `backup:` | create, list, restore, delete | 4 |
| `reports:` | generate, generateReceipt, generateCashClose + **generatePurchaseInvoice** (factura de compra), **generatePaymentReceipt** (recibo de pago a proveedor) | 5 |
| `dialog:` | showConfirm | 1 |
| `window:` | focus, is-ready | 2 |
| `health:` | check | 1 |
| | **Total** | **~90** |

---

## 6. Frontend (Renderer Process)

### 6.1 Árbol de Componentes

```
<App>
  <ThemeProvider>          ← MUI dark theme
    <CssBaseline/>         ← Reseteo CSS
    <ToastContainer/>      ← Notificaciones toast
    <HashRouter>
      <Routes>
        /setup       → <Setup/>           (público, solo si DB vacía)
        /login       → <Login/>           (público)
        /            → <MainLayout>        (protegido: requiere auth)
          ├─ /dashboard     → <Dashboard/>
          ├─ /sales         → <Sales/>
          ├─ /sales-history → <SalesHistory/>
          ├─ /products      → <Products/>
          ├─ /categories    → <Categories/>   (solo ADMIN)
          ├─ /clients       → <Clients/>
          ├─ /cash          → <Cash/>
          ├─ /settings      → <Settings/>
          ├─ /users         → <Users/>         (solo ADMIN)
          ├─ /cash-history  → <CashHistory/>   (solo ADMIN)
          ├─ /movements     → <InventoryMovements/> (solo ADMIN)
          ├─ /suppliers     → <Suppliers/>      (solo ADMIN, con cuentas por pagar)
          ├─ /purchases     → <Purchases/>      (solo ADMIN)
          ├─ /discounts     → <Discounts/>      (solo ADMIN)
          ├─ /reports       → <Reports/>        (solo ADMIN)
          └─ /accounting    → <Accounting/>     (solo ADMIN, contabilidad)
```

### 6.2 Manejo de Sesión

```
App monta
  │
  ├── ¿setupNeeded?
  │     ├── Sí → <Setup onComplete={crear usuario + login}>
  │     └── No → ¿isAuthenticated?
  │              ├── Sí → verifySession() → ¿match?
  │              │         ├── Sí → <MainLayout>
  │              │         └── No → logout() → <Login>
  │              └── No → <Login onLogin={login}>
  │
  [verifySession] se ejecuta cada vez que isAuthenticated cambia
```

**¿Por qué `verifySession`?** La sesión del main process es en memoria (se pierde al reiniciar la app). El renderer persiste `isAuthenticated` en localStorage. Sin `verifySession`, al reiniciar la app el renderer pensaría que sigue autenticado pero los handlers IPC devolverían error 401.

### 6.3 Lazy Loading

Todas las páginas se cargan con `React.lazy()` y `Suspense`. Esto divide el bundle en chunks individuales (~13–340 KB cada uno) que se cargan bajo demanda.

### 6.4 Stores Zustand

#### useAuthStore
```typescript
{
  user: { id, username, role } | null,
  isAuthenticated: boolean,
  login: (user) => void,     // setea user + isAuthenticated = true
  logout: () => void,        // limpia todo + persiste
}
// Persistencia: localStorage 'auth-storage'
```

#### useCartStore
```typescript
{
  items: CartItem[],              // { product, qty }
  suspendedCarts: SuspendedCart[],// carritos guardados
  addItem: (product) => void,
  removeItem: (productId) => void,
  updateQty: (productId, qty) => void,
  clearCart: () => void,
  getTotal: () => number,
  suspendCart: (name) => void,
  resumeCart: (suspendedId) => void,
}
// Persistencia: localStorage 'cart-storage'
```

#### useCashStore
```typescript
{
  activeRegister: CashRegister | null,
  setActiveRegister: (reg) => void,
}
```

#### useCacheStore
```typescript
{
  categories: { data, timestamp },
  settings: { data, timestamp },
  setCategories(data), getCategories(),
  setSettings(data), getSettings(),
  isCategoriesValid(ttlMs), isSettingsValid(ttlMs),
}
// Persistencia: sessionStorage 'cache-storage'
```

#### useUIStore
```typescript
{
  sidebarCollapsed: boolean,
  toggleSidebar: () => void,
}
// Persistencia: localStorage 'ui-storage'
```

### 6.5 Componentes UI Reutilizables

`src/components/ui/` contiene componentes base:

| Componente | Propósito |
|------------|-----------|
| `DataTable` | Tabla genérica con columnas configurables, sorting, empty states |
| `Modal` | Modal genérico con animación Framer Motion |
| `Button` | Botón estilizado con variantes (primary, secondary, danger) |
| `FormInput` | Input con label, error state, tema oscuro |
| `FormSelect` | Select con opciones, placeholder, error |
| `FormTextarea` | Textarea multilínea |
| `ToastContainer` | Contenedor de notificaciones toast |
| `ConfirmDialog` | Diálogo de confirmación acción peligrosa |
| `Skeleton` | Skeleton loader para estados de carga |
| `Pagination` | Paginación para tablas grandes |
| `LoadingSpinner` | Spinner de carga |
| `ErrorBoundary` | Captura errores de React y muestra fallback |

---

## 7. Capa de Dominio

### 7.1 Arquitectura Hexagonal (Puertos-Adaptadores)

```
┌────────────────────────────────────────────────────┐
│                   DOMAIN                           │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────┐ │
│  │  models.ts   │  │   dtos.ts    │  │  ports/   │ │
│  │ (entidades)  │  │     (DTOs)   │  │(interfaces│ │
│  └─────────────┘  └──────────────┘  │ repositorio│ │
│                                      └───────────┘ │
└────────────────────────────────────────────────────┘
         ▲                      ▲
         │                      │
         │    Implementa        │    Implementa
         │                      │
┌────────┴────────┐    ┌────────┴──────────────────┐
│  infra/backup/  │    │  infra/persistence/        │
│  ElectronBackup │    │  Prisma*Repository.ts      │
│  Service.ts     │    │  (11 implementaciones)     │
└─────────────────┘    └───────────────────────────┘
```

### 7.2 Puertos (Interfaces de Repositorio)

Definidos en `src/domain/ports/`. Cada puerto define **qué** necesita la aplicación, no **cómo** se implementa.

```typescript
// Ejemplo: IUserRepository
interface IUserRepository {
  findAll(): Promise<User[]>
  findById(id: number): Promise<User | null>
  findByUsername(username: string): Promise<UserWithPassword | null>
  create(data: CreateUserDTO): Promise<User>
  update(id: number, data: UpdateUserDTO): Promise<User>
  delete(id: number): Promise<void>
  exists(username: string, excludeId?: number): Promise<boolean>
  count(): Promise<number>
}
```

### 7.3 Adaptadores (Implementaciones Concretas)

En `src/infrastructure/persistence/`:

| Puerto | Implementación | Notas |
|--------|---------------|-------|
| `IUserRepository` | `PrismaUserRepository` | Excluye `password_hash` en queries de listado |
| `IProductRepository` | `PrismaProductRepository` | `updateStock()` con protección atómica `stock >= quantity` |
| `ISaleRepository` | `PrismaSaleRepository` | `registerSale()` en transacción: crea venta + items + movimientos + descuenta stock + actualiza caja |
| `IClientRepository` | `PrismaClientRepository` | Búsqueda por DNI, código, RUC + validación duplicados |
| `ICashRegisterRepository` | `PrismaCashRegisterRepository` | `close()` con cálculo de diferencia + actualización de estado + `getTotalInflow()`: Σ aperturas + Σ ventas (saldo disponible de cuentas por pagar) |
| `ISettingsRepository` | `PrismaSettingsRepository` | Key-value store con `upsert()` |
| `ICategoryRepository` | `PrismaCategoryRepository` | `getProductCount()` para proteger borrado |
| `IAuditLogRepository` | `PrismaAuditLogRepository` | Auditoría de acciones críticas |
| `IDashboardRepository` | `PrismaDashboardRepository` | Estadísticas agregadas, top products/clients |
| `ISupplierRepository` | `PrismaSupplierRepository` | Búsqueda por RUC + cuentas por pagar: `getOutstandingPurchases`, `getAccountsPayable` (groupBy), `registerPayment`, `applyPaymentToPurchase`, `getTotalPaid`, `getPaymentsByPurchase/ByIds` |
| `IPurchaseRepository` | `PrismaPurchaseRepository` | Transacción de recepción: actualiza stock + registra movimiento. `createReceivedWithoutStock()` crea la deuda al aumentar stock con razón COMPRA |
| `IDiscountRepository` | `PrismaDiscountRepository` | Descuentos y aplicabilidad por producto/categoría/monto |

---

## 8. Base de Datos

### 8.1 Modelo de Datos (16 modelos)

```
┌───────────┐     ┌──────────────┐     ┌───────────┐
│   users   │     │   clients    │     │  settings │
├───────────┤     ├──────────────┤     ├───────────┤
│ id (PK)   │     │ id (PK)      │     │ id (PK)   │
│ username  │     │ dni (UQ)     │     │ key (UQ)  │
│ password  │     │ name         │     │ value     │
│   _hash   │     │ phone        │     └───────────┘
│ role      │     │ code (UQ)    │
│ security_ │     │ tax_id (UQ)  │
│  _question│     └──────┬───────┘
│ security_ │            │
│ answer_   │     ┌──────▼───────┐     ┌───────────────────┐
│   hash    │     │   sales      │     │  sale_items       │
│           │     ├──────────────┤     ├───────────────────┤
│           │     │ id (PK)      │     │ id (PK)           │
└───────────┘     │ total        │◄────│ sale_id (FK)      │
                  │ subtotal     │     │ product_id (FK)   │
┌───────────┐     │ tax_amount   │     │ quantity          │
│ categories│     │ payment_     │     │ unit_price        │
├───────────┤     │  method      │     │ purchase_price    │
│ id (PK)   │     │ exchange_    │     └───────────────────┘
│ name      │     │  rate        │              ▲
└─────┬─────┘     │ client_id(FK)│     ┌────────┴──────────┐
      │           │ cash_register│     │   products        │
      │           │  _id (FK)    │     ├───────────────────┤
┌──────▼──────┐   └──────┬───────┘     │ id (PK)           │
│  products   │          │             │ sku (UQ)          │
├─────────────┤          │             │ name              │
│ id (PK)     │          │             │ price_purchase    │
│ sku (UQ)    │  ┌───────▼────────┐   │ price_sale        │
│ name        │  │ cash_registers │   │ stock             │
│ price_      │  ├────────────────┤   │ min_stock         │
│  purchase   │  │ id (PK)        │   │ category_id(FK)   │
│ price_sale  │  │ opening_amount │   │ supplier_id(FK)   │
│ stock       │  │ total_sales    │   └─────┬─────────────┘
│ min_stock   │  │ closed_at      │         │
│ category    │  │ closing_amount │   ┌─────▼─────────────┐
│  _id (FK)   │  │ difference     │   │ inventory_movements│
│ supplier    │  │ status         │   ├───────────────────┤
│  _id (FK)   │  └────────────────┘   │ id (PK)           │
└─────────────┘                       │ product_id (FK)   │
                                      │ type (ENTRADA/    │
┌───────────┐     ┌──────────────┐     │      SALIDA)      │
│ suppliers  │     │  purchases   │     │ quantity          │
├───────────┤     ├──────────────┤     │ reason            │
│ id (PK)   │     │ id (PK)      │     └───────────────────┘
│ name      │◄────│ supplier_id  │
│ ruc (UQ)  │     │  (FK)        │     ┌──────────────┐
│ phone     │     │ total_amount │     │ audit_logs   │
│ email     │     │ status       │     ├──────────────┤
│ address   │     │ payment_     │     │ id (PK)      │
└───────────┘     │  status      │     │ user_id (FK) │
                  │              │     │ action       │
┌───────────────┐ │              │     │ entity       │
│ purchase_items│ │              │     │ entity_id    │
├───────────────┤ └──────────────┘     │ created_at   │
│ id (PK)       │                     └──────────────┘
│ purchase_id   │
│  (FK)         │
│ product_id(FK)│
│ quantity      │
│ unit_cost     │
└───────────────┘
```

**Modelos adicionales (no en el diagrama):**

| Tabla | Descripción |
|-------|-------------|
| `discounts` | Descuentos (nombre, tipo, valor, activo, aplicable a, categoría, monto mínimo) |
| `product_discounts` | Relación N:M productos ↔ descuentos (PK compuesta) |
| `supplier_payments` | Historial de pagos a proveedores: `supplier_id`, `purchase_id?`, `amount`, `note`, `created_by`, `created_at` |

**Nota sobre `purchases`:** además de `total_amount`, `status` y
`payment_status`, incluye **`paid_amount`** (default 0) para soportar
pagos parciales.

**Lógica de cuentas por pagar:**
- Una compra genera deuda cuando `status = 'RECEIVED'` y `paid_amount < total_amount`
- Cada pago se registra en `supplier_payments` y se aplica **FIFO** sobre las compras recibidas más antiguas
- Al alcanzar `paid_amount >= total_amount`, la compra pasa a `payment_status = 'PAID'`
- Saldo disponible para pagar = `(Σ aperturas de caja + Σ ventas) − Σ pagos a proveedores`; no se permite pagar si es ≤ 0 o insuficiente

### 8.2 Índices

- `products`: category_id, stock+min_stock (compuesto), name, sku, supplier_id
- `sales`: cash_register_id, client_id, created_at, payment_method
- `sale_items`: sale_id, product_id
- `inventory_movements`: product_id, type
- `purchases`: supplier_id, status, payment_status, created_at
- `purchase_items`: purchase_id, product_id
- `supplier_payments`: supplier_id, purchase_id, created_at
- `audit_logs`: user_id, entity, created_at
- `clients`: name (para búsqueda), dni (único)

### 8.3 Transacciones

Prisma `$transaction()` se usa en operaciones críticas para mantener consistencia:

```typescript
// Ejemplo: registrar venta (PrismaSaleRepository.registerSale)
await prisma.$transaction(async (tx) => {
  // 1. Crear venta
  const sale = await tx.sale.create({ data: { ... } })
  // 2. Crear items + descontar stock (con verificación atómica)
  for (const item of input.items) {
    await tx.saleItem.create({ data: { sale_id: sale.id, ... } })
    const result = await tx.product.updateMany({
      where: { id: item.product_id, stock: { gte: item.quantity } },
      data: { stock: { decrement: item.quantity } },
    })
    if (result.count === 0) throw new Error('Stock insuficiente')
    await tx.inventoryMovement.create({ data: { ... } })
  }
  // 3. Actualizar totales de caja
  await tx.cashRegister.update({
    where: { id: input.cash_register_id },
    data: { total_sales: { increment: input.total } },
  })
  return sale.id
})
```

---

## 9. Seguridad

### 9.1 Capas de Seguridad

```
┌─────────────────────────────────────────────────────────┐
│                    ELECTRON                              │
│  • Context Isolation: true                               │
│  • Node Integration: false                               │
│  • preload script con API específica                     │
├─────────────────────────────────────────────────────────┤
│                    AUTENTICACIÓN                         │
│  • bcrypt (salt rounds=10) para passwords               │
│  • Rate limiting: 5 intentos → 15 min lockout por user  │
│  • Política de contraseña: min 8 chars, mayúscula,      │
│    minúscula, número, especial                          │
│  • Sesión en memoria (se pierde al reiniciar)           │
├─────────────────────────────────────────────────────────┤
│                    AUTORIZACIÓN                          │
│  • Roles: ADMIN y VENDEDOR                               │
│  • requireRole('ADMIN') en handlers IPC sensibles       │
│  • Sidebar oculta rutas de admin para vendedores        │
├─────────────────────────────────────────────────────────┤
│                    VALIDACIÓN                            │
│  • Zod schemas validan toda entrada del renderer        │
│  • SETTINGS_ALLOWLIST previene keys inválidas           │
│  • Path validation en backups (solo rutas relativas)    │
├─────────────────────────────────────────────────────────┤
│                    STOCK                                 │
│  • 3 capas: servicio → condición atómica en DB →        │
│    verificación post-actualización                      │
├─────────────────────────────────────────────────────────┤
│                    AUDITORÍA                             │
│  • audit_logs registra: CREATE_USER, DELETE_USER,       │
│    CREATE_PRODUCT, STOCK_ENTRADA, SALIDA, CREATE_SALE,  │
│    CANCEL_SALE, OPEN/CLOSE_CASH_REGISTER, etc.          │
├─────────────────────────────────────────────────────────┤
│                    NETWORK                               │
│  • Content-Security-Policy estricta en producción       │
│  • Sin conexión a internet (app 100% offline)           │
└─────────────────────────────────────────────────────────┘
```

### 9.2 Rate Limiter

Implementación en memoria con `Map<string, { attempts, lockedUntil }>`:

| Parámetro | Valor |
|-----------|-------|
| Intentos máximos | 5 |
| Duración de bloqueo | 15 minutos (900,000 ms) |
| Ámbito | Por nombre de usuario |
| Persistencia | Solo en memoria (se reinicia al cerrar app) |

### 9.3 Recuperación de Contraseña

1. Usuario ingresa su username
2. Si tiene pregunta de seguridad configurada, se muestra
3. Responde la pregunta (case-insensitive)
4. Si la respuesta es correcta, se genera un **token UUID** con expiración de 10 min
5. Con ese token, puede cambiar la contraseña

---

## 10. Flujo de Datos — Ejemplo Completo

### 10.1 Registrar una Venta

```
Usuario en Terminal POS
       │
       ▼
1. Sales.tsx — fetchData()
   ├── window.api.getAllProducts()   → IPC 'products:getAll'
   ├── window.api.getAllClients()    → IPC 'clients:getAll'
   ├── window.api.getOpenRegister()  → IPC 'cash:getOpen'
   ├── window.api.getSettings()      → IPC 'settings:getAll'
   └── window.api.getTaxSettings()   → IPC 'settings:getTax'

2. Usuario escanea/agrega productos
   └── addItem(product) → zustand useCartStore
       └── getTotal() → reduce(items, acc + price * qty)

3. Usuario selecciona cliente y paga
   └── handleCheckout()
       ├── Calcular total con impuestos
       │   └── getTaxInfo(total)
       │       ├── taxType='percentage' → taxAmount = total * taxRate
       │       └── total = subtotal + taxAmount
       │
       ├── window.api.registerSale(data, items, userId)
       │   └── IPC 'sales:register'
       │       └── SaleService.registerSale()
       │           ├── Validar con saleSchema (Zod)
       │           ├── Verificar caja abierta
       │           ├── Buscar o crear cliente
       │           ├── Verificar stock de cada producto
       │           ├── Calcular impuestos
       │           └── PrismaSaleRepository.registerSale()
       │               └── $transaction:
       │                   1. sale.create()
       │                   2. Por cada item:
       │                      a. saleItem.create()
       │                      b. product.updateMany(stock decrement)
       │                      c. inventoryMovement.create('SALIDA')
       │                   3. cashRegister.update(total_sales += total)
       │
       ├── setShowSuccess(true)
       ├── generateTicketPDF() → jsPDF
       └── clearCart()
```

### 10.2 Login con Rate Limiting

```
Login.tsx
  │
  ├── handleLogin(user, pass)
  │   └── window.api.login(user, pass)
  │       └── IPC 'auth:login'
  │           └── AuthService.login()
  │               ├── checkRateLimit(username)
  │               │   ├── ¿Map tiene registro? ¿lockedUntil > now?
  │               │   │   ├── Sí → return { locked: true, error: "Bloqueado X min" }
  │               │   │   └── No → allowed = true
  │               │
  │               ├── userRepo.findByUsername(username)
  │               │   ├── ¿No existe? →
  │               │   │   recordFailure(username) → return error
  │               │   └── Existe → bcrypt.compare(password, hash)
  │               │
  │               ├── ¿Password incorrecto? →
  │               │   recordFailure(username) → return attempts remaining
  │               │
  │               └── Éxito →
  │                   resetRateLimit(username)
  │                   setCurrentUser(user)
  │                   return { success: true, user }
  │
  ├── zustand: login(user) → set isAuthenticated = true
  │
  └── navigate('/dashboard')
```

---

## 11. Construcción y Empaquetado

### 11.1 Scripts de Build

```bash
# Desarrollo
npm run dev               # Vite dev server + Electron

# Producción (Windows)
npm run build:win         # 4 pasos:
 1. npm run db:schema      #   regenera prisma/schema.sql
 2. prisma generate        #   genera Prisma Client
 3. vite build             #   compila main + preload + renderer
 4. electron-builder      #   empaqueta en .exe (Squirrel)

# Producción (Linux)
npm run build:linux       #   genera .AppImage + .deb

# Ambos
npm run build:all         #   Windows + Linux
```

### 11.2 Composición del Ejecutable

```
InventarioPOS.exe
├── resources/
│   ├── app.asar              # Código compilado (main + renderer + preload)
│   │                         # en formato asar (comprimido/encapsulado)
│   ├── app.asar.unpacked/
│   │   ├── node_modules/
│   │   │   ├── .prisma/client/    # Prisma Client + engine
│   │   │   ├── @prisma/client/    # Runtime de Prisma
│   │   │   ├── @prisma/engines/   # schema-engine (solo para migraciones)
│   │   │   ├── better-sqlite3/    # Native addon (rebuilt para Electron)
│   │   │   └── jszip/            # Para exports Excel
│   │   └── prisma/
│   │       └── schema.sql        # DDL para primera ejecución
│   └── electron.asar         # Runtime de Electron
├── locales/                  # Traducciones Chromium
├── dlls/                     # Chromium DLLs
└── InventarioPOS.exe         # Ejecutable principal
```

### 11.3 Distribución

El instalador Squirrel.Windows se genera en `release 1.0.0/squirrel-windows/`:
- `InventarioPOS Setup 1.0.0.exe` — Instalador
- `pos-venta-sis-1.0.0-full.nupkg` — Paquete NuGet (para actualización)

---

## 12. Guía de Desarrollo

### 12.1 Primeros Pasos

```bash
# 1. Clonar
git clone <repo>
cd POS-VENTA-SIS

# 2. Instalar dependencias
npm install
# El postinstall ejecuta: prisma generate + rebuild de better-sqlite3 para Electron

# 3. Configurar .env (copiar de .env.example)
cp .env.example .env
# Editar DATABASE_URL si es necesario (default: file:./dev.sqlite3)

# 4. Regenerar Prisma Client + schema.sql
npm run db:generate
npm run db:schema

# 5. Iniciar en modo desarrollo
npm run dev
```

#### ⚠️ better-sqlite3 y el ABI de Electron (importante)

Electron usa un ABI de Node distinto (`NODE_MODULE_VERSION` diferente), por lo que
`better-sqlite3` debe compilarse específicamente para Electron. El flujo:

| Contexto | Comando |
|----------|---------|
| `pnpm install` / postinstall | Recompila automáticamente **para Electron** |
| `pnpm run dev` | Requiere binario compilado **para Electron** |
| Tests con vitest (Node) | Requieren binario compilado **para Node**: `node scripts/rebuild-electron.mjs restore` |
| Volver a dev tras los tests | `node scripts/rebuild-electron.mjs electron` |

La versión de `better-sqlite3` está **fijada** en `package.json` (sin `^`) para
evitar drift de versiones.

#### 📁 Reportes automáticos programados

El `SchedulerService` genera al inicio del día (si no existen):
- `reports/reporte-diario-YYYY-MM-DD.pdf` — ventas del día actual
- `reports/reporte-semanal-semana-N.pdf` — resumen semanal
- `backups/backup-...sqlite.gz` — respaldo diario comprimido

En producción las carpetas viven en `%APPDATA%/InventarioPOS/`. El estado de
"ya ejecutado" se guarda en `scheduler-state.json` (borrar una clave fuerza la
regeneración).

### 12.2 Modificar la Base de Datos

```bash
# 1. Editar prisma/schema.prisma
# 2. Crear migración
npm run db:migrate

# 3. Regenerar schema.sql (importante para producción)
npm run db:schema

# 4. Verificar que prisma/schema.sql tenga los cambios
```

### 12.3 Agregar un Nuevo IPC Handler

```typescript
// 1. Preload — src/preload/index.ts
contextBridge.exposeInMainWorld('api', {
  ...existingApis,
  nuevoMetodo: (arg1, arg2) => ipcRenderer.invoke('nuevo:canal', arg1, arg2),
});

// 2. Handler — src/main/ipc.ts
ipcMain.handle("nuevo:canal", wrapIpc((arg1, arg2) =>
    $.miService.miMetodo(arg1, arg2), miSchema
));

// 3. Servicio — src/main/services/MiService.ts (si no existe)
export class MiService {
  constructor(private repo: IMiRepository) {}
  async miMetodo(arg1: string, arg2: number) {
    // lógica de negocio
  }
}

// 4. Puerto — src/domain/ports/IMiRepository.ts (si no existe)
export interface IMiRepository {
  buscar(): Promise<...>;
}

// 5. Repositorio — src/infrastructure/persistence/PrismaMiRepository.ts
export class PrismaMiRepository implements IMiRepository {
  constructor(private prisma: PrismaClient) {}
  async buscar() { return this.prisma.miModelo.findMany(); }
}

// 6. DI — src/main/di/container.ts
// Agregar al buildContainer()
const miRepo = new PrismaMiRepository(prisma);
const miService = new MiService(miRepo);
// Incluir en el return
```

### 12.4 Agregar una Nueva Página

```typescript
// 1. Crear src/pages/MiPagina.tsx
export default function MiPagina() { ... }

// 2. App.tsx — lazy import + ruta
const MiPagina = lazy(() => import('./pages/MiPagina.tsx'));

// Dentro de <Routes> dentro de MainLayout:
<Route path="mi-ruta" element={<MiPagina />} />

// 3. Sidebar — agregar a routes[]
{ name: 'Mi Pagina', path: '/mi-ruta', icon: MiIcone },
```

### 12.5 Pruebas

```bash
# Ejecutar tests
npm test              # modo watch
npm run test:run      # una sola ejecución

# Los tests existentes están en src/shared/__tests__/security.test.ts
# y src/main/services/__tests__/*.test.ts
```

### 12.6 Linting

```bash
npm run lint
# ESLint con TypeScript + react-hooks + security rules
```

---

## Apéndice: Preguntas Frecuentes

**¿Dónde se guarda la base de datos?**
- En desarrollo: `./dev.sqlite3` (raíz del proyecto)
- En producción: `%APPDATA%/InventarioPOS/dev.sqlite3`

**¿Cómo reinicio la app desde cero?**
1. Cerrar la aplicación
2. Eliminar `dev.sqlite3` y `scheduler-state.json`
3. Iniciar la app → se ejecutará el Setup nuevamente

**¿Por qué no se actualiza el frontend cuando cambio código del main process?**
Vite hot-reload solo aplica al renderer. Para cambios en `src/main/`, debes cerrar la ventana de Electron y reiniciar `npm run dev`.

**¿Cómo hago backup de los datos?**
Desde Ajustes → Backups, o automáticamente cada día. Los backups se guardan comprimidos (gzip) en la carpeta `backups/`.

**¿Dónde están los reportes automáticos diarios/semanales?**
En la carpeta `reports/` (en desarrollo: raíz del proyecto; en producción: `%APPDATA%/InventarioPOS/reports/`). Si no se generó el de hoy, elimina la clave `scheduler_daily_report` de `scheduler-state.json` y reinicia.

**¿Por qué el reporte "Ventas del Día" salía con 0 ventas?**
Era un bug de zona horaria (corregido): `new Date("YYYY-MM-DD")` se interpreta como medianoche UTC y desplazaba el rango en zonas GMT-negativas. Ahora las fechas se construyen en hora local (`parseLocalDate()` en `Reports.tsx`).

**¿Cómo funciona el pago a proveedores?**
Desde Contabilidad o Proveedores: se valida que la empresa tenga saldo disponible (ingresos − pagos previos), se ingresa el monto total o parcial, y se aplica FIFO sobre las compras pendientes más antiguas. Cada pago genera un recibo PDF opcional y las compras recibidas tienen factura de compra en PDF (botón 🖨️ en Compras).

**¿De dónde sale la referencia en bolívares?**
Del setting `exchange_rate_usd_ves` (Ajustes → Datos del Negocio → Tasa de Cambio). Los montos operativos siempre están en USD; el Bs. es solo referencia visual.
