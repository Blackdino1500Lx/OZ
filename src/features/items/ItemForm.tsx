import { useState, type FormEvent } from 'react';
import { useCategories } from '@/features/categories/hooks';
import { useCreateItem, useUpdateItem } from './hooks';
import { type ItemWithCategory } from './api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import type { ItemKind, ItemPriority } from '@/types/database';

interface ItemFormProps {
  initialData?: ItemWithCategory;
  onCancel: () => void;
}

export function ItemForm({ initialData, onCancel }: ItemFormProps) {
  const { data: categories } = useCategories();
  const createMutation = useCreateItem();
  const updateMutation = useUpdateItem();

  const [title, setTitle] = useState(initialData?.title || '');
  const [categoryId, setCategoryId] = useState(initialData?.category_id || categories?.[0]?.id || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [kind, setKind] = useState<ItemKind>(initialData?.kind || 'tarea');
  const [priority, setPriority] = useState<ItemPriority>((initialData?.priority as ItemPriority) || 0);
  
  // Nuevos estados
  const [allDay, setAllDay] = useState(initialData?.all_day || false);
  const [startsAt, setStartsAt] = useState(
    initialData?.starts_at ? new Date(initialData.starts_at).toISOString().slice(0, 16) : ''
  );
  const [recurrence, setRecurrence] = useState(initialData?.recurrence_rule || '');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !categoryId) return;

    // Si es "Todo el día", forzamos la hora a las 12:00 para evitar problemas de zona horaria
    let isoDate = null;
    if (startsAt) {
      if (allDay) {
        const datePart = startsAt.split('T')[0];
        isoDate = new Date(`${datePart}T12:00:00`).toISOString();
      } else {
        isoDate = new Date(startsAt).toISOString();
      }
    }

    const payload = {
      title: title.trim(),
      category_id: categoryId,
      starts_at: isoDate,
      description: description.trim() || null,
      kind,
      priority,
      all_day: allDay,
      recurrence_rule: recurrence || null,
    };

    if (initialData) {
      updateMutation.mutate({ id: initialData.id, updates: payload }, { onSuccess: onCancel });
    } else {
      createMutation.mutate(payload, { onSuccess: onCancel });
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Card className="mb-6">
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <CardTitle>{initialData ? 'Editar ítem' : 'Nuevo ítem'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej. Reparar laptop"
              required
              maxLength={200}
              autoFocus
            />
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Categoría</Label>
              <select
                id="category"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                required
              >
                <option value="" disabled>Seleccionar...</option>
                {categories?.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            {/* Fecha y hora con opción de Todo el día */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="starts_at">{allDay ? 'Fecha' : 'Fecha y hora'}</Label>
                <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={allDay} 
                    onChange={(e) => setAllDay(e.target.checked)} 
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  Todo el día
                </label>
              </div>
              <Input
                id="starts_at"
                type={allDay ? "date" : "datetime-local"}
                value={allDay && startsAt ? startsAt.split('T')[0] : startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
              />
            </div>
          </div>

          {/* Opciones avanzadas colapsadas */}
          <details className="group border rounded-md p-3 bg-muted/20">
            <summary className="text-sm font-medium cursor-pointer list-none flex items-center justify-between select-none">
              <span>Opciones avanzadas</span>
              <span className="text-xs text-muted-foreground group-open:hidden">Mostrar</span>
              <span className="text-xs text-muted-foreground hidden group-open:inline">Ocultar</span>
            </summary>
            <div className="space-y-4 pt-4 mt-2 border-t">
              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detalles opcionales..."
                  className="min-h-[60px]"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="kind">Tipo</Label>
                  <select
                    id="kind"
                    value={kind}
                    onChange={(e) => setKind(e.target.value as ItemKind)}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="tarea">Tarea</option>
                    <option value="evento">Evento</option>
                    <option value="pago">Pago</option>
                    <option value="recordatorio">Recordatorio</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="priority">Prioridad</Label>
                  <select
                    id="priority"
                    value={priority}
                    onChange={(e) => setPriority(Number(e.target.value) as ItemPriority)}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value={0}>Baja (0)</option>
                    <option value={1}>Media (1)</option>
                    <option value={2}>Alta (2)</option>
                  </select>
                </div>
              </div>

              {/* Recurrencia */}
              <div className="space-y-2">
                <Label htmlFor="recurrence">Repetición</Label>
                <select
                  id="recurrence"
                  value={recurrence}
                  onChange={(e) => setRecurrence(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="">No se repite</option>
                  <option value="FREQ=DAILY">Diario</option>
                  <option value="FREQ=WEEKLY">Semanal</option>
                  <option value="FREQ=WEEKLY;INTERVAL=2">Quincenal</option>
                  <option value="FREQ=MONTHLY">Mensual</option>
                  <option value="FREQ=YEARLY">Anual</option>
                </select>
              </div>
            </div>
          </details>
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onCancel} disabled={isLoading}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading || !title.trim() || !categoryId}>
            {isLoading ? 'Guardando...' : 'Guardar'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}