# 🚀 Inventario-POS: Sistema de Gestión e Inventario

**Inventario-POS** es una aplicación de escritorio profesional diseñada para pequeños y medianos comercios. Combina la potencia de **Electron** con la reactividad de **React 19** y la robustez de **SQLite** para ofrecer un control total sobre las ventas, el stock y el flujo de caja en un entorno local seguro.

---

## 📍 Estado Actual del Proyecto (Contexto)

A día de hoy, el sistema ha superado la fase de prototipado y cuenta con una **arquitectura de servicios y repositorios** totalmente funcional. Los módulos operativos son:

### 1. 📊 Dashboard Inteligente
- **Métricas Reales:** Visualización en tiempo real de ingresos diarios, número de ventas, productos con existencias y total de clientes registrados.
- **Gráfico de Tendencias:** Gráfico de áreas dinámico que muestra el historial de ventas de los últimos 7 días.
- **Alertas de Inventario:** Sección de "Stock Crítico" que identifica automáticamente productos con menos de 10 unidades.

### 2. 💳 Terminal de Ventas (POS)
- **Carrito Dinámico:** Gestión fluida de productos en el ticket (añadir, quitar, actualizar cantidades).
- **Clientes Flexibles:** Permite buscar clientes existentes o registrar nuevos "al vuelo" sin salir de la pantalla de venta.
- **Métodos de Pago:** Diferenciación entre pagos en Efectivo y Tarjeta para una contabilidad exacta.
- **Tickets Profesionales:** Generación automática de tickets en formato PDF optimizados para impresoras térmicas de 80mm.

### 3. 🏦 Control de Caja (Cash Management)
- **Seguridad Contable:** Bloqueo automático de ventas si no se ha realizado la apertura de caja.
- **Gestión de Turnos:** Apertura con fondo inicial y arqueo de caja al cierre.
- **Conciliación:** Cálculo automático de diferencias (Sobrantes/Faltantes) basado en el conteo físico vs. el esperado en el sistema.

### 4. 📦 Gestión de Productos (Smart Upsert)
- **Flujo Inteligente:** El sistema detecta automáticamente mediante el SKU si un producto debe crearse o actualizarse (precio/nombre), sumando el nuevo stock al existente de forma atómica.
- **Integridad de Datos:** Uso de **Triggers SQL** que garantizan que el stock nunca se descuadre, independientemente de errores en la aplicación.

---

## 🛠️ Stack Tecnológico
- **Frontend:** React 19, TypeScript, Tailwind CSS, Material UI (MUI).
- **Gráficos:** Recharts.
- **Documentos:** jsPDF + jspdf-autotable.
- **Backend (Main Process):** Electron 31 + Node.js.
- **Persistencia:** SQLite 3 con Knex.js (Query Builder).

---

## 🏗️ Arquitectura y Seguridad
- **Patrón Service-Repository:** Desacoplamiento total entre la UI y el acceso a datos, facilitando futuras migraciones a PostgreSQL.
- **IPC Seguro:** Comunicación blindada mediante `contextIsolation` y un puente (preload) que expone solo las funciones necesarias.
- **Auditoría:** Registro automático de acciones críticas en la tabla `audit_logs`.

---

## 🚀 Próximos Pasos (Roadmap Corto)
1.  **Utilidad Neta:** Implementación del Precio de Compra para calcular ganancias reales.
2.  **Categorización:** Organización de inventario por grupos.
3.  **Barcode HID:** Optimización para lectores de códigos de barras físicos.

---
*Para más detalles sobre el futuro del sistema, consulta el archivo `ROADMAP_MEJORAS.md`.*
