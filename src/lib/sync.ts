import { supabase } from './supabase';
import { db } from './db';

let isSyncing = false;

export async function processSyncQueue(): Promise<void> {
  if (isSyncing || !navigator.onLine) return;
  
  isSyncing = true; // Lo ponemos en true acá
  try {
    let currentUserId = null;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      currentUserId = session?.user?.id;
    } catch (e) {
      console.error('No se pudo obtener la sesión para sincronizar', e);
      return;
    }

    if (!currentUserId) {
      console.warn('No hay sesión activa. Sincronización pausada.');
      return;
    }

    const queue = await db.sync_queue.orderBy('createdAt').toArray();
    
    for (const task of queue) {
      try {
        const payload = { ...task.payload, user_id: currentUserId };

        if (task.table === 'items') {
          if (task.action === 'INSERT' || task.action === 'UPDATE') {
            const { data: remote } = await supabase.from('items').select('updated_at').eq('id', task.recordId).single();
            const localUpdatedAt = payload.updated_at as string;
            
            if (remote && new Date(remote.updated_at) > new Date(localUpdatedAt)) {
              console.log(`Conflicto en item ${task.recordId}: remoto más reciente.`);
            } else {
              const { error } = await supabase.from('items').upsert(payload);
              if (error) throw error;
            }
          } else if (task.action === 'DELETE') {
            await supabase.from('items').update({ deleted_at: payload.deleted_at }).eq('id', task.recordId);
          }
        }

        if (task.table === 'categories') {
          if (task.action === 'INSERT' || task.action === 'UPDATE') {
            const { data: remote } = await supabase.from('categories').select('updated_at').eq('id', task.recordId).single();
            const localUpdatedAt = payload.updated_at as string;
            
            if (remote && new Date(remote.updated_at) > new Date(localUpdatedAt)) {
              console.log(`Conflicto en categoría ${task.recordId}: remoto más reciente.`);
            } else {
              const { error } = await supabase.from('categories').upsert(payload);
              if (error) throw error;
            }
          } else if (task.action === 'DELETE') {
            await supabase.from('categories').update({ deleted_at: payload.deleted_at }).eq('id', task.recordId);
          }
        }

        if (task.table === 'item_notes') {
          if (task.action === 'INSERT' || task.action === 'UPDATE') {
            const { data: remote } = await supabase.from('item_notes').select('updated_at').eq('id', task.recordId).single();
            const localUpdatedAt = payload.updated_at as string;
            
            if (remote && new Date(remote.updated_at) > new Date(localUpdatedAt)) {
              console.log(`Conflicto en nota ${task.recordId}: remoto más reciente.`);
            } else {
              const { error } = await supabase.from('item_notes').upsert(payload);
              if (error) throw error;
            }
          } else if (task.action === 'DELETE') {
            await supabase.from('item_notes').update({ deleted_at: payload.deleted_at }).eq('id', task.recordId);
          }
        }

        if (task.id) await db.sync_queue.delete(task.id);
      } catch (err) {
        console.error(`Error sincronizando ${task.table} ${task.recordId}:`, err);
        break; 
      }
    }
  } finally {
    isSyncing = false; // SIEMPRE se libera el candado
  }
}

export function setupSyncListener(): void {
  window.addEventListener('online', () => {
    console.log('Conexión recuperada. Sincronizando...');
    void processSyncQueue();
  });

  if (navigator.onLine) {
    void processSyncQueue();
  }
}