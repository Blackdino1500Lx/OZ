import { useState, type FormEvent } from 'react';
import { useInviteToCategory } from './hooks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Share2 } from 'lucide-react';
import type { Category } from '@/types/database';

interface ShareCategoryModalProps {
  category: Category;
  isOpen: boolean;
  onClose: () => void;
}

export function ShareCategoryModal({ category, isOpen, onClose }: ShareCategoryModalProps) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const inviteMutation = useInviteToCategory();

  const handleInvite = (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    inviteMutation.mutate(
      { categoryId: category.id, email },
      {
        onSuccess: () => {
          setEmail('');
          onClose();
        },
        onError: (err) => {
          setError(err instanceof Error ? err.message : 'Error al invitar');
        },
      }
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[90vw] sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5" /> Compartir "{category.name}"
          </DialogTitle>
          <DialogDescription>
            Invita a otro usuario para que pueda ver y editar los ítems de esta categoría.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleInvite} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email del usuario</Label>
            <Input
              id="email"
              type="email"
              placeholder="correo@ejemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={inviteMutation.isPending}>
              {inviteMutation.isPending ? 'Invitando...' : 'Invitar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}