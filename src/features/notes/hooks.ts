import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchNotes, createNote, updateNote, softDeleteNote } from './api';

export function useNotes(itemId: string) {
  return useQuery({
    queryKey: ['notes', itemId],
    queryFn: () => fetchNotes(itemId),
    enabled: !!itemId,
  });
}

export function useCreateNote(itemId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: string) => createNote(itemId, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['notes', itemId] });
    },
  });
}

export function useUpdateNote(itemId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: string }) => updateNote(id, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['notes', itemId] });
    },
  });
}

export function useDeleteNote(itemId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => softDeleteNote(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['notes', itemId] });
    },
  });
}