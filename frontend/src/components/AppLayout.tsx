import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { useAuth } from '../context/useAuth';

/** Signed-in shell: brand on the left, the current user and sign-out on the right. */
export function AppLayout({ children }: { children: ReactNode }) {
  const { user, isAdmin, logout } = useAuth();

  return (
    <div className="min-h-screen">
      <header className="border-b border-asphalt-700 bg-asphalt-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-4">
            <Link to="/" className="font-display text-2xl font-black tracking-tight uppercase hover:opacity-90">
              Lot<span className="text-paint">line</span>
            </Link>
            <nav className="hidden sm:flex items-center gap-3 text-xs font-mono">
              <Link to="/" className="text-asphalt-300 hover:text-paint transition-colors">
                Lot Inventory
              </Link>
              <Link to="/help" className="text-asphalt-300 hover:text-paint transition-colors flex items-center gap-1">
                <span>Help & Contact</span>
                <span className="rounded bg-paint/20 px-1 py-0.2 text-[9px] font-bold text-paint uppercase">Chinmay</span>
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Link to="/help" className="sm:hidden text-xs text-paint font-mono">
              Help
            </Link>
            <span className="hidden text-asphalt-300 sm:inline">{user?.name}</span>
            {isAdmin && (
              <span className="rounded-sm bg-paint px-1.5 py-0.5 font-mono text-[10px] font-semibold tracking-[0.14em] text-ink uppercase">
                Admin
              </span>
            )}
            <button type="button" className="btn-ghost px-3 py-1.5" onClick={logout}>
              Sign out
            </button>
          </div>
        </div>
      </header>
      {children}
    </div>
  );
}
