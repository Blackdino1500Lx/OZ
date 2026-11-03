import { supabase } from '@/lib/supabase';
import type { ItemAttachment } from '@/types/database';

export async function fetchAttachments(itemId: string, noteId?: string): Promise<ItemAttachment[]> {
  let query = supabase
    .from('item_attachments')
    .select('*')
    .eq('item_id', itemId)
    .is('deleted_at', null)
    .order('created_at', { ascending: true });

  // Si pasamos un noteId, filtramos por esa nota. Si no, solo los generales (note_id is null)
  if (noteId) {
    query = query.eq('note_id', noteId);
  } else {
    query = query.is('note_id', null);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data as ItemAttachment[]) || [];
}

export async function uploadAttachment(itemId: string, file: File, noteId?: string): Promise<ItemAttachment> {
  if (!navigator.onLine) {
    throw new Error('Necesitás conexión a internet para subir archivos.');
  }

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('No hay sesión activa');

  const userId = session.user.id;
  const fileExt = file.name.split('.').pop();
  const fileName = `${crypto.randomUUID()}.${fileExt}`;
  const filePath = `${userId}/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('attachments')
    .upload(filePath, file);

  if (uploadError) throw new Error(uploadError.message);

  const { data: urlData, error: urlError } = await supabase.storage
    .from('attachments')
    .createSignedUrl(filePath, 60 * 60 * 24 * 365);

  if (urlError || !urlData) throw new Error('No se pudo obtener la URL del archivo');

  const { data, error } = await supabase
    .from('item_attachments')
    .insert([{
      item_id: itemId,
      note_id: noteId || null, // <-- Guardamos a qué nota pertenece
      file_name: file.name,
      file_url: urlData.signedUrl,
      file_type: file.type
    }])
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as ItemAttachment;
}

export async function deleteAttachment(id: string): Promise<void> {
  const { error } = await supabase
    .from('item_attachments')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id);

  if (error) throw new Error(error.message);
}