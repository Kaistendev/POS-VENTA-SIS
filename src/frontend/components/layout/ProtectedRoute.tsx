import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useShallow } from 'zustand/react/shallow';
import { useAuthStore } from '../../store/useStore.ts';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export function ProtectedRoute({ children, allowedRoles = [] }: ProtectedRouteProps) {
  const [hydrated, setHydrated] = useState(() => useAuthStore.persist.hasHydrated());

  useEffect(() => {
    if (!hydrated) {
      const unsub = useAuthStore.persist.onFinishHydration(() => setHydrated(true));
      return unsub;
    }
  }, [hydrated]);

  const { user, isAuthenticated } = useAuthStore(
    useShallow(s => ({ user: s.user, isAuthenticated: s.isAuthenticated }))
  );

  if (!hydrated) return null;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && user?.role && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}