import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchAttachments, uploadAttachment, deleteAttachment } from './api';

export function useAttachments(itemId: string, noteId?: string) {
  return useQuery({
    queryKey: ['attachments', itemId, noteId],
    queryFn: () => fetchAttachments(itemId, noteId),
    enabled: !!itemId,
  });
}

export function useUploadAttachment(itemId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ file, noteId }: { file: File; noteId?: string }) => uploadAttachment(itemId, file, noteId),
    onSuccess: () => {
      // Invalidamos todas las queries de adjuntos para este ítem
      void queryClient.invalidateQueries({ queryKey: ['attachments', itemId] });
    },
  });
}

export function useDeleteAttachment(itemId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteAttachment(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['attachments', itemId] });
    },
  });
}