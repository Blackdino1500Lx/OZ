import { useRef, type ChangeEvent } from 'react';
import { useAttachments, useUploadAttachment, useDeleteAttachment } from './hooks';
import { Button } from '@/components/ui/button';
import { Paperclip, File, Trash2, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export function AttachmentsList({ itemId }: { itemId: string }) {
  const { data: attachments, isLoading } = useAttachments(itemId);
  const uploadMutation = useUploadAttachment(itemId);
  const deleteMutation = useDeleteAttachment(itemId);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadMutation.mutate(file, {
        onSuccess: () => {
          if (fileInputRef.current) fileInputRef.current.value = '';
        },
        onError: (err) => {
          alert(err instanceof Error ? err.message : 'Error al subir archivo');
        }
      });
    }
  };

  if (isLoading) return <div className="text-sm text-muted-foreground">Cargando adjuntos...</div>;

  return (
    <div className="space-y-4 mt-8">
      <div className="flex items-center justify-between border-b pb-2">
        <h3 className="font-semibold text-lg flex items-center gap-2">
          <Paperclip className="w-5 h-5" />
          Adjuntos
        </h3>
        <div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept="image/*,.pdf,.doc,.docx"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadMutation.isPending}
          >
            {uploadMutation.isPending ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Subiendo...</>
            ) : (
              'Subir archivo'
            )}
          </Button>
        </div>
      </div>

      {attachments?.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">No hay archivos adjuntos.</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {attachments?.map((att) => (
          <div key={att.id} className="flex items-center justify-between p-3 border rounded-md bg-card text-sm group">
            <a 
              href={att.file_url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 flex-1 min-w-0 hover:underline"
            >
              <File className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <div className="truncate">
                <p className="font-medium truncate">{att.file_name}</p>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(att.created_at), "d MMM", { locale: es })}
                </p>
              </div>
            </a>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => {
                if (confirm('¿Eliminar este adjunto?')) deleteMutation.mutate(att.id);
              }}
              disabled={deleteMutation.isPending}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}