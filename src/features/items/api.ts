import { supabase } from '@/lib/supabase';
import { db } from '@/lib/db';
import { processSyncQueue } from '@/lib/sync';
import type { Item, Category, ItemStatus } from '@/types/database';

export interface ItemWithCategory extends Item {
  categories: Pick<Category, 'name' | 'color'> | null;
  item_notes: { body: string }[];
}

const PLACEHOLDER_USER_ID = '00000000-0000-0000-0000-000000000000';

const fetchWithTimeout = async <T>(promise: PromiseLike<T>, timeoutMs = 5000): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('Timeout de red')), timeoutMs)
    ),
  ]);
};

export async function fetchItems(): Promise<ItemWithCategory[]> {
  if (navigator.onLine) {
    try {
      const { data, error } = await fetchWithTimeout(
        supabase.from('items').select('*, categories(name, color), item_notes(body)').is('deleted_at', null)
      );

      if (!error && data) {
        const items = data as unknown as ItemWithCategory[];
        await db.items.bulkPut(items.map(({ categories, item_notes, ...item }) => item));
      }
    } catch (err) {
      console.warn('Fetch red falló o tardó demasiado, usando caché local...', err);
    }
  }

  const localItems = await db.items.filter(i => i.deleted_at === null).toArray();
  localItems.sort((a, b) => {
    if (!a.starts_at && !b.starts_at) return 0;
    if (!a.starts_at) return 1;
    if (!b.starts_at) return -1;
    return new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime();
  });

  const categories = await db.categories.toArray();
  const catMap = new Map(categories.map(c => [c.id, c]));
  const notes = await db.item_notes.toArray();

  return localItems.map(item => {
    const cat = catMap.get(item.category_id);
    return {
      ...item,
      categories: cat ? { name: cat.name, color: cat.color } : null,
      item_notes: notes.filter(n => n.item_id === item.id && n.deleted_at === null).map(n => ({ body: n.body })),
    };
  });
}

export async function createItem(item: Partial<Item>): Promise<Item> {
  const newItem = {
    ...item,
    id: crypto.randomUUID(),
    user_id: PLACEHOLDER_USER_ID,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    deleted_at: null,
    status: item.status || 'pendiente',
    priority: item.priority || 0,
    kind: item.kind || 'tarea',
    all_day: item.all_day || false,
    origin: 'manual',
  } as Item;

  await db.items.put(newItem);
  await db.sync_queue.add({
    table: 'items',
    action: 'INSERT',
    recordId: newItem.id,
    payload: newItem as unknown as Record<string, unknown>,
    createdAt: Date.now(),
  });

  void processSyncQueue();
  return newItem;
}

export async function updateItem(id: string, updates: Partial<Item>): Promise<Item> {
  const existing = await db.items.get(id);
  if (!existing) throw new Error('Item not found locally');

  const updatedItem = { ...existing, ...updates, updated_at: new Date().toISOString() };

  // --- MOTOR DE RECURRENCIA ---
  // Si la tarea pasa a "hecho" y tiene una regla de recurrencia, generamos la siguiente.
  const isBecomingDone = updates.status === 'hecho' && existing.status !== 'hecho';
  if (isBecomingDone && existing.recurrence_rule && existing.starts_at) {
    let nextDate = new Date(existing.starts_at);
    const rule = existing.recurrence_rule;
    
    if (rule.includes('FREQ=DAILY')) nextDate.setDate(nextDate.getDate() + 1);
    else if (rule.includes('FREQ=WEEKLY;INTERVAL=2')) nextDate.setDate(nextDate.getDate() + 14);
    else if (rule.includes('FREQ=WEEKLY')) nextDate.setDate(nextDate.getDate() + 7);
    else if (rule.includes('FREQ=MONTHLY')) nextDate.setMonth(nextDate.getMonth() + 1);
    else if (rule.includes('FREQ=YEARLY')) nextDate.setFullYear(nextDate.getFullYear() + 1);

    const nextItem = {
      ...existing,
      id: crypto.randomUUID(),
      starts_at: nextDate.toISOString(),
      status: 'pendiente',
      completed_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as Item;

    await db.items.put(nextItem);
    await db.sync_queue.add({
      table: 'items',
      action: 'INSERT',
      recordId: nextItem.id,
      payload: nextItem as unknown as Record<string, unknown>,
      createdAt: Date.now(),
    });
  }
  // ----------------------------

  await db.items.put(updatedItem);
  await db.sync_queue.add({
    table: 'items',
    action: 'UPDATE',
    recordId: id,
    payload: updatedItem as unknown as Record<string, unknown>,
    createdAt: Date.now(),
  });

  void processSyncQueue();
  return updatedItem;
}

export async function updateItemStatus(id: string, status: ItemStatus): Promise<Item> {
  return updateItem(id, {
    status,
    completed_at: status === 'hecho' ? new Date().toISOString() : null,
  });
}

export async function toggleItemStatus(id: string, currentStatus: string): Promise<Item> {
  const isDone = currentStatus === 'hecho';
  return updateItemStatus(id, isDone ? 'pendiente' : 'hecho');
}

export async function softDeleteItem(id: string): Promise<void> {
  const existing = await db.items.get(id);
  if (!existing) return;

  const updated = { ...existing, deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() };
  await db.items.put(updated);

  await db.sync_queue.add({
    table: 'items',
    action: 'DELETE',
    recordId: id,
    payload: { deleted_at: updated.deleted_at, updated_at: updated.updated_at },
    createdAt: Date.now(),
  });

  void processSyncQueue();
}