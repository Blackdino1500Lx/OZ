import { useState, type FormEvent } from 'react';
import { useNotes, useCreateNote, useUpdateNote, useDeleteNote } from './hooks';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export function NotesList({ itemId }: { itemId: string }) {
  const { data: notes, isLoading } = useNotes(itemId);
  const createMutation = useCreateNote(itemId);
  const updateMutation = useUpdateNote(itemId);
  const deleteMutation = useDeleteNote(itemId);

  const [newBody, setNewBody] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBody, setEditBody] = useState('');

  const handleCreate = (e: FormEvent) => {
    e.preventDefault();
    if (!newBody.trim()) return;
    createMutation.mutate(newBody.trim(), { onSuccess: () => setNewBody('') });
  };

  const startEdit = (id: string, currentBody: string) => {
    setEditingId(id);
    setEditBody(currentBody);
  };

  const handleUpdate = (e: FormEvent) => {
    e.preventDefault();
    if (!editBody.trim() || !editingId) return;
    updateMutation.mutate(
      { id: editingId, body: editBody.trim() },
      { onSuccess: () => setEditingId(null) }
    );
  };

  if (isLoading) return <div className="text-sm text-muted-foreground">Cargando notas...</div>;

  return (
    <div className="space-y-6 mt-8">
      <h3 className="font-semibold text-lg border-b pb-2">Seguimiento</h3>

      {/* Timeline */}
      <div className="space-y-4 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
        {notes?.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">No hay notas todavía.</p>
        )}
        
        {notes?.map((note) => (
          <div key={note.id} className="relative pl-6">
            {/* Timeline dot */}
            <div className="absolute left-0 top-1.5 w-2 h-2 rounded-full bg-primary ring-4 ring-background" />
            
            {editingId === note.id ? (
              <form onSubmit={handleUpdate} className="space-y-2 bg-muted/50 p-3 rounded-md">
                <Textarea
                  value={editBody}
                  onChange={(e) => setEditBody(e.target.value)}
                  required
                />
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="ghost" size="sm" onClick={() => setEditingId(null)}>
                    Cancelar
                  </Button>
                  <Button type="submit" size="sm" disabled={updateMutation.isPending}>
                    Guardar
                  </Button>
                </div>
              </form>
            ) : (
              <div className="group">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-muted-foreground">
                    {format(new Date(note.created_at), "d MMM yyyy, HH:mm", { locale: es })}
                  </span>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                    <button
                      onClick={() => startEdit(note.id, note.body)}
                      className="text-xs text-muted-foreground hover:text-foreground underline"
                    >
                      Editar
                    </button>
                    <span className="text-muted-foreground">•</span>
                    <button
                      onClick={() => {
                        if (confirm('¿Borrar esta nota?')) deleteMutation.mutate(note.id);
                      }}
                      className="text-xs text-destructive hover:text-destructive/80 underline"
                    >
                      Borrar
                    </button>
                  </div>
                </div>
                <p className="text-sm whitespace-pre-wrap">{note.body}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add note form */}
      <form onSubmit={handleCreate} className="bg-muted/30 p-4 rounded-lg border mt-4">
        <Textarea
          placeholder="Agregar una nota de seguimiento..."
          value={newBody}
          onChange={(e) => setNewBody(e.target.value)}
          required
        />
        <div className="flex justify-end mt-2">
          <Button type="submit" size="sm" disabled={createMutation.isPending || !newBody.trim()}>
            {createMutation.isPending ? 'Agregando...' : 'Agregar nota'}
          </Button>
        </div>
      </form>
    </div>
  );
}