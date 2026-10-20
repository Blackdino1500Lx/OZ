import { useItems } from '@/features/items/hooks';
import { useToggleItemStatus } from '@/features/items/hooks';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

export function PersistentBanner() {
  const { data: items } = useItems();
  const toggleStatus = useToggleItemStatus();

  // Filtramos las tareas de Prioridad Alta o Recordatorios que no estén hechas
  const criticalItems = items?.filter(
    (item) => (item.priority === 2 || item.kind === 'recordatorio') && 
              item.status !== 'hecho' && 
              item.status !== 'cancelado'
  ) || [];

  if (criticalItems.length === 0) return null;

  return (
    <div className="bg-destructive/10 border-b border-destructive/20 text-destructive px-4 py-2 flex flex-col gap-2">
      <div className="flex items-center gap-2 font-semibold text-sm">
        <AlertCircle className="w-4 h-4" />
        <span>Tienes {criticalItems.length} tarea(s) crítica(s) pendiente(s)</span>
      </div>
      <div className="flex flex-col gap-2">
        {criticalItems.map((item) => (
          <div key={item.id} className="flex items-center justify-between bg-background/50 rounded p-2 text-sm shadow-sm">
            <Link to={`/items/${item.id}`} className="font-medium hover:underline flex-1 truncate pr-2 text-foreground">
              {item.title}
            </Link>
            <Button
              size="sm"
              variant="outline"
              className="h-7 px-2 text-xs border-destructive/30 hover:bg-destructive hover:text-white"
              onClick={() => toggleStatus.mutate({ id: item.id, currentStatus: item.status })}
            >
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Completar
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}