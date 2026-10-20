/**
 * Hand-written types for the `organizer` schema.
 * These mirror SCHEMA.sql EXACTLY (column names, nullability, string literals).
 * Will be replaced by `supabase gen types` output in a later phase.
 */

export type ItemKind = 'tarea' | 'evento' | 'pago' | 'recordatorio';
export type ItemStatus = 'pendiente' | 'en_curso' | 'hecho' | 'cancelado';
export type ItemOrigin = 'manual' | 'imagen';
export type ItemPriority = 0 | 1 | 2;

export interface Category {
  id: string;
  user_id: string;
  name: string;
  color: string;
  icon: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface Item {
  id: string;
  user_id: string;
  category_id: string;
  title: string;
  description: string | null;
  kind: ItemKind;
  status: ItemStatus;
  priority: number;
  starts_at: string | null;
  ends_at: string | null;
  all_day: boolean;
  recurrence_rule: string | null;
  completed_at: string | null;
  origin: ItemOrigin;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface ItemNote {
  id: string;
  item_id: string;
  user_id: string;
  body: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}