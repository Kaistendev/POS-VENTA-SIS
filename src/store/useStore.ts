import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, CashRegister, Product } from '../common/types.js';

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
  addItem: (product: Product) => void;
  removeItem: (id: number) => void;
  updateQty: (id: number, qty: number) => void;
  clearCart: () => void;
  getTotal: () => number;
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

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      login: (user) => set({ user, isAuthenticated: true }),
      logout: () => set({ user: null, isAuthenticated: false }),
    }),
    { name: 'auth-storage' }
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
      addItem: (product) => {
        const items = get().items;
        const existingItem = items.find((item) => item.id === product.id);

        if (existingItem) {
          set({
            items: items.map((item) =>
              item.id === product.id ? { ...item, qty: item.qty + 1 } : item
            ),
          });
        } else {
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
      updateQty: (id, qty) =>
        set({
          items: get().items.map((item) =>
            item.id === id ? { ...item, qty: Math.max(1, qty) } : item
          ),
        }),
      clearCart: () => set({ items: [] }),
      getTotal: () =>
        get().items.reduce((acc, item) => acc + item.price * item.qty, 0),
    }),
    { name: 'cart-storage' }
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
