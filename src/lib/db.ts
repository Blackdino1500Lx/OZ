import Dexie, { type Table } from 'dexie';
import type { Category, Item, ItemNote } from '@/types/database';

export interface SyncQueueItem {
  id?: number;
  table: 'items' | 'categories' | 'item_notes';
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  recordId: string;
  payload: Record<string, unknown>;
  createdAt: number;
}

export class OrganizerDB extends Dexie {
  items!: Table<Item, string>;
  categories!: Table<Category, string>;
  item_notes!: Table<ItemNote, string>;
  sync_queue!: Table<SyncQueueItem, number>;

  constructor() {
    super('OrganizerDB');
    this.version(1).stores({
      items: 'id, user_id, category_id, starts_at, status, updated_at, deleted_at',
      categories: 'id, user_id, sort_order, updated_at, deleted_at',
      item_notes: 'id, item_id, user_id, created_at, updated_at, deleted_at',
      sync_queue: '++id, table, action, recordId, createdAt',
    });
  }
}

export const db = new OrganizerDB();