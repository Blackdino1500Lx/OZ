import { useRef, useState, type ChangeEvent } from 'react';
import { useAttachments, useUploadAttachment, useDeleteAttachment } from './hooks';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Paperclip, File, Trash2, Loader2, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { ItemAttachment } from '@/types/database';

export function AttachmentsList({ itemId }: { itemId: string }) {
  const { data: attachments, isLoading } = useAttachments(itemId);
  const uploadMutation = useUploadAttachment(itemId);
  const deleteMutation = useDeleteAttachment(itemId);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Estado para controlar qué archivo se está viendo en el modal
  const [selectedFile, setSelectedFile] = useState<ItemAttachment | null>(null);

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

  // Función auxiliar para renderizar el contenido del modal según el tipo
  const renderFilePreview = (file: ItemAttachment) => {
    if (file.file_type?.startsWith('image/')) {
      return (
        <img 
          src={file.file_url} 
          alt={file.file_name} 
          className="w-full h-auto max-h-[70vh] object-contain rounded-md" 
        />
      );
    }
    
    if (file.file_type === 'application/pdf') {
      return (
        <iframe 
          src={file.file_url} 
          className="w-full h-[70vh] rounded-md border-0" 
          title={file.file_name}
        />
      );
    }

    // Para cualquier otro tipo de archivo (Word, Excel, etc.)
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
        <File className="w-16 h-16 text-muted-foreground" />
        <div>
          <p className="font-medium">{file.file_name}</p>
          <p className="text-sm text-muted-foreground">Este tipo de archivo no se puede previsualizar.</p>
        </div>
        <Button asChild variant="outline">
          <a href={file.file_url} target="_blank" rel="noopener noreferrer" download={file.file_name}>
            <ExternalLink className="w-4 h-4 mr-2" />
            Abrir o Descargar
          </a>
        </Button>
      </div>
    );
  };

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
            {/* Al hacer clic, cambiamos el archivo seleccionado para abrir el modal */}
            <button 
              onClick={() => setSelectedFile(att)}
              className="flex items-center gap-2 flex-1 min-w-0 hover:underline text-left"
            >
              <File className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <div className="truncate">
                <p className="font-medium truncate">{att.file_name}</p>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(att.created_at), "d MMM", { locale: es })}
                </p>
              </div>
            </button>
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

      {/* MODAL PARA PREVISUALIZAR */}
      <Dialog open={!!selectedFile} onOpenChange={(open) => !open && setSelectedFile(null)}>
        <DialogContent className="max-w-3xl w-[90vw] p-4 sm:p-6 bg-background/95 backdrop-blur-sm">
          <DialogHeader className="mb-2">
            <DialogTitle className="truncate pr-6">{selectedFile?.file_name}</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center min-h-[200px]">
            {selectedFile && renderFilePreview(selectedFile)}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}