import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  fetchCategories, createCategory, updateCategory, softDeleteCategory, swapCategoriesOrder 
} from './api';
export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ name, color, sortOrder }: { name: string; color: string; sortOrder: number }) =>
      createCategory(name, color, sortOrder),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: { name?: string; color?: string; sort_order?: number } }) =>
      updateCategory(id, updates),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => softDeleteCategory(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
}
export function useSwapCategories() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id1, order1, id2, order2 }: { id1: string; order1: number; id2: string; order2: number }) =>
      swapCategoriesOrder(id1, order1, id2, order2),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
}