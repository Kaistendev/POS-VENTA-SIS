# Optimización de Almacenamiento en Memoria — Plan de Desarrollo

## Diagnóstico

### Arquitectura actual

| Capa | Mecanismo | Datos | Persistencia |
|------|-----------|-------|--------------|
| Mock API | `mockApi.ts` — objeto `AppData` en RAM + serialización JSON | Toda la DB (productos, ventas, compras, movimientos, etc.) | `localStorage` key `pos-web-data` |
| Auth Store | Zustand + persist middleware | Usuario autenticado | `localStorage` key `auth-storage` |
| Cart Store | Zustand + persist middleware | Items del carrito + carritos suspendidos | `localStorage` key `cart-storage` |
| Cache Store | Zustand + persist middleware | Categorías y settings con TTL | `sessionStorage` key `cache-storage` |
| UI Store | Zustand + persist middleware | Sidebar colapsado | `localStorage` key `ui-storage` |
| Cash Store | Zustand volátil (RAM) | Caja activa | No persiste |
| Notification Store | Zustand volátil (RAM) | Toast notifications | No persiste |

### Flujo crítico: cada CRUD serializa todo

```typescript
// mockApi.ts
function saveData(data: AppData) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch { }
}
```

En cada operación (crear producto, registrar venta, etc.) se serializa **todo** el estado (`JSON.stringify`) y se escribe en `localStorage`. Con ~100 ventas, el JSON puede pesar 200-500KB. Con miles, puede superar el límite de 5MB de localStorage.

### Flujo crítico: cada página refetchea todo en mount

```typescript
// En cada página:
useEffect(() => { fetchData(); }, []);

const fetchData = async () => {
  const p = await window.api.getAllProducts();
  const c = await window.api.getAllClients();
  // ... cada vez que se monta el componente
};
```

No hay capa de caché compartida entre páginas. Si el usuario navega de Productos a Ventas y vuelve, se refetchea todo.

### Problemas de re-render innecesario

- Sin `React.memo` en componentes de lista (tablas de productos, ventas, etc.)
- Sin `useShallow` en selectores de Zustand — cualquier cambio re-renderiza todos los subscriptores
- Sin `useMemo` en cálculos derivados (`filteredProducts`, `getTotal`, etc.)
- Sin `useCallback` estable en handlers pasados como props

---

## Sprints de Desarrollo

### Sprint 1 — Selectores y Memoización (2-3 horas)

**Objetivo:** Eliminar re-renders innecesarios sin cambiar la arquitectura.

#### Tarea 1.1: Agregar `useShallow` en selectores de Zustand

**Archivos:** Todos los `.tsx` que usen stores de Zustand.

**Problema:** Sin `useShallow`, el selector `useCartStore(state => state.items)` devuelve un nuevo array cada vez, causando re-render incluso si los items no cambiaron.

**Cambio:** Envolver selectores de objetos/arrays con `useShallow`:

```typescript
// Antes
const items = useCartStore(state => state.items);

// Despues
import { useShallow } from 'zustand/react/shallow';
const items = useCartStore(useShallow(state => state.items));
```

**Archivos afectados:** `Sales.tsx`, `Purchases.tsx`, `CartPanel.tsx`, y cualquier componente que consuma Zustand.

#### Tarea 1.2: Agregar `React.memo` a componentes de lista

**Problema:** Al cambiar el estado global, todos los items de una lista se re-renderizan aunque no hayan cambiado.

**Cambio:** Envolver componentes de fila/tarjeta con `React.memo`:

```typescript
const ProductCard = React.memo(({ product, onAdd }: ProductCardProps) => {
  return (
    <div onClick={() => onAdd(product)}>
      <span>{product.name}</span>
      <span>${product.price_sale}</span>
    </div>
  );
});
```

**Archivos afectados:**
- `Sales.tsx` — tarjetas de producto en la grilla (`filteredProducts.map`)
- `Purchases.tsx` — filas de items de compra
- `Products.tsx` — filas de la tabla de productos
- Todos los `.map()` que rendericen listas estables

#### Tarea 1.3: Agregar `useMemo` en cálculos derivados

**Problema:** `filteredProducts`, `getTotal()`, y otros cálculos se ejecutan en cada render aunque los inputs no hayan cambiado.

**Cambio:**

