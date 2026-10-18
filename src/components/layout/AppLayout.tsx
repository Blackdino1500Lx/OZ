import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/features/auth/AuthContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function AppLayout() {
  const { signOut } = useAuth();
  const location = useLocation();
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const navItems = [
    { path: '/', label: 'Hoy' },
    { path: '/agenda', label: 'Agenda' },
    { path: '/search', label: 'Buscar' },
    { path: '/categories', label: 'Categorías' },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {isOffline && (
        <div className="bg-amber-500 text-amber-950 text-xs font-medium text-center py-1 px-4">
          Estás sin conexión. Los cambios se guardarán localmente y se sincronizarán al volver.
        </div>
      )}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <nav className="flex items-center gap-4 sm:gap-6 overflow-x-auto">
            <span className="font-bold text-lg tracking-tight mr-2 hidden sm:block">Organizador</span>
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'text-sm font-medium transition-colors hover:text-primary whitespace-nowrap',
                  location.pathname === item.path ? 'text-foreground border-b-2 border-primary' : 'text-muted-foreground'
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <Button variant="ghost" size="sm" onClick={() => void signOut()}>
            Salir
          </Button>
        </div>
      </header>
      <main className="flex-1 container mx-auto p-4 md:p-8 max-w-3xl">
        <Outlet />
      </main>
    </div>
  );
}