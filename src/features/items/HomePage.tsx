import { useState } from 'react';
import { useAuth } from '@/features/auth/AuthContext';
import { useItems } from './hooks';
import { ItemCard } from './ItemCard';
import { ItemForm } from './ItemForm';
import { Button } from '@/components/ui/button';
import { startOfDay, isToday, isBefore } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { type ItemWithCategory } from './api';

const TIMEZONE = 'America/Costa_Rica';

export function HomePage() {
  const { user } = useAuth();
  const { data: items, isLoading } = useItems();
  const [isFormOpen, setIsFormOpen] = useState(false);

  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">Cargando ítems...</div>;
  }

  const nowZoned = toZonedTime(new Date(), TIMEZONE);
  const startTodayZoned = startOfDay(nowZoned);

  const overdue: ItemWithCategory[] = [];
  const morning: ItemWithCategory[] = [];
  const afternoon: ItemWithCategory[] = [];
  const evening: ItemWithCategory[] = [];
  const noDate: ItemWithCategory[] = [];

  (items || []).forEach((item) => {
    if (item.status === 'hecho' || item.status === 'cancelado') return;

    if (!item.starts_at) {
      noDate.push(item);
      return;
    }

    const itemDateZoned = toZonedTime(new Date(item.starts_at), TIMEZONE);
    
    if (isBefore(itemDateZoned, startTodayZoned)) {
      overdue.push(item);
    } else if (isToday(itemDateZoned)) {
      const hour = itemDateZoned.getHours();
      if (hour < 12) morning.push(item);
      else if (hour < 18) afternoon.push(item);
      else evening.push(item);
    }
  });

  const renderSection = (title: string, list: ItemWithCategory[], isOverdue = false) => {
    if (list.length === 0) return null;
    return (
      <section className="space-y-3">
        <h2 className={`text-sm font-semibold tracking-tight uppercase ${isOverdue ? 'text-destructive' : 'text-muted-foreground'}`}>
          {title}
        </h2>
        <div className="space-y-2">
          {list.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      </section>
    );
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Hoy</h1>
          <p className="text-sm text-muted-foreground">Hola, {user?.email?.split('@')[0]}</p>
        </div>
        {!isFormOpen && (
          <Button onClick={() => setIsFormOpen(true)}>Nuevo ítem</Button>
        )}
      </div>

      {isFormOpen && <ItemForm onCancel={() => setIsFormOpen(false)} />}

      <div className="space-y-6">
        {renderSection('Atrasados', overdue, true)}
        {renderSection('Mañana', morning)}
        {renderSection('Tarde', afternoon)}
        {renderSection('Noche', evening)}
        {renderSection('Sin fecha', noDate)}

        {overdue.length === 0 && morning.length === 0 && afternoon.length === 0 && evening.length === 0 && noDate.length === 0 && !isFormOpen && (
          <div className="text-center py-12 border rounded-lg bg-card/50">
            <p className="text-muted-foreground">No hay nada pendiente para hoy.</p>
            <Button variant="link" onClick={() => setIsFormOpen(true)}>Crear mi primer ítem</Button>
          </div>
        )}
      </div>
    </div>
  );
}