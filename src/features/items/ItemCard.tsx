import { Link } from 'react-router-dom';
import { type ItemWithCategory } from './api';
import { useToggleItemStatus } from './hooks';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export function ItemCard({ item }: { item: ItemWithCategory }) {
  const toggleStatus = useToggleItemStatus();
  const isDone = item.status === 'hecho';
  const isCanceled = item.status === 'cancelado';
  const isInProgress = item.status === 'en_curso';
  const catColor = item.categories?.color || '#cbd5e1';

  return (
    <div className={cn(
      "relative flex items-center gap-3 p-3 rounded-md border bg-card transition-opacity hover:bg-accent/5",
      (isDone || isCanceled) && "opacity-60",
      isInProgress && "border-primary/50 bg-primary/5"
    )}>
      <div className="absolute left-0 top-0 bottom-0 w-1.5 rounded-l-md" style={{ backgroundColor: catColor }} />
      
      <div className="pl-2 flex-1 min-w-0 flex items-center gap-3">
        <button
          onClick={(e) => {
            e.preventDefault();
            if (isCanceled) return;
            toggleStatus.mutate({ id: item.id, currentStatus: item.status });
          }}
          className={cn(
            "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors flex-shrink-0 z-10",
            isDone ? "bg-primary border-primary text-primary-foreground" : 
            isCanceled ? "border-muted-foreground bg-muted" : 
            "border-muted-foreground hover:border-primary"
          )}
          disabled={isCanceled}
        >
          {isDone && <span className="text-xs">✓</span>}
          {isCanceled && <span className="text-xs">✕</span>}
        </button>
        
        <Link to={`/items/${item.id}`} className="flex-1 min-w-0 block">
          <div className="flex items-center gap-2">
            <span className={cn(
              "font-medium text-sm truncate", 
              (isDone || isCanceled) && "line-through text-muted-foreground"
            )}>
              {item.title}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-muted-foreground">
            <span className="capitalize">{item.categories?.name}</span>
            
            {item.starts_at && (
              <>
                <span>•</span>
                <span>{format(new Date(item.starts_at), "HH:mm", { locale: es })}</span>
              </>
            )}
            
            {item.recurrence_rule && (
              <>
                <span>•</span>
                <span className="text-blue-500 font-medium">↻ Recurrente</span>
              </>
            )}

            {isInProgress && (
              <>
                <span>•</span>
                <span className="text-primary font-medium">En curso</span>
              </>
            )}

            {item.priority === 2 && (
              <>
                <span>•</span>
                <span className="text-destructive font-medium">Alta</span>
              </>
            )}
          </div>
        </Link>
      </div>
    </div>
  );
}