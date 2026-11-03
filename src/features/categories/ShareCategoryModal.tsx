import { useState, type FormEvent } from 'react';
import { useInviteToCategory, useCategoryMembers, useRemoveMember } from './hooks';
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
import { Share2, User, Trash2 } from 'lucide-react';
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
  const { data: members, isLoading: isLoadingMembers } = useCategoryMembers(isOpen ? category.id : null);
  const removeMutation = useRemoveMember(category.id);

  const handleInvite = (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    inviteMutation.mutate(
      { categoryId: category.id, email },
      {
        onSuccess: () => {
          setEmail('');
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
          <DialogTitle className="flex items-center gap-2 pr-6">
            <Share2 className="w-5 h-5 flex-shrink-0" /> 
            <span className="truncate">Compartir "{category.name}"</span>
          </DialogTitle>
          <DialogDescription>
            Gestiona quién tiene acceso a esta categoría.
          </DialogDescription>
        </DialogHeader>

        {/* Lista de miembros con scroll interno */}
        <div className="space-y-3 py-2 flex-1 overflow-hidden flex flex-col min-h-0">
          <Label className="flex-shrink-0">Usuarios con acceso</Label>
          {isLoadingMembers ? (
            <p className="text-sm text-muted-foreground">Cargando...</p>
          ) : (
            <div className="space-y-2 overflow-y-auto pr-2 pb-2">
              {members?.map((member) => (
                <div key={member.user_id} className="flex items-center justify-between p-2 bg-muted/50 rounded-md text-sm group">
                  <div className="flex items-center gap-2 truncate">
                    <User className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <span className="truncate">{member.email}</span>
                    {member.role === 'owner' && (
                      <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded uppercase font-bold tracking-wider flex-shrink-0">
                        Dueño
                      </span>
                    )}
                  </div>
                  {/* Quitamos opacity-0 group-hover para que SIEMPRE sea visible */}
                  {member.role !== 'owner' && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive flex-shrink-0 ml-2"
                      onClick={() => {
                        if (confirm(`¿Quitar acceso a ${member.email}?`)) {
                          removeMutation.mutate(member.user_id);
                        }
                      }}
                      disabled={removeMutation.isPending}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Formulario de invitación (Fijo abajo) */}
        <form onSubmit={handleInvite} className="space-y-4 pt-4 border-t flex-shrink-0">
          <div className="space-y-2">
            <Label htmlFor="email">Invitar a un nuevo usuario</Label>
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
              Cerrar
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