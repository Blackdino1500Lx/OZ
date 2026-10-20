import { supabase } from '@/lib/supabase';
import { db } from '@/lib/db';
import { processSyncQueue } from '@/lib/sync';
import type { Category } from '@/types/database';

const PLACEHOLDER_USER_ID = '00000000-0000-0000-0000-000000000000';

const fetchWithTimeout = async <T>(promise: PromiseLike<T>, timeoutMs = 5000): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error('Timeout')), timeoutMs)),
  ]);
};

export async function fetchCategories(): Promise<Category[]> {
  if (navigator.onLine) {
    try {
      const { data, error } = await fetchWithTimeout(
        supabase.from('categories').select('*').is('deleted_at', null)
      );
      if (!error && data) {
        await db.categories.bulkPut(data as Category[]);
      }
    } catch (err) {
      console.warn('Fetch categorías falló...', err);
    }
  }

  const localCats = await db.categories.filter(c => c.deleted_at === null).toArray();
  return localCats.sort((a, b) => a.sort_order - b.sort_order);
}

export async function createCategory(name: string, color: string, sortOrder: number): Promise<Category> {
  const newCat: Category = {
    id: crypto.randomUUID(),
    user_id: PLACEHOLDER_USER_ID,
    name,
    color,
    icon: null,
    sort_order: sortOrder,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    deleted_at: null,
  };

  await db.categories.put(newCat);
  await db.sync_queue.add({
    table: 'categories',
    action: 'INSERT',
    recordId: newCat.id,
    payload: newCat as unknown as Record<string, unknown>,
    createdAt: Date.now(),
  });

  void processSyncQueue();
  return newCat;
}

export async function updateCategory(id: string, updates: Partial<Category>): Promise<Category> {
  const existing = await db.categories.get(id);
  if (!existing) throw new Error('Category not found locally');

  const updated = { ...existing, ...updates, updated_at: new Date().toISOString() };
  await db.categories.put(updated);

  await db.sync_queue.add({
    table: 'categories',
    action: 'UPDATE',
    recordId: id,
    payload: updated,
    createdAt: Date.now(),
  });

  void processSyncQueue();
  return updated;
}
export async function swapCategoriesOrder(id1: string, order1: number, id2: string, order2: number): Promise<void> {
  const now = new Date().toISOString();
  const cat1 = await db.categories.get(id1);
  const cat2 = await db.categories.get(id2);
  if (!cat1 || !cat2) return;

  const updated1 = { ...cat1, sort_order: order1, updated_at: now };
  const updated2 = { ...cat2, sort_order: order2, updated_at: now };

  await db.categories.bulkPut([updated1, updated2]);
  await db.sync_queue.bulkAdd([
    { table: 'categories', action: 'UPDATE', recordId: id1, payload: updated1, createdAt: Date.now() },
    { table: 'categories', action: 'UPDATE', recordId: id2, payload: updated2, createdAt: Date.now() },
  ]);

  void processSyncQueue();
}

export async function softDeleteCategory(id: string): Promise<void> {
  const existing = await db.categories.get(id);
  if (!existing) return;

  const updated = { ...existing, deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() };
  await db.categories.put(updated);

  await db.sync_queue.add({
    table: 'categories',
    action: 'DELETE',
    recordId: id,
    payload: { deleted_at: updated.deleted_at, updated_at: updated.updated_at },
    createdAt: Date.now(),
  });

  void processSyncQueue();
}