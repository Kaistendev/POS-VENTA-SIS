import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, CashRegister } from '../common/types.js';

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
