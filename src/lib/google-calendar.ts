import { supabase } from './supabase';
import type { Item } from '@/types/database';

export async function syncWithGoogleCalendar(action: 'upsert' | 'delete', item: Item) {
  if (!navigator.onLine) return; // Si está offline, que lo haga el sync después
  try {
    const { data, error } = await supabase.functions.invoke('google-calendar', {
      body: { action, item },
    });
    
    if (error) throw error;
    return data.eventId; // Devuelve el ID del evento creado
  } catch (err) {
    console.error('Error sincronizando con Google Calendar:', err);
    return null;
  }
}