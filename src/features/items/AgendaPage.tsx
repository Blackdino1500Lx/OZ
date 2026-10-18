import { useState } from 'react';
import { useItems } from './hooks';
import { ItemCard } from './ItemCard';
import { useCategories } from '@/features/categories/hooks';
import { addDays, isWithinInterval, startOfDay, endOfDay, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { type ItemWithCategory } from './api';

export function AgendaPage() {
  const { data: items, isLoading } = useItems();
  const { data: categories } = useCategories();
  
  const [range, setRange] = useState<'7' | '30'>('7');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('pendiente');

  if (isLoading) return <div className="text-center py-8 text-muted-foreground">Cargando agenda...</div>;

  const today = new Date();
  const endDate = addDays(today, parseInt(range));
  const startInterval = startOfDay(today);
  const endInterval = endOfDay(endDate);

  // Filter items
  const filteredItems = (items || []).filter((item) => {
    if (!item.starts_at) return false;
    const itemDate = new Date(item.starts_at);
    
    // Range filter
    if (!isWithinInterval(itemDate, { start: startInterval, end: endInterval })) return false;
    
    // Category filter
    if (filterCategory !== 'all' && item.category_id !== filterCategory) return false;
    
    // Status filter
    if (filterStatus !== 'all' && item.status !== filterStatus) return false;
    
    return true;
  });

  // Group by date
  const grouped = filteredItems.reduce<Record<string, ItemWithCategory[]>>((acc, item) => {
    // item.starts_at is guaranteed here because of the filter above
    const dateKey = format(new Date(item.starts_at!), 'yyyy-MM-dd');
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(item);
    return acc;
  }, {});

  const sortedDates = Object.keys(grouped).sort();

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight">Agenda</h1>
        
        <div className="flex flex-wrap gap-2">
          {/* Range Toggle */}
          <div className="flex bg-muted rounded-md p-1">
            <button
              onClick={() => setRange('7')}
              className={`px-3 py-1 text-sm rounded-sm transition-colors ${range === '7' ? 'bg-background shadow-sm font-medium' : 'text-muted-foreground hover:text-foreground'}`}
            >
              7 días
            </button>
            <button
              onClick={() => setRange('30')}
              className={`px-3 py-1 text-sm rounded-sm transition-colors ${range === '30' ? 'bg-background shadow-sm font-medium' : 'text-muted-foreground hover:text-foreground'}`}
            >
              30 días
            </button>
          </div>

          {/* Filters */}
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="all">Todas las categorías</option>
            {categories?.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="all">Todos los estados</option>
            <option value="pendiente">Pendientes</option>
            <option value="hecho">Hechos</option>
            <option value="cancelado">Cancelados</option>
          </select>
        </div>
      </div>

      <div className="space-y-8">
        {sortedDates.map((dateKey) => (
          <section key={dateKey} className="space-y-3">
            <h2 className="text-sm font-semibold tracking-tight uppercase text-muted-foreground border-b pb-2">
              {format(new Date(dateKey + 'T12:00:00'), "EEEE d 'de' MMMM", { locale: es })}
            </h2>
            <div className="space-y-2">
              {grouped[dateKey].map((item) => (
                <ItemCard key={item.id} item={item} />
              ))}
            </div>
          </section>
        ))}

        {sortedDates.length === 0 && (
          <div className="text-center py-12 border rounded-lg bg-card/50">
            <p className="text-muted-foreground">No hay ítems en este rango de fechas con los filtros seleccionados.</p>
          </div>
        )}
      </div>
    </div>
  );
}