import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { User, CashRegister, Product } from '../../shared/types.js';
import { zustandStorage } from '../mock/db.ts';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (user: User) => void;
  logout: () => void;
}

interface CashState {
  activeRegister: CashRegister | null;
  setActiveRegister: (register: CashRegister | null) => void;
}

interface UIState {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
}

export interface CartItem {
  id: number;
  sku: string;
  name: string;
  price: number;
  qty: number;
  stock?: number;
}

interface CartState {
  items: CartItem[];
  suspendedCarts: { id: string; items: CartItem[]; name: string }[];
  addItem: (product: Product) => void;
  removeItem: (id: number) => void;
  updateQty: (id: number, qty: number) => void;
  clearCart: () => void;
  getTotal: () => number;
  suspendCart: (name: string) => void;
  resumeCart: (id: string) => void;
}

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

interface NotificationState {
  toasts: Toast[];
  addToast: (message: string, type: Toast['type'], duration?: number) => void;
  removeToast: (id: string) => void;
}

interface CacheState {
  categories: { id: number; name: string }[];
  settings: Record<string, string>;
  categoriesTimestamp: number;
  settingsTimestamp: number;
  setCategories: (categories: { id: number; name: string }[]) => void;
  setSettings: (settings: Record<string, string>) => void;
  getCategories: () => { id: number; name: string }[] | null;
  getSettings: () => Record<string, string> | null;
  isCategoriesValid: (ttlMs?: number) => boolean;
  isSettingsValid: (ttlMs?: number) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      login: (user) => set({ user, isAuthenticated: true }),
      logout: () => set({ user: null, isAuthenticated: false }),
    }),
    { name: 'auth-storage', storage: createJSONStorage(() => zustandStorage) }
  )
);

export const useCashStore = create<CashState>()((set) => ({
  activeRegister: null,
  setActiveRegister: (register) => set({ activeRegister: register }),
}));

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      suspendedCarts: [],
      addItem: (product) => {
        const items = get().items;
        const existingItem = items.find((item) => item.id === product.id);

        if (existingItem) {
          const newQty = existingItem.qty + 1;
          // Check stock limit
          if (existingItem.stock !== undefined && newQty > existingItem.stock) {
            return; // Silently prevent exceeding stock
          }
          set({
            items: items.map((item) =>
              item.id === product.id ? { ...item, qty: newQty } : item
            ),
          });
        } else if (product.id !== undefined) {
          // Check if product has stock
          if (product.stock !== undefined && product.stock <= 0) {
            return; // No stock available
          }
          set({
            items: [
              ...items,
              {
                id: product.id,
                sku: product.sku,
                name: product.name,
                price: product.price_sale,
                qty: 1,
                stock: product.stock,
              },
            ],
          });
        }
      },
      removeItem: (id) =>
        set({ items: get().items.filter((item) => item.id !== id) }),
      updateQty: (id, qty) => {
        const items = get().items;
        const item = items.find(i => i.id === id);
        if (!item) return;
        
        let newQty = Math.max(1, qty);
        // Enforce stock limit
        if (item.stock !== undefined && newQty > item.stock) {
          newQty = item.stock;
        }
        
        set({
          items: items.map((item) =>
            item.id === id ? { ...item, qty: newQty } : item
          ),
        });
      },
      clearCart: () => set({ items: [] }),
      getTotal: () =>
        get().items.reduce((acc, item) => acc + item.price * item.qty, 0),
      suspendCart: (name) => {
        const id = Date.now().toString();
        set({
          suspendedCarts: [...get().suspendedCarts, { id, items: get().items, name }],
          items: []
        });
      },
      resumeCart: (id) => {
        const cart = get().suspendedCarts.find(c => c.id === id);
        if (cart) {
          set({
            items: cart.items,
            suspendedCarts: get().suspendedCarts.filter(c => c.id !== id)
          });
        }
      }
    }),
    { name: 'cart-storage', storage: createJSONStorage(() => zustandStorage) }
  )
);

export const useNotificationStore = create<NotificationState>()((set) => ({
  toasts: [],
  addToast: (message, type, duration = 5000) => {
    const id = Math.random().toString(36).substring(2, 9);
    set((state) => ({
      toasts: [...state.toasts, { id, message, type, duration }],
    }));

    if (duration > 0) {
      setTimeout(() => {
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        }));
      }, duration);
    }
  },
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
}));

export const useCacheStore = create<CacheState>()(
  persist(
    (set, get) => ({
      categories: [],
      settings: {},
      categoriesTimestamp: 0,
      settingsTimestamp: 0,
      setCategories: (categories) => set({ categories, categoriesTimestamp: Date.now() }),
      setSettings: (settings) => set({ settings, settingsTimestamp: Date.now() }),
      getCategories: () => get().categories,
      getSettings: () => get().settings,
      isCategoriesValid: (ttlMs = 300000) => Date.now() - get().categoriesTimestamp < ttlMs,
      isSettingsValid: (ttlMs = 60000) => Date.now() - get().settingsTimestamp < ttlMs,
    }),
    {
      name: 'cache-storage',
      storage: createJSONStorage(() => zustandStorage),
      partialize: (state) => ({
        categories: state.categories,
        settings: state.settings,
        categoriesTimestamp: state.categoriesTimestamp,
        settingsTimestamp: state.settingsTimestamp,
      }),
    }
  )
);

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
    }),
    { name: 'ui-storage', storage: createJSONStorage(() => zustandStorage) }
  )
);
