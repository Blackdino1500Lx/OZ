import { supabase } from '@/lib/supabase';
import type { ItemAttachment } from '@/types/database';

export async function fetchAttachments(itemId: string): Promise<ItemAttachment[]> {
  const { data, error } = await supabase
    .from('item_attachments')
    .select('*')
    .eq('item_id', itemId)
    .is('deleted_at', null)
    .order('created_at', { ascending: true });

  if (error) throw new Error(error.message);
  return (data as ItemAttachment[]) || [];
}

export async function uploadAttachment(itemId: string, file: File): Promise<ItemAttachment> {
  if (!navigator.onLine) {
    throw new Error('Necesitás conexión a internet para subir archivos.');
  }

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('No hay sesión activa');

  const userId = session.user.id;
  const fileExt = file.name.split('.').pop();
  const fileName = `${crypto.randomUUID()}.${fileExt}`;
  // La ruta debe empezar con el user_id para que las políticas de Storage funcionen
  const filePath = `${userId}/${fileName}`;

  // 1. Subir archivo a Storage
  const { error: uploadError } = await supabase.storage
    .from('attachments')
    .upload(filePath, file);

  if (uploadError) throw new Error(uploadError.message);

  // 2. Obtener URL pública (o firmada, como el bucket es privado, usamos URL firmada)
  const { data: urlData, error: urlError } = await supabase.storage
    .from('attachments')
    .createSignedUrl(filePath, 60 * 60 * 24 * 365); // Válida por 1 año

  if (urlError || !urlData) throw new Error('No se pudo obtener la URL del archivo');

  // 3. Guardar registro en la base de datos
  const { data, error } = await supabase
    .from('item_attachments')
    .insert([{
      item_id: itemId,
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
  // Nota: No borramos el archivo físico del Storage para evitar problemas, solo el registro lógico.
}