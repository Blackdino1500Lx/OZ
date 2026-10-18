import { useParams, useNavigate, Link } from 'react-router-dom';
import { useItems, useToggleItemStatus, useDeleteItem } from './hooks';
import { NotesList } from '@/features/notes/NotesList';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export function ItemDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: items, isLoading } = useItems();
  const toggleStatus = useToggleItemStatus();
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
  const catColor = item.categories?.color || '#cbd5e1';

  const handleDelete = () => {
    if (confirm('¿Eliminar este ítem y sus notas?')) {
      deleteItem.mutate(item.id, { onSuccess: () => navigate('/') });
    }
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
          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-3">
              <button
                onClick={() => toggleStatus.mutate({ id: item.id, currentStatus: item.status })}
                className={cn(
                  "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors flex-shrink-0",
                  isDone ? "bg-primary border-primary text-primary-foreground" : "border-muted-foreground hover:border-primary"
                )}
              >
                {isDone && <span className="text-sm">✓</span>}
              </button>
              <h1 className={cn("text-2xl font-bold tracking-tight", isDone && "line-through text-muted-foreground")}>
                {item.title}
              </h1>
            </div>
            
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 ml-9 text-sm text-muted-foreground">
              <span className="capitalize font-medium" style={{ color: catColor }}>{item.categories?.name}</span>
              <span>•</span>
              <span className="capitalize">{item.kind}</span>
              <span>•</span>
              <span>{item.starts_at ? format(new Date(item.starts_at), "PPP p", { locale: es }) : 'Sin fecha'}</span>
              {item.priority > 0 && (
                <>
                  <span>•</span>
                  <span className={item.priority === 2 ? 'text-destructive font-medium' : ''}>
                    Prioridad {item.priority === 2 ? 'Alta' : 'Media'}
                  </span>
                </>
              )}
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
          <div className="mt-6 ml-9 text-sm whitespace-pre-wrap text-foreground/80 bg-muted/30 p-3 rounded-md">
            {item.description}
          </div>
        )}
      </div>

      <NotesList itemId={item.id} />
    </div>
  );
}