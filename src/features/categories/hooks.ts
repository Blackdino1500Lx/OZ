import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  fetchCategories, 
  createCategory, 
  updateCategory, 
  softDeleteCategory, 
  swapCategoriesOrder,
  inviteUserToCategory,
  fetchCategoryMembers,
  removeUserFromCategory
} from './api';

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
    refetchOnWindowFocus: true,
    refetchInterval: 10000,
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

export function useInviteToCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ categoryId, email }: { categoryId: string; email: string }) =>
      inviteUserToCategory(categoryId, email),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['categories'] });
      // Invalidamos también la lista de miembros para que se actualice en el modal
      void queryClient.invalidateQueries({ queryKey: ['category_members'] });
    },
  });
}

export function useCategoryMembers(categoryId: string | null) {
  return useQuery({
    queryKey: ['category_members', categoryId],
    queryFn: () => fetchCategoryMembers(categoryId!),
    enabled: !!categoryId,
  });
}

export function useRemoveMember(categoryId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => removeUserFromCategory(categoryId, userId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['category_members', categoryId] });
    },
  });
}