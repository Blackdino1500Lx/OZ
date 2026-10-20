import { useParams, useNavigate, Link } from 'react-router-dom';
import { useItems, useUpdateItemStatus, useDeleteItem } from './hooks';
import { NotesList } from '@/features/notes/NotesList';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { ItemStatus } from '@/types/database';

export function ItemDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: items, isLoading } = useItems();
  const updateStatus = useUpdateItemStatus();
  const deleteItem = useDeleteItem();

  if (isLoading) return <div className="p-4 text-center text-muted-foreground">Cargando...</div>;

  const item = items?.find((i) => i.id === id);

  if (!item) {
    return (
      <div className="p-8 text-center space-y-4">
        <p className="text-muted-foreground">Ítem no encontrado o eliminado.</p>
        <Button asChild variant="outline">
          <Link to="/">Volver a Hoy</Link>
        </Button>
      </div>
    );
  }

  const isDone = item.status === 'hecho';
  const isCanceled = item.status === 'cancelado';
  const catColor = item.categories?.color || '#cbd5e1';

  const handleDelete = () => {
    if (confirm('¿Eliminar este ítem y sus notas?')) {
      deleteItem.mutate(item.id, { onSuccess: () => navigate('/') });
    }
  };

  const handleStatusChange = (newStatus: ItemStatus) => {
    updateStatus.mutate({ id: item.id, status: newStatus });
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
        <Link to="/" className="hover:text-foreground">Hoy</Link>
        <span>/</span>
        <span className="text-foreground font-medium truncate">{item.title}</span>
      </div>

      <div className="bg-card border rounded-lg p-6 shadow-sm relative overflow-hidden">
        <div className="absolute left-0 top-0 bottom-0 w-2" style={{ backgroundColor: catColor }} />
        
        <div className="flex items-start justify-between gap-4 pl-2">
          <div className="space-y-3 flex-1">
            <div className="flex items-center gap-3">
              <h1 className={cn(
                "text-2xl font-bold tracking-tight",
                (isDone || isCanceled) && "line-through text-muted-foreground"
              )}>
                {item.title}
              </h1>
            </div>
            
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
              <span className="capitalize font-medium" style={{ color: catColor }}>{item.categories?.name}</span>
              <span>•</span>
              <span className="capitalize">{item.kind}</span>
              <span>•</span>
              <span>
                {item.starts_at 
                  ? item.all_day 
                    ? format(new Date(item.starts_at), "PPP", { locale: es }) + ' (Todo el día)'
                    : format(new Date(item.starts_at), "PPP p", { locale: es }) 
                  : 'Sin fecha'}
              </span>
              {item.priority > 0 && (
                <>
                  <span>•</span>
                  <span className={item.priority === 2 ? 'text-destructive font-medium' : ''}>
                    Prioridad {item.priority === 2 ? 'Alta' : 'Media'}
                  </span>
                </>
              )}
            </div>

            {/* Selector de Estado */}
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs font-semibold uppercase text-muted-foreground">Estado:</span>
              <select
                value={item.status}
                onChange={(e) => handleStatusChange(e.target.value as ItemStatus)}
                className="h-8 rounded-md border border-input bg-transparent px-2 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                disabled={updateStatus.isPending}
              >
                <option value="pendiente">Pendiente</option>
                <option value="en_curso">En curso</option>
                <option value="hecho">Hecho</option>
                <option value="cancelado">Cancelado</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Button asChild variant="outline" size="sm">
              <Link to={`/items/${item.id}/edit`}>Editar</Link>
            </Button>
            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={handleDelete}>
              Borrar
            </Button>
          </div>
        </div>

        {item.description && (
          <div className="mt-6 ml-2 text-sm whitespace-pre-wrap text-foreground/80 bg-muted/30 p-3 rounded-md">
            {item.description}
          </div>
        )}
      </div>

      <NotesList itemId={item.id} />
    </div>
  );
}