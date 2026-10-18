-- =====================================================================
-- Organizador personal - Fase 1 (manual)
-- Esquema aislado "organizer" dentro de la DB Supabase existente.
-- Ejecutar en el SQL editor / como migración. Idempotente donde es posible.
-- =====================================================================

create schema if not exists organizer;

-- ---------- Utilidad: updated_at automático ----------
create or replace function organizer.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------- categories ----------
create table if not exists organizer.categories (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name        text not null check (char_length(name) between 1 and 60),
  color       text not null check (color ~ '^#[0-9a-fA-F]{6}$'),
  icon        text,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz,
  unique (user_id, name)
);

-- ---------- items (tareas, eventos, pagos, recordatorios) ----------
create table if not exists organizer.items (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null default auth.uid() references auth.users(id) on delete cascade,
  category_id      uuid not null references organizer.categories(id) on delete restrict,
  title            text not null check (char_length(title) between 1 and 200),
  description      text,
  kind             text not null default 'tarea'
                   check (kind in ('tarea','evento','pago','recordatorio')),
  status           text not null default 'pendiente'
                   check (status in ('pendiente','en_curso','hecho','cancelado')),
  priority         smallint not null default 0 check (priority between 0 and 2),
  starts_at        timestamptz,
  ends_at          timestamptz,
  all_day          boolean not null default false,
  recurrence_rule  text,                       -- RRULE (iCal), se usa en fase 4
  completed_at     timestamptz,
  origin           text not null default 'manual'
                   check (origin in ('manual','imagen')),  -- 'imagen' se activa después
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  deleted_at       timestamptz,
  check (ends_at is null or starts_at is null or ends_at >= starts_at)
);

create index if not exists items_user_starts_idx
  on organizer.items (user_id, starts_at) where deleted_at is null;
create index if not exists items_user_status_idx
  on organizer.items (user_id, status) where deleted_at is null;
create index if not exists items_category_idx
  on organizer.items (category_id);

-- ---------- item_notes (seguimiento persistente) ----------
create table if not exists organizer.item_notes (
  id          uuid primary key default gen_random_uuid(),
  item_id     uuid not null references organizer.items(id) on delete cascade,
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  body        text not null check (char_length(body) >= 1),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz
);

create index if not exists item_notes_item_idx
  on organizer.item_notes (item_id, created_at);

-- ---------- triggers updated_at ----------
drop trigger if exists trg_categories_updated on organizer.categories;
create trigger trg_categories_updated before update on organizer.categories
  for each row execute function organizer.set_updated_at();

drop trigger if exists trg_items_updated on organizer.items;
create trigger trg_items_updated before update on organizer.items
  for each row execute function organizer.set_updated_at();

drop trigger if exists trg_item_notes_updated on organizer.item_notes;
create trigger trg_item_notes_updated before update on organizer.item_notes
  for each row execute function organizer.set_updated_at();

-- ---------- RLS ----------
alter table organizer.categories enable row level security;
alter table organizer.items      enable row level security;
alter table organizer.item_notes enable row level security;

drop policy if exists categories_owner on organizer.categories;
create policy categories_owner on organizer.categories
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- El ítem solo puede usar categorías propias
drop policy if exists items_owner on organizer.items;
create policy items_owner on organizer.items
  for all to authenticated
  using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from organizer.categories c
      where c.id = category_id and c.user_id = auth.uid()
    )
  );

-- La nota solo puede colgar de ítems propios
drop policy if exists item_notes_owner on organizer.item_notes;
create policy item_notes_owner on organizer.item_notes
  for all to authenticated
  using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from organizer.items i
      where i.id = item_id and i.user_id = auth.uid()
    )
  );

-- ---------- Permisos para la API (PostgREST) ----------
grant usage on schema organizer to authenticated;
grant select, insert, update, delete on all tables in schema organizer to authenticated;
alter default privileges in schema organizer
  grant select, insert, update, delete on tables to authenticated;

-- NOTA: en Supabase self-hosted hay que exponer el esquema en la API:
--   PGRST_DB_SCHEMAS=public,storage,graphql_public,organizer   (docker .env / compose)
-- y reiniciar el contenedor rest. En el cliente: createClient(url, key, { db: { schema: 'organizer' } })

-- ---------- Categorías iniciales (opcional, ejecutar con tu user_id) ----------
-- insert into organizer.categories (user_id, name, color, sort_order) values
--   ('<TU_USER_ID>', 'Trabajo',  '#3B82F6', 1),
--   ('<TU_USER_ID>', 'Personal', '#10B981', 2),
--   ('<TU_USER_ID>', 'Pagos',    '#F59E0B', 3);