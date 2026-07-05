import { useCallback } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useNotificationStore } from '../store/useStore.ts';

interface UseToastReturn {
  toasts: any[];
  toast: (message: string, type: 'success' | 'error' | 'warning' | 'info', duration?: number) => void;
  success: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
  warning: (message: string, duration?: number) => void;
  info: (message: string, duration?: number) => void;
  removeToast: (id: string) => void;
}

export function useToast(): UseToastReturn {
  const { toasts, addToast, removeToast } = useNotificationStore(
    useShallow(s => ({ toasts: s.toasts, addToast: s.addToast, removeToast: s.removeToast }))
  );

  const toast = useCallback(
    (message: string, type: 'success' | 'error' | 'warning' | 'info', duration?: number) => {
      addToast(message, type, duration);
    },
    [addToast],
  );

  const success = useCallback(
    (message: string, duration?: number) => {
      toast(message, 'success', duration);
    },
    [toast],
  );

  const error = useCallback(
    (message: string, duration?: number) => {
      toast(message, 'error', duration);
    },
    [toast],
  );

  const warning = useCallback(
    (message: string, duration?: number) => {
      toast(message, 'warning', duration);
    },
    [toast],
  );

  const info = useCallback(
    (message: string, duration?: number) => {
      toast(message, 'info', duration);
    },
    [toast],
  );

  return {
    toasts,
    toast,
    success,
    error,
    warning,
    info,
    removeToast,
  };
}
