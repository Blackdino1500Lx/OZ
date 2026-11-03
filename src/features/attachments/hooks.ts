import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchAttachments, uploadAttachment, deleteAttachment } from './api';

export function useAttachments(itemId: string) {
  return useQuery({
    queryKey: ['attachments', itemId],
    queryFn: () => fetchAttachments(itemId),
    enabled: !!itemId,
  });
}

export function useUploadAttachment(itemId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => uploadAttachment(itemId, file),
    onSuccess: () => {
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