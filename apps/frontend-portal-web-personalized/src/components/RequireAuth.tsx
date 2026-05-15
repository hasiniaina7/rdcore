import type { PropsWithChildren } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../modules/auth/AuthProvider';

export default function RequireAuth({ children }: PropsWithChildren) {
  const { session } = useAuth();
  const location = useLocation();

  if (!session) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  return <>{children}</>;
}
