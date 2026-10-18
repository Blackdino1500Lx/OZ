import { useParams, useNavigate, Link } from 'react-router-dom';
import { useItems } from './hooks';
import { ItemForm } from './ItemForm';
import { Button } from '@/components/ui/button';

export function ItemEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: items, isLoading } = useItems();

  if (isLoading) return <div className="p-4 text-center text-muted-foreground">Cargando...</div>;

  const item = items?.find((i) => i.id === id);

  if (!item) {
    return (
      <div className="p-8 text-center space-y-4">
        <p className="text-muted-foreground">Ítem no encontrado.</p>
        <Button asChild variant="outline">
          <Link to="/">Volver a Hoy</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Editar ítem</h1>
      <ItemForm 
        initialData={item} 
        onCancel={() => navigate(`/items/${item.id}`)} 
      />
    </div>
  );
}