```typescript
// Antes
const filteredProducts = products.filter(p => 
  p.sku.includes(searchTerm) || p.name.includes(searchTerm)
);

// Despues
const filteredProducts = useMemo(() => 
  products.filter(p => 
    p.sku.includes(searchTerm) || p.name.includes(searchTerm)
  ),
  [products, searchTerm]
);
```

**Archivos afectados:**
- `Sales.tsx:284` — `filteredProducts`
- `CartPanel.tsx` — `getTotal()`, subtotales
- `Dashboard.tsx` — cálculos de estadísticas
- Todos los `.filter()`, `.reduce()`, `.sort()` en renders

#### Tarea 1.4: Agregar `useCallback` en handlers de eventos

**Problema:** Funciones como `onClick`, `onChange` se recrean en cada render, rompiendo la memoización de componentes hijos.

**Cambio:** Envolver handlers estables con `useCallback`:

```typescript
const handleAddProduct = useCallback((product: Product) => {
  addItem(product);
}, [addItem]);
```

**Archivos afectados:** Componentes que pasen callbacks a hijos memoizados.

---

### Sprint 2 — Sistema de Caché con Stale-While-Revalidate (3-4 horas)

**Objetivo:** Evitar refetches innecesarios al navegar entre páginas.

#### Tarea 2.1: Extender `useCacheStore` con genéricos

**Cambio:** Agregar un sistema de caché genérico con TTL configurable:

```typescript
// useStore.ts
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

interface CacheState {
  entries: Record<string, CacheEntry<any>>;
  set: <T>(key: string, data: T) => void;
  get: <T>(key: string, ttlMs?: number) => T | null;
  invalidate: (key: string) => void;
  invalidateAll: () => void;
}

// Uso:
const productsCache = useCacheStore(s => s.get<Product[]>('products'));
if (!productsCache) {
  const data = await window.api.getAllProducts();
  useCacheStore.getState().set('products', data);
}
```

#### Tarea 2.2: Crear hook `useCachedData`

```typescript
function useCachedData<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlMs = 300000 // 5 min
): { data: T | null; loading: boolean; refresh: () => Promise<void> } {
  const cacheStore = useCacheStore();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<T | null>(() => cacheStore.get<T>(key));

  const fetch = useCallback(async () => {
    setLoading(true);
    const result = await fetcher();
    cacheStore.set(key, result);
    setData(result);
    setLoading(false);
  }, [key, fetcher]);

  useEffect(() => {
    if (!cacheStore.get<T>(key)) fetch();
  }, [key]);

  return { data, loading, refresh: fetch };
}

// Uso en páginas:
const { data: products, loading } = useCachedData('products', 
  () => window.api.getAllProducts(), 
  300000
);
```

#### Tarea 2.3: Invalidar caché en mutaciones

Agregar llamadas a `invalidate()` después de crear/actualizar/eliminar:

```typescript
// Despues de crear un producto:
useCacheStore.getState().invalidate('products');
```

---

### Sprint 3 — IndexedDB como Persistencia (4-6 horas)

**Objetivo:** Reemplazar localStorage con IndexedDB para mejor rendimiento con datos grandes.

#### Tarea 3.1: Instalar `idb` wrapper

```bash
pnpm add idb
```

#### Tarea 3.2: Crear capa de persistencia `db.ts`

```typescript
// src/mock/db.ts
import { openDB, type IDBPDatabase } from 'idb';

interface PosDB {
  products: Product[];
  sales: Sale[];
  purchases: Purchase[];
  // ... otras entidades
}

let dbPromise: Promise<IDBPDatabase<PosDB>>;

export function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<PosDB>('pos-web', 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('products')) db.createObjectStore('products', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('sales')) db.createObjectStore('sales', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('purchases')) db.createObjectStore('purchases', { keyPath: 'id' });
        // ... demás stores
      },
    });
  }
  return dbPromise;
}
```

#### Tarea 3.3: Migrar operaciones CRUD a IndexedDB

```typescript
// En mockApi.ts — cambiar de localStorage a IndexedDB

async function getAllProducts(search?: string) {
  const db = await getDB();
  let products = await db.getAll('products');
  if (search) {
    const q = search.toLowerCase();
    products = products.filter(p => 
      p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)
    );
  }
  return products;
}

async function createProduct(data: CreateProductDTO) {
  const db = await getDB();
  const id = await getNextId('products');
  const product = { ...data, id, stock: 0, created_at: new Date(), updated_at: new Date() };
  await db.add('products', product);
  return { success: true, id };
}
```

