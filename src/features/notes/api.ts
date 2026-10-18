import { supabase } from '@/lib/supabase';
import { db } from '@/lib/db';
import { processSyncQueue } from '@/lib/sync';
import type { ItemNote } from '@/types/database';

const PLACEHOLDER_USER_ID = '00000000-0000-0000-0000-000000000000';

const fetchWithTimeout = async <T>(promise: PromiseLike<T>, timeoutMs = 5000): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error('Timeout')), timeoutMs)),
  ]);
};

export async function fetchNotes(itemId: string): Promise<ItemNote[]> {
  if (navigator.onLine) {
    try {
      const { data, error } = await fetchWithTimeout(
        supabase.from('item_notes').select('*').eq('item_id', itemId).is('deleted_at', null)
      );
      if (!error && data) {
        await db.item_notes.bulkPut(data as ItemNote[]);
      }
    } catch (err) {
      console.warn('Fetch notas falló...', err);
    }
  }

  const localNotes = await db.item_notes
    .where('item_id')
    .equals(itemId)
    .filter((n) => n.deleted_at === null)
    .toArray();
    
  return localNotes.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
}

export async function createNote(itemId: string, body: string): Promise<ItemNote> {
  const newNote: ItemNote = {
    id: crypto.randomUUID(),
    item_id: itemId,
    user_id: PLACEHOLDER_USER_ID,
    body,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    deleted_at: null,
  };

  await db.item_notes.put(newNote);
  await db.sync_queue.add({
    table: 'item_notes',
    action: 'INSERT',
    recordId: newNote.id,
    payload: newNote as unknown as Record<string, unknown>,
    createdAt: Date.now(),
  });

  void processSyncQueue();
  return newNote;
}

export async function updateNote(id: string, body: string): Promise<ItemNote> {
  const existing = await db.item_notes.get(id);
  if (!existing) throw new Error('Note not found locally');

  const updated = { ...existing, body, updated_at: new Date().toISOString() };
  await db.item_notes.put(updated);

  await db.sync_queue.add({
    table: 'item_notes',
    action: 'UPDATE',
    recordId: id,
    payload: updated,
    createdAt: Date.now(),
  });

  void processSyncQueue();
  return updated;
}

export async function softDeleteNote(id: string): Promise<void> {
  const existing = await db.item_notes.get(id);
  if (!existing) return;

  const updated = { ...existing, deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() };
  await db.item_notes.put(updated);

  await db.sync_queue.add({
    table: 'item_notes',
    action: 'DELETE',
    recordId: id,
    payload: { deleted_at: updated.deleted_at, updated_at: updated.updated_at },
    createdAt: Date.now(),
  });

  void processSyncQueue();
}