import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router';
import { useAuth } from '../context/AuthContext';

function SessionCheck() {
  return (
    <div role="status" className="grid min-h-screen place-items-center font-mono text-sm text-asphalt-300">
      Checking your session…
    </div>
  );
}

/** Renders its children only for signed-in users; everyone else is sent to /login. */
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return <SessionCheck />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return children;
}

/** Renders its children only for visitors who are not signed in (login / register). */
export function GuestRoute({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) return <SessionCheck />;
  if (user) return <Navigate to="/" replace />;
  return children;
}
