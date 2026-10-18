import { useEffect, useState } from 'react';
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from './hooks';
import { CategoryForm } from './CategoryForm';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { type Category } from '@/types/database';

const DEFAULT_CATEGORIES = [
  { name: 'Trabajo', color: '#3B82F6', sort_order: 1 },
  { name: 'Personal', color: '#10B981', sort_order: 2 },
  { name: 'Pagos', color: '#F59E0B', sort_order: 3 },
];

export function CategoriesPage() {
  const { data: categories, isLoading } = useCategories();
  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory();
  const deleteMutation = useDeleteCategory();

  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [hasSeeded, setHasSeeded] = useState(false);

  useEffect(() => {
    if (!isLoading && categories && categories.length === 0 && !hasSeeded && !createMutation.isPending) {
      setHasSeeded(true);
      DEFAULT_CATEGORIES.forEach((cat) => {
        createMutation.mutate({ name: cat.name, color: cat.color, sortOrder: cat.sort_order });
      });
    }
  }, [isLoading, categories, hasSeeded, createMutation]);

  const handleCreate = (data: { name: string; color: string }) => {
    const nextOrder = categories ? Math.max(0, ...categories.map((c) => c.sort_order)) + 1 : 1;
    createMutation.mutate(
      { name: data.name, color: data.color, sortOrder: nextOrder },
      { onSuccess: () => setIsCreating(false) }
    );
  };

  const handleUpdate = (id: string, data: { name: string; color: string }) => {
    updateMutation.mutate(
      { id, updates: { name: data.name, color: data.color } },
      { onSuccess: () => setEditingId(null) }
    );
  };

  const moveCategory = (category: Category, direction: 'up' | 'down') => {
    if (!categories) return;
    const index = categories.findIndex((c) => c.id === category.id);
    if (direction === 'up' && index > 0) {
      const prev = categories[index - 1];
      updateMutation.mutate({ id: category.id, updates: { sort_order: prev.sort_order } });
      updateMutation.mutate({ id: prev.id, updates: { sort_order: category.sort_order } });
    } else if (direction === 'down' && index < categories.length - 1) {
      const next = categories[index + 1];
      updateMutation.mutate({ id: category.id, updates: { sort_order: next.sort_order } });
      updateMutation.mutate({ id: next.id, updates: { sort_order: category.sort_order } });
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Cargando categorías...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Categorías</h1>
        {!isCreating && (
          <Button onClick={() => setIsCreating(true)}>Nueva categoría</Button>
        )}
      </div>

      {isCreating && (
        <CategoryForm
          onSubmit={handleCreate}
          onCancel={() => setIsCreating(false)}
          isLoading={createMutation.isPending}
        />
      )}

      <div className="space-y-3">
        {categories?.map((category, index) => (
          <div key={category.id}>
            {editingId === category.id ? (
              <CategoryForm
                initialData={category}
                onSubmit={(data) => handleUpdate(category.id, data)}
                onCancel={() => setEditingId(null)}
                isLoading={updateMutation.isPending}
              />
            ) : (
              <Card>
                <CardContent className="flex items-center gap-4 p-4">
                  <div
                    className="w-4 h-4 rounded-full flex-shrink-0"
                    style={{ backgroundColor: category.color }}
                  />
                  <span className="flex-1 font-medium">{category.name}</span>
                  
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={index === 0}
                      onClick={() => moveCategory(category, 'up')}
                    >
                      ↑
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={index === (categories?.length ?? 0) - 1}
                      onClick={() => moveCategory(category, 'down')}
                    >
                      ↓
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setEditingId(category.id)}>
                      Editar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => {
                        if (confirm(`¿Eliminar la categoría "${category.name}"?`)) {
                          deleteMutation.mutate(category.id);
                        }
                      }}
                      disabled={deleteMutation.isPending}
                    >
                      Borrar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        ))}
        {categories?.length === 0 && !isCreating && (
          <p className="text-center text-muted-foreground py-8">
            No hay categorías. Creá una para empezar.
          </p>
        )}
      </div>
    </div>
  );
}