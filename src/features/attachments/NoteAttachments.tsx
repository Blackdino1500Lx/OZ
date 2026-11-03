import { useRef, type ChangeEvent } from 'react';
import { useAttachments, useUploadAttachment, useDeleteAttachment } from './hooks';
import { Button } from '@/components/ui/button';
import { Paperclip, File, Trash2, Loader2 } from 'lucide-react';

export function NoteAttachments({ itemId, noteId }: { itemId: string; noteId: string }) {
  const { data: attachments } = useAttachments(itemId, noteId);
  const uploadMutation = useUploadAttachment(itemId);
  const deleteMutation = useDeleteAttachment(itemId);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadMutation.mutate({ file, noteId }, {
        onSuccess: () => {
          if (fileInputRef.current) fileInputRef.current.value = '';
        },
        onError: (err) => alert(err instanceof Error ? err.message : 'Error')
      });
    }
  };

  return (
    <div className="mt-2 space-y-2">
      {/* Lista de archivos de esta nota */}
      {attachments && attachments.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {attachments.map((att) => (
            <div key={att.id} className="flex items-center gap-2 bg-muted/50 rounded-md px-2 py-1 text-xs border group">
              <a href={att.file_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:underline truncate max-w-[150px]">
                <File className="w-3 h-3 text-muted-foreground" />
                {att.file_name}
              </a>
              <button
                onClick={() => {
                  if (confirm('¿Eliminar adjunto?')) deleteMutation.mutate(att.id);
                }}
                className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                disabled={deleteMutation.isPending}
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Botón para subir */}
      <div>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept="image/*,.pdf,.doc,.docx"
        />
        <Button
          variant="ghost"
          size="sm"
          className="h-6 text-xs text-muted-foreground hover:text-foreground px-2"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploadMutation.isPending}
        >
          {uploadMutation.isPending ? (
            <><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Subiendo...</>
          ) : (
            <><Paperclip className="w-3 h-3 mr-1" /> Adjuntar a esta nota</>
          )}
        </Button>
      </div>
    </div>
  );
}