**Ventajas de IndexedDB vs localStorage:**
| Aspecto | localStorage | IndexedDB |
|---------|-------------|-----------|
| Límite | ~5MB | ~250MB+ |
| Operaciones | Síncronas (bloquean UI) | Asíncronas |
| Serialización | JSON.stringify completo | Por registro |
| Consultas | Solo clave-valor | Índices, rangos, cursores |
| Rendimiento en datos grandes | Degrada severamente | Estable |

#### Tarea 3.4: Migrar persistencia de Zustand a IndexedDB

```typescript
// En useStore.ts — adaptar persist middleware
import { createJSONStorage } from 'zustand/middleware';

const indexedDBStorage = {
  getItem: async (name: string) => {
    const db = await getDB();
    const store = await db.get('zustand', name);
    return store?.value || null;
  },
  setItem: async (name: string, value: string) => {
    const db = await getDB();
    await db.put('zustand', { key: name, value });
  },
  removeItem: async (name: string) => {
    const db = await getDB();
    await db.delete('zustand', name);
  },
};

// Uso:
export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({ /* ... */ }),
    { name: 'cart-storage', storage: createJSONStorage(() => indexedDBStorage) }
  )
);
```

**Advertencia:** IndexedDB es asíncrono pero los stores de Zustand con persist middleware sincronizan la carga inicial. Esto puede causar un flash de contenido vacío hasta que los datos se carguen. Implementar un estado de "hydrated" para manejarlo.

#### Tarea 3.5: Migrar seed data a IndexedDB

Modificar `seed.ts` para que inserte los datos iniciales en IndexedDB si la DB está vacía, en vez de devolver un objeto y que `loadData()` lo guarde.

---

### Sprint 4 — Refinamiento y Performance (2-3 horas)

**Objetivo:** Optimizaciones adicionales y limpieza.

#### Tarea 4.1: Lazy loading de datos mock

No cargar todas las entidades al inicio. Usar carga bajo demanda:

```typescript
// En vez de cargar todo AppData en setupMockApi():
let dataCache: Partial<AppData> = {};

async function ensureLoaded(entity: string) {
  if (!dataCache[entity]) {
    const db = await getDB();
    dataCache[entity] = await db.getAll(entity);
  }
  return dataCache[entity];
}
```

#### Tarea 4.2: Debounce en saves

Si se mantiene localStorage, agregar debounce para acumular cambios:

```typescript
let saveTimeout: NodeJS.Timeout;
function debouncedSave(data: AppData) {
  clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => saveData(data), 1000);
}
```

#### Tarea 4.3: Virtualización de listas grandes

Para tablas con cientos de filas, usar `react-window`:

```bash
pnpm add react-window @types/react-window
```

```typescript
import { FixedSizeList as List } from 'react-window';

<List
  height={400}
  itemCount={products.length}
  itemSize={50}
>
  {({ index, style }) => (
    <div style={style}>
      {products[index].name} - ${products[index].price_sale}
    </div>
  )}
</List>
```

**Archivos candidatos:** Pantallas de productos (con paginación ya existe, pero si crece), historial de ventas, movimientos de inventario.

---

## Priorización y Roadmap

| Sprint | Dependencias | Esfuerzo | Impacto |
|--------|-------------|----------|---------|
| **Sprint 1** — Selectores + Memo | Ninguna | 3h | ⭐⭐⭐ Alto (UX: menos lag visual) |
| **Sprint 2** — Caché SWR | Sprint 1 | 4h | ⭐⭐⭐ Alto (menos llamadas API) |
| **Sprint 3** — IndexedDB | Sprint 1,2 | 6h | ⭐⭐ Medio (preparación para escalar) |
| **Sprint 4** — Refinamiento | Sprint 3 | 3h | ⭐ Bajo (pulido) |

**Orden recomendado:** Sprint 1 → Sprint 2 → (Sprint 3 opcional si la app crece)

### Criterio para decidir Sprint 3

Ejecutar en consola para medir el tamaño actual:

```typescript
const size = new Blob([localStorage.getItem('pos-web-data')]).size;
console.log(`Mock DB size: ${(size / 1024).toFixed(1)} KB`);
```

- Si `size < 100 KB`: localStorage es suficiente, priorizar Sprint 1 y 2
- Si `size > 500 KB`: migrar a IndexedDB (Sprint 3)
- Si `size > 1 MB`: migración urgente a IndexedDB
