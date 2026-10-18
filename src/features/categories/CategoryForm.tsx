import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { type Category } from '@/types/database';

interface CategoryFormProps {
  initialData?: Category;
  onSubmit: (data: { name: string; color: string }) => void;
  onCancel: () => void;
  isLoading: boolean;
}

export function CategoryForm({ initialData, onSubmit, onCancel, isLoading }: CategoryFormProps) {
  const [name, setName] = useState(initialData?.name || '');
  const [color, setColor] = useState(initialData?.color || '#3B82F6');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSubmit({ name: name.trim(), color });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 border p-4 rounded-lg bg-card text-card-foreground shadow-sm">
      <div className="space-y-2">
        <Label htmlFor="cat-name">Nombre de la categoría</Label>
        <Input
          id="cat-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ej. Trabajo"
          required
          maxLength={60}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="cat-color">Color</Label>
        <div className="flex gap-2 items-center">
          <Input
            id="cat-color"
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="w-16 h-10 p-1 cursor-pointer"
          />
          <span className="text-sm text-muted-foreground">{color}</span>
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={isLoading}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Guardando...' : 'Guardar'}
        </Button>
      </div>
    </form>
  );
}